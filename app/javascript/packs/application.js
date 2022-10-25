import Rails from "@rails/ujs"
import Turbolinks from "turbolinks"
import * as ActiveStorage from "@rails/activestorage"
import "channels"
import "controllers"
import jquery from "jquery"
window.jQuery = jquery
window.$ = jquery

import tmi from "tmi.js"

// require('packs/twitch')

Rails.start()
Turbolinks.start()
ActiveStorage.start()

console.log('Webpacker loaded')
