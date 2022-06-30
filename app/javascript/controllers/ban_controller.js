import { Controller } from '@hotwired/stimulus'

export default class extends Controller {
  userinfo() {
    let info = `<div id="user-info">
                  <p>
                    <span id="to600" data-controller="ban", data-action="click->ban#timeout">10m</span>
                    <span id="to3600" data-controller="ban", data-action="click->ban#timeout">1h</span>
                    <span id="to86400" data-controller="ban", data-action="click->ban#timeout">1d</span>
                    <span id="to604800" data-controller="ban", data-action="click->ban#timeout">1w</span>
                    <span id="toP" data-controller="ban", data-action="click->ban#timeout">
                      <img src="/images/slash.svg" id="ch-badge">
                    </span>
                  </p>
                  <span id="close" data-controller="ban", data-action="click->ban#close">✕</span>
                </div>`

    $('#user-info').length == 0 ? $(this.element).parent().append(info) : $('#user-info').remove()
  }

  close() {
    $('#user-info').remove()
  }

  timeout() {
    let duration = ($(this.element).attr('id')).slice(2)
  }
}
