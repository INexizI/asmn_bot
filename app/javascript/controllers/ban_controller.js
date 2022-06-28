import { Controller } from '@hotwired/stimulus'

export default class extends Controller {
  userinfo() {
    const css = {
      'display': 'flex',
      'justify-content': 'center',
      'align-items': 'center',
      'font-size': '15px'
    }
    $(this.element).parent().next().fadeToggle('fast').css(css)
  }
}
