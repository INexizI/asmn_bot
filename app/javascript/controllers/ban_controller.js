import { Controller } from '@hotwired/stimulus'
import tmi from 'tmi.js'

const mods = [
  { name: process.env.TEST_TEST },
]

const config = {
  options: { debug: true },
  connection: {
    cluster: 'aws',
    reconnect: true,
    secure: true,
    timeout: 180000,
    reconnectDecay: 1.4,
    reconnectInterval: 1000
  },
  channels: [ process.env.BOT_NAME ],
  identity: {
    username: process.env.BOT_NAME,
    password: process.env.BOT_PASSWORD,
  }
}
const client = new tmi.Client(config)
client.connect()

export default class extends Controller {
  userinfo() {
    let info = `<div id="user-info">
                  <p>
                    <span id="to600" data-controller="ban", data-action="click->ban#timeout">10m</span>
                    <span id="to3600" data-controller="ban", data-action="click->ban#timeout">1h</span>
                    <span id="to86400" data-controller="ban", data-action="click->ban#timeout">1d</span>
                    <span id="to604800" data-controller="ban", data-action="click->ban#timeout">1w</span>
                    <span id="toB" data-controller="ban", data-action="click->ban#timeout">
                      <img src="/images/slash.svg" id="ch-badge" title="Ban user">
                    </span>
                    <span id="toD" data-controller="ban", data-action="click->ban#timeout">
                      <img src="/images/slash.svg" id="ch-badge" title="Delete message">
                    </span>
                  </p>
                  <span id="close" data-controller="ban", data-action="click->ban#close">✕</span>
                </div>`
    let username = $(this.element).text().slice(0, -2).toLocaleLowerCase()
    let mod = mods.find(({name}) => name === username)
    $('#user-info').length == 0 && mod.name === username ? $(this.element).parent().append(info) : $('#user-info').remove()
  }

  close() {
    $('#user-info').remove()
  }

  timeout() {
    let username = $(this.element).parents(1).find('#ch-user').text().slice(0, -2).toLocaleLowerCase()
    let duration = $(this.element).attr('id').slice(2)
    let mod = mods.find(({name}) => name === username)

    switch (duration) {
      case '600':
      case '3600':
      case '86400':
      case '604800':
        mod.name !== username ? client.timeout(process.env.BOT_NAME, username, duration, 'banned via ASMN') : console.log(`you can't ban another mods!`)
        break
      case 'B':
        mod.name !== username ? client.ban(process.env.BOT_NAME, username, 'banned via ASMN') : console.log(`you can't ban another mods!`)
        break
      case 'D':
        // FIXME(D): for delete message need to know message id
        mod.name !== username ? client.deletemessage(process.env.BOT_NAME, username) : console.log(`you can't ban another mods!`)
        break
    }
  }
}
