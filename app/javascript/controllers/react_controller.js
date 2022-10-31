import { Controller } from "@hotwired/stimulus"
import { createElement } from "react"
import { createRoot } from "react-dom/client"
import Asmn from "../components/Asmn"
import User from "../components/User"

export default class extends Controller {
  connect() {
    const e = createElement;
    const root = createRoot(document.getElementById('asmn'));
    root.render([e(Asmn, {key: 'asmn'}), e(User, {key: 'user'})]);
  }
}
