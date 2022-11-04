import { Controller } from "@hotwired/stimulus"
// import { createElement } from "react"
import { createRoot } from "react-dom/client"
// import Asmn from "../components/Asmn"
// import User from "../components/User"

// export default class extends Controller {
//   connect() {
//     const e = createElement;
//     const root = createRoot(document.getElementById('asmn'));
//     root.render([e(Asmn, {key: 'asmn'}), e(User, {key: 'user'})]);
//   }
// }

export default class extends Controller {
  //Load the React code when we initialize
  initialize() {
    console.log(`initialize`);
    this.reactComponentPromise = import("../components/reactComponent");
  }
  async connect() {
    console.log(`сonnect`);
    this.reactComponent = await this.reactComponentPromise;

    const root = document.getElementById("asmn");
    const props = {
      onChange: this.onChange.bind(this)
    }
    this.reactComponent.renderApp(props, root);
  }
  onChange() {
    console.log(`onChange`);
  }
  disconnect() {
    console.log(`disconnect`);
    const root = document.body.getElementById("asmn");
    this.reactComponent.destroyApp(root);
  }
}
