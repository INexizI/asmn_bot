import { Controller } from '@hotwired/stimulus'
import tmi from 'tmi.js'
import CryptoJS from "crypto-js"

const { CREDENTIALS, BOT_CONFIG } = require('../config');
const client = new tmi.Client(BOT_CONFIG)
client.connect()

export default class extends Controller {
  async getAllMods() {
    let x = []
    await fetch(`https://tmi.twitch.tv/group/user/${CREDENTIALS.twitch_user_name}/chatters`).then(res => res.json()).then(res => {
      $.each(res.chatters.moderators, (i, n) => {
        x.push({ name: n })
      })
    })
    return x
  }

  async userinfo() {
    let info = (`<div id="user-info">
                  <p>
                    <span id="user-pic" data-controller="ban" data-action="click->ban#info">Info</span>
                  </p>
                  <p>
                    <span id="to600" data-controller="ban" data-action="click->ban#timeout">10m</span>
                    <span id="to3600" data-controller="ban" data-action="click->ban#timeout">1h</span>
                    <span id="to86400" data-controller="ban" data-action="click->ban#timeout">1d</span>
                    <span id="to604800" data-controller="ban" data-action="click->ban#timeout">1w</span>
                    <span id="toB" data-controller="ban" data-action="click->ban#timeout">
                      <img src="/images/slash.svg" id="ch-badge" title="Ban user">
                    </span>
                    <span id="toD" data-controller="ban" data-action="click->ban#timeout">
                      <img src="/images/slash.svg" id="ch-badge" title="Delete message">
                    </span>
                  </p>
                  <span id="close" data-controller="ban" data-action="click->ban#close">✕</span>
                </div>`)
    let username = $(this.element).text().toLocaleLowerCase()
    let x = await this.getAllMods()
    let mod = x.find(({ name }) => name === username)

    switch (username) {
      case CREDENTIALS.twitch_user_name:
      case process.env.TEST_TEST:
        $('#user-info').length == 0 ? $(this.element).parent().append(info) : $('#user-info').remove()
        break
      default:
        console.log(`User`)
        $('#user-info').length == 0 ? $(this.element).parent().append(info) : $('#user-info').remove()
    }
  }

  close() {
    $('#user-info').remove()
  }
  info() {
    console.log('Info')
  }

  async timeout() {
    let encryptData = $(this.element).parents(1).prev('#ch-user').attr('data-target')
    let bytes = CryptoJS.AES.decrypt(encryptData, CREDENTIALS.crypto_key)
    let msgID = bytes.toString(CryptoJS.enc.Utf8)

    let username = $(this.element).parents(1).find('#ch-user').text().toLocaleLowerCase()
    let duration = $(this.element).attr('id').slice(2)
    let x = await this.getAllMods()
    let mod = x.find(({ name }) => name === username)

    switch (duration) {
      case '600':
      case '3600':
      case '86400':
      case '604800':
        console.log(`Timed out by ASMN for ${duration} seconds`)
        // client.timeout(process.env.BOT_NAME, username, duration, 'banned via ASMN')
        break
      case 'B':
        console.log(`Banned by ASMN`)
        // client.ban(process.env.BOT_NAME, username, 'banned via ASMN')
        break
      case 'D':
        // FIXME(D): for delete message need to know message id
        console.log(`Message Deleted by ASMN`)
        // client.deletemessage(process.env.BOT_NAME, msgID)
        break
    }
  }
}
