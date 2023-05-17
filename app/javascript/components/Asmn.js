import React, { Component } from "react";
import CryptoJS from "crypto-js";
import tmi from 'tmi.js';
import jquery from "jquery";
window.$ = jquery;

const {
  CREDENTIALS,
  TWITCH,
  SPOTIFY,
  SMILE,
  MESSAGE,
  BOT_CONFIG,
  EMOTES,
  SOUND_COMMAND,
  BAN_LIST,
  CHAT_BAN_PHRASE,
  ANNOUNCE_LIST,
  SITE_WHITELIST,
  REGEXP
} = require('../packs/config');

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
const useSpotifyToken = async (url) => {
  const { access_token } = await getAccessToken();
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
};
const getPlaybackState = async () => {
  const { access_token } = await getAccessToken();
  return fetch(SPOTIFY.playback_state, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
};
const spotifyCurrentTrack = async () => {
  const response = await getPlaybackState();
  if (response.status === 204) {
    $('#sp-title').text(`Spotify offline`);
    $('#sp-artist, #sp-albumName, #sp-albumImg, #sp-link').empty();
  } else if (response.status > 400) {
    $('#sp-title').text(`Response error`);
    $('#sp-artist, #sp-albumName, #sp-albumImg, #sp-link').empty();
  } else if (response.status === 200) {
    const song = await response.json();
    const currentSong = {
      isPlaying: song.is_playing,
      repeat: song.repeat_state,
      shuffle: song.shuffle_state,
      volume: song.device.volume_percent,
      title: song.item.name,
      artist: song.item.artists.map((_artist) => _artist.name).join(', '),
      album: song.item.album.name,
      albumImageUrl: song.item.album.images[2].url,
      songUrl: song.item.external_urls.spotify,
      songUri: song.item.uri,
    };
    if (!currentSong.isPlaying) {
      $('#sp-title').text(`Music isn't playing`);
      $('#sp-artist, #sp-albumName, #sp-albumImg, #sp-link').empty();
      $('#btn-pp img').attr('src', '/images/play.svg');
    } else {
      $('#sp-title').text(currentSong.title);
      $('#sp-artist').text(currentSong.artist);
      // $('#sp-albumName').text(currentSong.album);
      $('#sp-albumImg').html(`<img src="${currentSong.albumImageUrl}">`);
      $('#btn-pp img').attr('src', '/images/pause.svg');
    }
    // return song;     // full data
    return currentSong; // minimum song data
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
  NOTE(D): old method for commands
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
          client.action(channel, res.isPlaying === true ? `${res.artist} - ${res.title} 👇 ${res.songUrl}` : `Music isn't playing`);
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
    ban ? client.deletemessage(channel, tags.id) : onMessageHandler(tags, message);
    /*
    NOTE(D): to banned user, use this string below 👇
    ban ? client.ban(channel, username, reason) : onMessageHandler(channel, tags, message, self);
    */
  };

});
/* FUNCTIONS */
const onMessageHandler = async (tags, message) => {
  const r = message.replace(REGEXP.message);
  /*
  FIXME(D): high latency on callback/return user profile picture
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
        <span style="color: ${tags.color == null ? '#f5f5f5' : tags.color}" id="ch-user" data-controller="ban" data-action="click->ban#userInfo" data-target="${cryptData}">${tags['display-name']}</span>
      </p>
      <span id="ch-msg">${e}</span>
    </div>
  `).animate({scrollTop: $('.chat').prop('scrollHeight')}, 1000);
  clearChat();
};
const replaceElements = e => {
  let m = [];
  let emotes = allEmotes;
  $.each(e.split(' '), async (i, n) => {
    let urlCheck = n.split('/')[2];
    const checkWL = SITE_WHITELIST.find(({ link }) => link === urlCheck);
    const emote = emotes.find(({ name }) => name === n);
    if (emote) {
      m.push(`<img src=${emote.link} id="ch-emote">`);
    } else if (checkWL) {
      switch (checkWL.name) {
        case 'Spotify':
          $.ajax({
            url: `${SPOTIFY.token}`,
            headers: {
              'Authorization': `Basic ${basic}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            type: 'post',
            dataType: 'json',
            async: false,
            data: {
              grant_type: 'client_credentials',
              refresh_token: `${CREDENTIALS.spotify_refresh_token}`
            },
            success: (data) => {
              $.ajax({
                url: `${SPOTIFY.track}/${n.split('/').pop()}`,
                headers: {
                  Authorization: `Bearer ${data.access_token}`
                },
                type: 'get',
                dataType: 'json',
                async: false,
                success: (data) => {
                  const title = data.name;
                  const image = data.album.images[0].url;
                  const artist = data.artists.map((_artist) => _artist.name).join(', ');
                  m.push(`
                    <a href="${n}" id="sp" title="${artist} - ${title}">
                      <img src="${image}">
                      <p>
                        <span id="sp-n">${title}</span>
                        <span id="sp-a">${artist}</span>
                      </p>
                    </a>`);
                }
              });
            }
          });
          break;
        case 'YouTube':
        case 'GitHub':
        case 'Imgur':
          $.ajax({ url: n, type: 'get', dataType: 'html', async: false, success: function(data) {
            let img, site, title;
            data = $.parseHTML(data);
            const meta = getMetaData(data);
            img = meta.find(({ name }) => name === 'og:image');
            title = meta.find(({ name }) => name === 'og:title');
            site = meta.find(({ name }) => name === 'og:site_name');
            m.push(`<a href="${n}"><img src="${img.value}" id="ch-thumb" title="${title.value}"></a>`);
          }});
          break;
      }
    } else
      m.push(n);
  });
  return e = m.join(' ');
};
const replaceBadge = b => {
  let badge = '';
  b === null ? badge = `<img src="https://static.twitchcdn.net/assets/dark-649b4a4625649be7bf30.svg" id="ch-badge">` : $.each(Object.keys(b), function(i, n) {
    const result = allBadges.find(({ name }) => name === n);
    badge += `<img src=${result.link} id="ch-badge">`;
  });
  return badge;
};
const getMetaData = md => {
  let x = [];
  $.each(md, function(i, n) {
    // if (n.nodeName.toString().toLowerCase() == 'meta' && $(n).attr("name") != null && typeof $(n).attr("name") != "undefined")
    if (n.nodeName.toString().toLowerCase() == 'meta' && ($(n).attr("name") != null || $(n).attr("property") != null)) {
      x.push({
        name: $(n).attr('name') ? $(n).attr('name') : $(n).attr('property'),
        value: ($(n).attr('content') ? $(n).attr('content') : ($(n).attr('value') ? $(n).attr('value') : ''))
      });
    }
  });
  return x;
};
const banCheck = w => {
  let c = false;
  $.each(w.split(' '), function(i, n) {
    const checkWL = SITE_WHITELIST.find(({ link }) => link === n.split('/')[2]);
    const ban = BAN_LIST.find(({ name }) => name === n);
    if (ban != undefined || (n.slice(0, 4) == 'http' && checkWL == undefined)) c = true;
  });
  return c;
};
const clearChat = () => {
  let msg_limit = $('.chat div').length;
  let msg_first = $('.chat').children(':first');
  if (msg_limit > MESSAGE.limit)
    msg_first.remove();
};
const announceMessage = (client, channel) => {
  if (announceCount != ANNOUNCE_LIST.length) {
    client.say(channel, `/announce ${ANNOUNCE_LIST[announceCount].text}`);
    announceCount++;
  } else
    announceCount = 0;
};

// get all emote arrays (Twitch, TV, FFZ, 7TV) and join them into one
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
const replaceEmotes = (data, type, scale) => {
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
      scale = '1x.webp';
    }
    return x = replaceEmotes(res, type, scale);
  });
  allEmotes = allEmotes.concat(e);
});

/* ADD NEW */
const obs = () => {
  // select the node that will be observed for mutations
  const target = document.getElementById('chat-block');
  // options for the observer (which mutations to observe)
  const config = { attributes: true, childList: true, subtree: true };
  // callback function to execute when mutations are observed
  const cb = (mutationList, observer) => {
    for (const mutation of mutationList) {
      if (mutation.type === 'childList') {
        console.log('A child node has been added or removed.');
      } else if (mutation.type === 'attributes') {
        console.log(`The ${mutation.attributeName} attribute was modified.`);
      }
    };
  };
  // create an observer instance linked to the callback function
  const obs = new MutationObserver(cb);
  // start observing the target node for configured mutations
  obs.observe(target, config);
  // stop observing
  // observer.disconnect();
};
const user_info = () => {
  $('.chat').on('click', '#ch-user', (el) => {
    let x = el.currentTarget;
    // FIXME(D): try Promise.all() ?!
    if ($(x).next().length == 0) {
      $(x).parent().append(`
        <div id="user-info">
          <p id="info">
            <span id="user-pic"></span>
            <span>Info</span>
          </p>
          <hr/>
          <p>
            <span id="toUnban">
              <img src="/images/check-circle.svg" id="ch-badge" title="Unban"/>
            </span>
            <span id="to600" title="10 min">10m</span>
            <span id="to3600" title="1 hour">1h</span>
            <span id="to86400" title="1 day">1d</span>
            <span id="to604800" title="1 week">1w</span>
            <span id="toBan">
              <img src="/images/slash.svg" id="ch-badge" title="Ban"/>
            </span>
            <span id="toDelete">
              <img src="/images/trash-2.svg" id="ch-badge" title="Delete message"/>
            </span>
          </p>
          <span id="close">
            <img src="/images/x.svg" id="ch-badge"/>
          </span>
        </div>`);
      useTwitchToken(TWITCH.user, `login=${$(x).text().toLowerCase()}`).then(res => res.json()).then(res => {
        $(x)
          .next()
          .find('#user-pic')
          .append(`<img src=${res.data[0].profile_image_url}>`);
        $(x)
          .next()
          .find('p:eq(0)')
          .css('background', `top/cover no-repeat linear-gradient(to right, rgba(255, 255, 255, 0.5) 0 100%), url(${res.data[0].offline_image_url}) top / cover no-repeat`);
      });
    } else
      $(x).next().remove();
  });
};
const close = () => {
  $('.chat').on('click', '#close', (el) => {
    $(el.currentTarget).parent().remove();
  });
};

class Chat extends Component {
  async componentDidMount() {
    await getAllEmotes();
    await getAllBadges();
    // NOTE(D): get current song and update each 10 seconds
    await spotifyCurrentTrack();
    setInterval(() => {
      getPlaybackState().then(res => res.status == 200 ? res.json() : '').then(res => {
        // NOTE(D): call only if track changes
        if (typeof res == 'object')
          $('#sp-title').text() !== res.item.name ? spotifyCurrentTrack() : ''
      });
    }, 10000);

    obs();
    user_info();
    close();
  }

  render() {
    return [
      <div className="img" key="img">
        <div className="chat" id="chat-block" />
        <iframe src={`https://www.twitch.tv/embed/${CREDENTIALS.twitch_user_name}/chat?parent=${window.location.hostname}`} id="chat" frameBorder="0" title="Chat" />
      </div>
    ]
  }
};
const Song = () => (
  <div className="song" key="song">
    <p id="sp-albumImg"/>
    <p>
      <span id="sp-title"/>
      <span id="sp-artist"/>
    </p>
  </div>
);
class Button extends Component {
  /* SPOTIFY FUNCTIONS */
  async updSongInfo() {
    const response = await getPlaybackState();
    if (response.status === 204) {
      $('#sp-title').text(`Spotify offline`);
      $('#sp-artist, #sp-albumName, #sp-albumImg, #sp-link').empty();
    } else if (response.status > 400) {
      $('#sp-title').text(`Response error`);
      $('#sp-artist, #sp-albumName, #sp-albumImg, #sp-link').empty();
    } else if (response.status === 200) {
      const song = await response.json();
      console.log(song);
      if (!song.is_playing) {
        $('#sp-title').text(`Music isn't playing`);
        $('#sp-artist, #sp-albumName, #sp-albumImg, #sp-link').empty();
        $('#btn-pp img').attr('src', '/images/play.svg');
      } else {
        $('#sp-title').text(song.item.name);
        $('#sp-artist').text(song.item.artists.map((_artist) => _artist.name).join(', '));
        $('#sp-albumImg').html(`<img src="${song.item.album.images[0].url}">`);
        $('#btn-pp img').attr('src', '/images/pause.svg');
      };
    };
  }
  // NOTE(D): response only with spotify premium 👇
  shuffle() {
    spotifyCurrentTrack().then(res => {
      useSpotifyToken(`${SPOTIFY.shuffle}?state=${res.shuffle == false ? true : false}`);
    });
  }
  repeat() {
    spotifyCurrentTrack().then(res => {
      useSpotifyToken(`${SPOTIFY.repeat}?state=${res.repeat == 'off' ? 'track' : 'off'}`);
    });
  }
  skipToNext() {
    useSpotifyToken(SPOTIFY.next);
  }
  skipToPrev() {
    useSpotifyToken(SPOTIFY.previous);
  }
  pauseResume() {
    spotifyCurrentTrack().then(res => {
      useSpotifyToken(res == true ? SPOTIFY.pause : SPOTIFY.play);
    });
  }
  mute() {
    spotifyCurrentTrack().then(res => {
      useSpotifyToken(`${SPOTIFY.volume}?volume_percent=${res.volume != 0 ? 0 : res.volume}`);
    });
  }
  /* RENDER VIEW */
  render() {
    return [
      <div className="btn" key="btn">
        <button id="btn-info" onClick={this.updSongInfo}>Update Info</button>
        <div>
          <button id="btn-shuffle" onClick={this.shuffle}>
            <img src="/images/shuffle.svg" />
          </button>
          <button id="btn-previous" onClick={this.skipToPrev}>
            <img src="/images/skip-back.svg" />
          </button>
          <button id="btn-pp" onClick={this.pauseResume}>
            <img src="/images/play.svg" />
          </button>
          <button id="btn-forward" onClick={this.skipToNext}>
            <img src="/images/skip-forward.svg" />
          </button>
          <button id="btn-repeat" onClick={this.repeat}>
            <img src="/images/repeat.svg" />
          </button>
          <button id="btn-mute" onClick={this.mute}>
            <img src="/images/volume-x.svg" />
          </button>
        </div>
      </div>
    ]
  }
};

const App = () => {
  return (
    <>
      <Chat />
      <Song />
      <Button />
    </>
  )
};
export default App
