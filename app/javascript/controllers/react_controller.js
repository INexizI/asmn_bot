import { Controller } from "@hotwired/stimulus"
import React from "react"
import ReactDOM from "react-dom/client"
import Asmn from "../components/Asmn"
import User from "../components/User"

export default class extends Controller {
  connect() {
    const e = React.createElement;
    const root = ReactDOM.createRoot(document.getElementById('asmn'));
    root.render([e(Asmn, {key: 'asmn'}), e(User, {key: 'user'})]);
  }
}
