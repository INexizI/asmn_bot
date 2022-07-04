import { Controller } from '@hotwired/stimulus'
import tmi from 'tmi.js'

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
  async getTwitchToken() {
      let param = $.param({
        client_id: process.env.TCLIENT_ID,
        client_secret: process.env.TCLIENT_SECRET,
        grant_type: 'client_credentials',
        scope: [
          'user:read:email',
          'moderation:read',
          'channel:manage:broadcast',
        ]
      })
      const { access_token } = await fetch(`https://id.twitch.tv/oauth2/token?${param}`, { method: 'POST' }).then(res => res.json())
      return await access_token
  }

  async useTwitchToken() {
    // twitch functions w/ token here
  }

  async getAllMods() {
    return await fetch(`https://tmi.twitch.tv/group/user/${process.env.BOT_NAME}/chatters`).then(res => res.json()).then(res => res.chatters.moderators)
  }

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
    let username = $(this.element).text().toLocaleLowerCase()

    $('#user-info').length == 0 && (username === process.env.BOT_NAME) ? $(this.element).parent().append(info) : $('#user-info').remove()
  }

  close() {
    $('#user-info').remove()
  }

  async timeout() {
    let username = $(this.element).parents(1).find('#ch-user').text().toLocaleLowerCase()
    let duration = $(this.element).attr('id').slice(2)
    let mods = await this.getAllMods()
    let mod = mods[0]

    switch (duration) {
      case '600':
      case '3600':
      case '86400':
      case '604800':
        mod !== username ? client.timeout(process.env.BOT_NAME, username, duration, 'banned via ASMN') : console.log(`you can't ban another mods!`)
        break
      case 'B':
        mod !== username ? client.ban(process.env.BOT_NAME, username, 'banned via ASMN') : console.log(`you can't ban another mods!`)
        break
      case 'D':
        // FIXME(D): for delete message need to know message id
        // mod !== username ? client.deletemessage(process.env.BOT_NAME, username) : console.log(`you can't ban another mods!`)
        break
    }
  }
}
