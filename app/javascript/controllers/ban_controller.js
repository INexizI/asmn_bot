import { Controller } from '@hotwired/stimulus'
import tmi from 'tmi.js'
import CryptoJS from "crypto-js"

const { CREDENTIALS, BOT_CONFIG, TWITCH } = require('../packs/config')
const client = new tmi.Client(BOT_CONFIG)
client.connect()

var info = (`<div id="user-info">
              <p>
                <span id="user-pic" data-controller="ban" data-action="click->ban#info">Info</span>
              </p>
              <hr>
              <p>
                <span id="toUnban" data-controller="ban" data-action="click->ban#timeout">
                  <img src="/images/check-circle.svg" id="ch-badge" title="Unban">
                </span>
                <span id="to600" data-controller="ban" data-action="click->ban#timeout" title="10 min">10m</span>
                <span id="to3600" data-controller="ban" data-action="click->ban#timeout" title="1 hour">1h</span>
                <span id="to86400" data-controller="ban" data-action="click->ban#timeout" title="1 day">1d</span>
                <span id="to604800" data-controller="ban" data-action="click->ban#timeout" title="1 week">1w</span>
                <span id="toBan" data-controller="ban" data-action="click->ban#timeout">
                  <img src="/images/slash.svg" id="ch-badge" title="Ban">
                </span>
                <span id="toDelete" data-controller="ban" data-action="click->ban#timeout">
                  <img src="/images/trash-2.svg" id="ch-badge" title="Delete message">
                </span>
              </p>
              <span id="close" data-controller="ban" data-action="click->ban#close">
                <img src="/images/x.svg" id="ch-badge">
              </span>
            </div>`)

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
    let username = $(this.element).text().toLocaleLowerCase()
    // let x = await this.getAllMods()
    // let mod = x.find(({ name }) => name === username)

    // switch (username) {
    //   case CREDENTIALS.twitch_user_name:
    //   case mod.name:
    //     $('#user-info').length == 0 ? $(this.element).parent().append(info) : $('#user-info').remove()
    //     break
    //   default:
    //     $('#user-info').length == 0 ? $(this.element).parent().append(info) : $('#user-info').remove()
    // }
    // username = null
    $('#user-info').length == 0 ? $(this.element).parent().append(info) : $('#user-info').remove()
  }

  close() {
    $('#user-info').remove()
  }
  async info() {
    console.log('Info')
    let y = await this.getAllMods()
    console.log(y)
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
        console.log(`${username} timed out for ${duration} seconds`)
        // client.timeout(process.env.BOT_NAME, username, duration, 'banned via ASMN')
        break
      case 'Ban':
        console.log(`${username} banned`)
        // client.ban(process.env.BOT_NAME, username, 'banned via ASMN')
        break
      case 'Unban':
        console.log(`${username} unbanned`)
        // client.unban(process.env.BOT_NAME, username, 'banned via ASMN')
        break
      case 'Delete':
        console.log(`${username} message was deleted`)
        // client.deletemessage(process.env.BOT_NAME, msgID)
        break
    }
  }
}
