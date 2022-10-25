import React, { Component } from "react"
import tmi from 'tmi.js'
import CryptoJS from "crypto-js"
import jquery from "jquery"
window.$ = jquery

const e = React.createElement
const { CREDENTIALS, TWITCH, SPOTIFY, SMILE, MESSAGE, BOT_CONFIG, EMOTES, SOUND_COMMAND, BAN_LIST, CHAT_BAN_PHRASE, ANNOUNCE_LIST, SITE_WHITELIST, REGEXP } = require('../packs/config')

const queryString = require('query-string')
const Buffer = require('buffer/').Buffer
const basic = Buffer.from(`${CREDENTIALS.spotify_client_id}:${CREDENTIALS.spotify_client_secret}`).toString('base64')
const sleep = ms => new Promise(res => setTimeout(() => res(), ms))
const regexpCommand = new RegExp(REGEXP.command)
const client = new tmi.Client(BOT_CONFIG)
client.connect().catch(console.error)

let announceCount = 0;
let skip_count = 0;
let getAllBadges;
let allEmotes = [];

const getAccessToken = async () => {
  const response = await fetch(SPOTIFY.token, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: queryString.stringify({
      grant_type: 'refresh_token',
      refresh_token: CREDENTIALS.spotify_refresh_token
    }),
  });

  return await response.json();
};
const getPlaybackState = async () => {
  const { access_token } = await getAccessToken();
  return fetch(SPOTIFY.playback_state, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
};
const shuffleSong = async (param) => {
  const { access_token } = await getAccessToken();
  return fetch(`${SPOTIFY.shuffle}?state=${param}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
};
const repeatSong = async (param) => {
  const { access_token } = await getAccessToken();
  return fetch(`${SPOTIFY.repeat}?state=${param}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
};
const prevSong = async () => {
  const { access_token } = await getAccessToken();
  return fetch(SPOTIFY.previous, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  })
};
const nextSong = async () => {
  const { access_token } = await getAccessToken();
  return fetch(SPOTIFY.next, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
};
const pauseSong = async () => {
  const { access_token } = await getAccessToken();
  return fetch(SPOTIFY.pause, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
};
const playSong = async () => {
  const { access_token } = await getAccessToken();
  return fetch(SPOTIFY.play, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
};
const volumeSong = async (param) => {
  const { access_token } = await getAccessToken();
  return fetch(`${SPOTIFY.volume}?volume_percent=${param}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
};
const spotifyCurrentTrack = async () => {
  const response = await getPlaybackState();
  // console.log(`response status: ${response.status}`)
  if (response.status === 204 || response.status > 400) {
    console.log(`Spotify offline`);
    $('#sp-title').text(`Spotify offline`);
    $('#sp-artist, #sp-albumName, #sp-albumImg, #sp-link').empty();
  } else if (response.status === 200) {
    const song = await response.json();
    const isPlaying = song.is_playing;
    // if (song.item === null) {
    //   $('#sp-title').text(`Current song can't be find`)
    //   $('#sp-artist, #sp-albumName, #sp-albumImg, #sp-link').empty()
    if (!isPlaying) {
      $('#sp-title').text(`Music is not playing`)
      $('#sp-artist, #sp-albumName, #sp-albumImg, #sp-link').empty()
    } else {
      const title = song.item.name;
      const artist = song.item.artists.map((_artist) => _artist.name).join(', ');
      // const album = song.item.album.name;
      const albumImageUrl = song.item.album.images[0].url;
      const songUrl = song.item.external_urls.spotify;
      const currentSong = [
        { title: title },
        { artist: artist },
        // { album: album },
        { albumImageUrl: albumImageUrl },
        { songUrl: songUrl }
      ]
      $('#sp-title').text(title);
      $('#sp-artist').text(artist);
      // $('#sp-albumName').text(album);
      $('#sp-albumImg').html(`<img src="${albumImageUrl}">`);
    }
    return song.item;
  }
};

setInterval(() => spotifyCurrentTrack(), 15000);

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

class Bot extends React.Component {
  async componentDidMount() {
    await spotifyCurrentTrack();
  }

  async updSongInfo() {
    await spotifyCurrentTrack();
    console.log(`Loading Spotify Data...`);
  }
  async shuffle() {
    await shuffleSong();
  }
  async repeat() {
    await repeatSong();
  }
  async skipToNext() {
    await nextSong().then(sleep(500).then(() => spotifyCurrentTrack()));
  }
  async skipToPrev() {
    await prevSong().then(sleep(500).then(() => spotifyCurrentTrack()));
  }
  async pause() {
    await pauseSong();
  }
  async play() {
    await playSong();
  }
  async mute() {
    await volumeSong(0);
  }

  render() {
    return [
      e("div", { key: "img", className: "img" },
        e("div", { className: "chat" }, null),
        e("iframe", { id:"chat", src: `https://www.twitch.tv/embed/${CREDENTIALS.twitch_user_name}/chat?parent=localhost`, frameBorder: "0", title: "Chat"}, null)
      ),
      e("div", { key: "song", className: "song" },
        e("p", { id: "sp-albumImg" }, null),
        e("p", { id: "sp-title" }, null),
        e("p", { id: "sp-artist" }, null)
      ),
      e("div", { key: "btn", className: "btn" },
        e("button", { id: "btn-info", onClick: this.updSongInfo }, "Update Info"),
        e("div", { className: "btn-ctrl" },
          e("button", { id: "btn-shuffle", onClick: this.shuffle }, e("img", { src: '/images/shuffle.svg' }, null)),
          e("button", { id: "btn-previous", onClick: this.skipToPrev }, e("img", { src: '/images/skip-back.svg' }, null)),
          e("button", { id: "btn-pause", onClick: this.pause }, e("img", { src: '/images/play.svg' }, null)),
          e("button", { id: "btn-forward", onClick: this.skipToNext }, e("img", { src: '/images/skip-forward.svg' }, null)),
          e("button", { id: "btn-repeat", onClick: this.repeat }, e("img", { src: '/images/repeat.svg' }, null)),
          e("button", { id: "btn-mute", onClick: this.mute }, e("img", { src: '/images/volume-x.svg' }, null))
        )
      )
    ]
  }
};

const App = () => {
  return <Bot />
}

export default App
