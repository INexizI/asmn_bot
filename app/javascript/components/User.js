import React, { Component, useState } from "react";
import styled from "styled-components";
import { Modal } from "./Modal";
import { GlobalStyle } from "../packs/globalStyle";
import CryptoJS from "crypto-js";
import tmi from 'tmi.js';
import jquery from "jquery";
window.$ = jquery;

const e = React.createElement;
const { CREDENTIALS, TWITCH, SPOTIFY, SMILE, MESSAGE, BOT_CONFIG, EMOTES, SOUND_COMMAND, BAN_LIST, CHAT_BAN_PHRASE, ANNOUNCE_LIST, SITE_WHITELIST, REGEXP } = require('../packs/config');

class Ban extends React.Component {
  componentDidMount() {
    console.log(`User component`);
  }

  render() {
    return [
      e("div", { key: "info", id: "user-info" },
        e("p", null,
          e("span", { id: "user-pic", 'data-controller': "ban", 'data-action': "click->ban#info" }, "Info")
        ),
        e("hr", null, null),
        e("p", null,
          e("span", { id: "toUnban", 'data-controller': "ban", 'data-action': "click->ban#timeout" },
            e("img", { src: "/images/check-circle.svg", id: "ch-badge", title: "Unban" })
          ),
          e("span", { id: "to600", 'data-controller': "ban", 'data-action': "click->ban#timeout", title: "10 min" }, "10m"),
          e("span", { id: "to3600", 'data-controller': "ban", 'data-action': "click->ban#timeout", title: "1 hour" }, "1h"),
          e("span", { id: "to86400", 'data-controller': "ban", 'data-action': "click->ban#timeout", title: "1 day" }, "1d"),
          e("span", { id: "to604800", 'data-controller': "ban", 'data-action': "click->ban#timeout", title: "1 week" }, "1w"),
          e("span", { id: "toBan", 'data-controller': "ban", 'data-action': "click->ban#timeout" },
            e("img", { src: "/images/slash.svg", id: "ch-badge", title: "Ban" })
          ),
          e("span", { id: "toDelete", 'data-controller': "ban", 'data-action': "click->ban#timeout" },
            e("img", { src: "/images/trash-2.svg", id: "ch-badge", title: "Delete message" }, null)
          )
        ),
        e("span", { id: "close", 'data-controller': "ban", 'data-action': "click->ban#close" },
          e("img", { src: "/images/x.svg", id: "ch-badge" }, null)
        )
      )
    ]
  }
}

// const User = () => {
//   return <Ban />
// }

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;
const Button = styled.button`
  min-width: 100px;
  padding: 16px 32px;
  border-radius: 4px;
  border: none;
  background: #141414;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
`;

const User = () => {
  // return (
  //   <>
  //     <div id="user-info">
  //       <p>
  //         <span id="user-pic" data-controller="ban" data-action="click->ban#info">Info</span>
  //       </p>
  //       <hr/>
  //       <p>
  //         <span id="toUnban" data-controller="ban" data-action="click->ban#timeout">
  //           <img src="/images/check-circle.svg" id="ch-badge" title="Unban"/>
  //         </span>
  //         <span id="to600" data-controller="ban" data-action="click->ban#timeout" title="10 min">10m</span>
  //         <span id="to3600" data-controller="ban" data-action="click->ban#timeout" title="1 hour">1h</span>
  //         <span id="to86400" data-controller="ban" data-action="click->ban#timeout" title="1 day">1d</span>
  //         <span id="to604800" data-controller="ban" data-action="click->ban#timeout" title="1 week">1w</span>
  //         <span id="toBan" data-controller="ban" data-action="click->ban#timeout">
  //           <img src="/images/slash.svg" id="ch-badge" title="Ban"/>
  //         </span>
  //         <span id="toDelete" data-controller="ban" data-action="click->ban#timeout">
  //           <img src="/images/trash-2.svg" id="ch-badge" title="Delete message"/>
  //           </span>
  //       </p>
  //       <span id="close" data-controller="ban" data-action="click->ban#close">
  //         <img src="/images/x.svg" id="ch-badge"/>
  //       </span>
  //     </div>
  //   </>
  // )
  const [showModal, setShowModal] = useState(false)
  const openModal = () => {
    setShowModal(prev => !prev)
  }

  return (
    <>
      <Container>
        <Button onClick={openModal}>Modal</Button>
        <Modal showModal={showModal} setShowModal={setShowModal}/>
        <GlobalStyle/>
      </Container>
    </>
  )
}

export default User
