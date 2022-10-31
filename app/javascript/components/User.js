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
