import React from "react";
import { createRoot } from "react-dom/client";
import Asmn from "./Asmn.jsx";

function renderApp(props, node) {
  const root = createRoot(node);
  root.render(<Asmn {...props}/>);
}

function destroyApp(node) {
  unmountComponentAtNode(node);
}

export {
  renderApp,
  destroyApp
}
