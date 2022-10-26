import React, { Component } from "react";
import tmi from 'tmi.js';
import CryptoJS from "crypto-js";
import jquery from "jquery";
window.$ = jquery;

const e = React.createElement;
const { CREDENTIALS, TWITCH, SPOTIFY, SMILE, MESSAGE, BOT_CONFIG, EMOTES, SOUND_COMMAND, BAN_LIST, CHAT_BAN_PHRASE, ANNOUNCE_LIST, SITE_WHITELIST, REGEXP } = require('../packs/config');

const queryString = require('query-string');
const Buffer = require('buffer/').Buffer;
const basic = Buffer.from(`${CREDENTIALS.spotify_client_id}:${CREDENTIALS.spotify_client_secret}`).toString('base64');
const sleep = ms => new Promise(res => setTimeout(() => res(), ms));
const regexpCommand = new RegExp(REGEXP.command);

let allEmotes = [];
let allBadges = [];

/* BOT CONNECTION */
const client = new tmi.Client(BOT_CONFIG);
client.connect().catch(console.error);
/* TWITCH API */
const getTwitchToken = async () => {
  let param = $.param({
    client_id: CREDENTIALS.twitch_client_id,
    client_secret: CREDENTIALS.twitch_client_secret,
    grant_type: 'client_credentials',
    scope: [
      'user:read:email',
      'moderation:read',
      'channel:manage:polls',
      'channel:manage:broadcast',
      'channel:manage:predictions'
    ]
  });
  let url = `${TWITCH.token}?${param}`
  const response = await fetch(url, {
    method: 'POST',
  });

  return await response.json();
};
const useTwitchToken = async (url, param) => {
  const { access_token } = await getTwitchToken();
  return fetch(`${url}?${param}`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Client-Id': CREDENTIALS.twitch_client_id,
    },
  });
};
/* SPOTIFY API */
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
    $('#sp-title').text(`Response error`);
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
/* EVENTS */
client.on('connected', (address, port) => {
  console.log(`Bot Connected: ${address}:${port}`);
});
client.on('disconnected', (reason) => {
  console.log(`Bot Disconnected: ${reason}`)
});
client.on('hosted', (channel, username, viewers, autohost) => {
  client.say(channel, `Thank you @${username} for the host of ${viewers}!`)
});
client.on('subscription', (channel, username, method, message, tags) => {
  client.say(channel, `Thank you @${username} for subscribing!`)
});
client.on('raided', (channel, username, viewers) => {
  client.say(channel, `Thank you @${username} for the raid of ${viewers}!`)
});
client.on('cheer', (channel, tags, message) => {
  client.say(channel, `Thank you @${tags.username} for the ${tags.bits} bits!`)
});
client.on('giftpaidupgrade', (channel, username, sender, tags) => {
  client.say(channel, `Thank you @${username} for continuing your gifted sub!`)
});
client.on('hosting', (channel, target, viewers) => {
  client.say(channel, `We are now hosting ${target} with ${viewers} viewers!`)
});
client.on('reconnect', () => {
  console.log('Reconnecting...')
});
client.on('resub', (channel, username, months, message, tags, methods) => {
  client.say(channel, `Thank you @${username} for the ${tags['msg-param-cumulative-months']} sub!`)
});
client.on('subgift', (channel, username, streakMonths, recipient, methods, tags) => {
  client.say(channel, `Thank you @${username} for gifting a sub to ${recipient}}.`);

  // this comes back as a boolean from twitch, disabling for now
  // "msg-param-sender-count": false
  // const senderCount =  ~~tags["msg-param-sender-count"];
  // client.say(channel,
  //   `${username} has gifted ${senderCount} subs!`
  // )});
});
client.on('ban', (channel, username, reason) => {
  console.log(`${username} banned in ${channel}. Reason: ${reason == null ? 'moderators' : reason}.`)
});
client.on('chat', (channel, tags, message, self) => {
  if (self) return;
  let msg = message.toLowerCase();
  let messageType = msg.charAt(0);

  /*
  // NOTE(D): old method for commands
  const [raw, command, argument] = message.match(regexpCommand);
  const { response } = commands[command] || {};
  typeof response === 'function' ? client.action(channel, response(tags.username)) : client.action(channel, response);
  */

  if (messageType === '!') {
    const [raw, command, argument] = msg.match(regexpCommand);
    switch (command) {
      /* --- Spotify --- */
      case 'song':
        spotifyCurrentTrack().then(res => {
          if (typeof res === 'object')
            client.action(channel, `${res.artists.map((_artist) => _artist.name).join(', ')} - ${res.name} 👇 ${res.external_urls.spotify}`);
        });
        break;
      /* --- Twitch --- */
      case 'bot':
        client.say(channel, `@${tags.username}, KonCha`);
        break;
      case 'roll':
        client.action(channel, `@${tags.username} roll: [ ${Math.floor(Math.random() * 100) + 1} ]`);
        break;
      case 'dice':
        client.action(channel, `@${tags.username} roll: [ ${Math.floor(Math.random() * 6) + 1} ]`);
        break;
      case 'announce':
        setInterval(() => announceMessage(client, channel), 30000);
        break;
      case 'follow':
        getUserFollowTime(client, tags, channel);
        break;
      case 'ping':
        client.ping().then(data => client.action(channel, `@${tags.username}, your ping is ${Math.floor(Math.round(data*1000))}ms`));
        break;
      case 'ban':
        client.action(channel, `${argument} ${CHAT_BAN_PHRASE[(Math.floor(Math.random() * CHAT_BAN_PHRASE.length))].text}`);
        break;
      /* --- Sound commands --- */
      case 'sound':
        let x = 'Sound commands:';
        $.each(SOUND_COMMAND, function(i, n) {
          x += ` #${i}`;
        });
        client.action(channel, x);
        break;
      /* --- Links --- */
      case 'github':
        client.action(channel, `GitHub: ${process.env.GITHUB}`);
        break;
    }
  } else if (messageType === MESSAGE.prefix) {
    let soundCommand = msg.substring(1);
    let audio = new Audio(`/sounds/${soundCommand}.wav`);
    // audio.autoplay = true;
    // audio.muted = true;
    audio.volume = 0.1;
    audio.play();
  } else {
    const ban = banCheck(msg);
    ban ? client.deletemessage(channel, tags.id) : onMessageHandler(channel, tags, message, self);
    /*
    // NOTE(D): to banned user, use this string below 👇
    ban ? client.ban(channel, username, reason) : onMessageHandler(channel, tags, message, self);
    */
  };

});
/* FUNCTIONS */
async function onMessageHandler(channel, tags, message, self) {
  const r = message.replace(REGEXP.message);

  /*
  // FIXME(D): high latency on callback/return user profile picture
  const { profile_image_url } = await getUserInfo(client, message, tags, channel, self);
  <span><img src=${profile_image_url} id="ch-user-pic"></span>
  */

  const cryptData = CryptoJS.AES.encrypt(tags.id, CREDENTIALS.crypto_key).toString();

  const b = replaceBadge(tags.badges);
  const e = replaceElements(r);

  $('.chat').append(`
      <div id="ch-block">
        <p id="user-badge">${b}</p>
        <p id="user-name">
          <span style="color: ${tags.color}" id="ch-user" data-controller="ban" data-action="click->ban#userinfo" data-target="${cryptData}">${tags['display-name']}</span>
        </p>
        <span id="ch-msg">${e}</span>
      </div>`)
    .animate({scrollTop: $('.chat').prop('scrollHeight')}, 1000);
  clearChat();
};
function replaceElements(e) {
  let m = [];
  let emotes = allEmotes;
  $.each(e.split(' '), function(i, n) {
    let urlCheck = n.split('/')[2];
    const checkWL = SITE_WHITELIST.find(({ link }) => link === urlCheck);
    const emote = emotes.find(({ name }) => name === n);
    if (emote)
      m.push(`<img src=${emote.link} id="ch-emote">`);
    else if (checkWL)
      $.ajax({ url: n, type: 'get', dataType: 'html', async: false, success: function(data) {
        let img, site, title;
        data = $.parseHTML(data);
        const meta = getMetaData(data);
        console.log(meta);
        site = meta.find(({ name }) => name === 'twitter:site');
        title = meta.find(({ name }) => name === 'twitter:title');
        site.value == '@github' ? img = meta.find(({ name }) => name === 'twitter:image:src') : img = meta.find(({ name }) => name === 'twitter:image');
        m.push(`<span id="ch-msg">${`<a href="${n}"><img src="${img.value}" id="ch-ythumb" title="${title.value}"></a>`}</span>`);
      }});
    else
      m.push(n);
  });
  return e = m.join(' ');
};
function replaceBadge(b) {
  let badge = '';
  b === null ? badge = `<img src="https://static.twitchcdn.net/assets/dark-649b4a4625649be7bf30.svg" id="ch-badge">` : $.each(Object.keys(b), function(i, n) {
    const result = allBadges.find(({ name }) => name === n);
    badge += `<img src=${result.link} id="ch-badge">`;
  });
  return badge;
};
function getMetaData(md) {
  let x = [];
  $.each(md, function(i, n) {
    if (n.nodeName.toString().toLowerCase() == 'meta' && $(n).attr("name") != null && typeof $(n).attr("name") != "undefined")
      x.push({
        name: $(n).attr('name'),
        value: ($(n).attr('content') ? $(n).attr('content') : ($(n).attr('value') ? $(n).attr('value') : ''))
      });
  });
  return x;
};
function banCheck(w) {
  let c = false;
  $.each(w.split(' '), function(i, n) {
    const ban = BAN_LIST.find(({name}) => name === n);
    if (ban != undefined) c = true;
  });
  return c;
};
function clearChat() {
  let msg_limit = $('.chat div').length;
  let msg_first = $('.chat').children(':first');
  if (msg_limit > MESSAGE.limit)
    msg_first.remove();
};
function announceMessage(client, channel) {
  if (announceCount != ANNOUNCE_LIST.length) {
    client.say(channel, `/announce ${ANNOUNCE_LIST[announceCount].text}`);
    announceCount++;
  } else
    announceCount = 0;
};

const getAllEmotes = async () => {
  await useTwitchToken(TWITCH.emotes_global).then(res => res.json()).then(res => {
    let x = [];
    $.each(res.data, function(i, n) {
      x.push({
        id: n.id,
        name: n.name,
        link: `https://static-cdn.jtvnw.net/emoticons/v2/${n.id}/${EMOTES.format}/${EMOTES.theme}/${EMOTES.scale}`
      });
    });
    allEmotes = allEmotes.concat(x);
  });
};
const getAllBadges = async () => {
  await useTwitchToken(TWITCH.badges_global).then(res => res.json()).then(res => {
    let x = [];
    $.each(res.data, function(i, n) {
      if (n.versions.length == 1)
        x.push({
          name: n.set_id,
          link: n.versions[0].image_url_1x
        });
      else if (n.versions.length > 1)
        for (let k = 0; k < n.versions.length; k++)
          x.push({
            name: `${n.set_id}_${n.versions[k].id}`,
            link: n.versions[0].image_url_1x
          });
    });
    allBadges = x;
  });
};
function replaceEmotes(data, type, scale) {
  let x = [];
  $.each(data, function(i, n) {
    x.push({
      id: n.id,
      name: n.code || n.name,
      link: `https://cdn.${type}/emote/${n.id}/${scale}`
    });
  });
  return x;
};
$.each([
  SMILE.bttv_global,
  `${SMILE.bttv_channel}/${CREDENTIALS.twitch_user_id}`,
  `${SMILE.ffz_channel}/${CREDENTIALS.twitch_user_id}`,
  SMILE.seventv_global,
  `${SMILE.seventv_channel}/${CREDENTIALS.twitch_user_name}/emotes`
], async (i, n) => {
  const e = await fetch(n).then(res => res.json()).then(res => {
    !Array.isArray(res) ? res = res.sharedEmotes : res;
    let type, scale, x;
    if (n.split('/')[5] === 'frankerfacez') {
      type = 'frankerfacez.com';
      scale = '1';
    } else {
      type = n.split('/')[2].slice(4);
      scale = '1x';
    }
    return x = replaceEmotes(res, type, scale);
  });
  allEmotes = allEmotes.concat(e);
});

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
    await getAllEmotes();
    await getAllBadges();
    await spotifyCurrentTrack();
    setInterval(() => spotifyCurrentTrack(), 10000);
  }

  /* SPOTIFY FUNCTIONS */
  async updSongInfo() {
    const res = await getPlaybackState();
    if (res.status === 204 || res.status > 400) {
      $('#sp-title').text('Response Error');
      $('#sp-artist, #sp-albumName, #sp-albumImg, #sp-link').empty();
    } else if (res.status === 200) {
      const song = await res.json();
      const isPlaying = song.is_playing;
      if (!isPlaying) {
        $('#sp-title').text('Music is not playing');
        $('#sp-artist, #sp-albumName, #sp-albumImg, #sp-link').empty();
      } else {
        const title = song.item.name;
        const artist = song.item.artists.map((_artist) => _artist.name).join(', ');
        const album = song.item.album.name;
        const albumImageUrl = song.item.album.images[0].url;
        const songUrl = song.item.external_urls.spotify;
        const songUri = song.item.uri;
        const currentSong = [
          { title: title },
          { artist: artist },
          { album: album },
          { albumImageUrl: albumImageUrl },
          { songUrl: songUrl },
          { songUri: songUri }
        ];
        $('#sp-title').text(title);
        $('#sp-artist').text(artist);
        $('#sp-albumImg').html(`<img src="${albumImageUrl}">`);
      };
    };
  }
  /* response only with spotify premium 👇 */
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
  /* RENDER VIEW */
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
