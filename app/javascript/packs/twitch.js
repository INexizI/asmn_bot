(function() {
  $(document).on("turbolinks:load", function() {
    const queryString = require('query-string')
    const Buffer = require('buffer/').Buffer
    const CryptoJS = require("crypto-js")

    const { CREDENTIALS, TWITCH, SPOTIFY, SMILE, MESSAGE, BOT_CONFIG, EMOTES, SOUND_COMMAND, BAN_LIST, CHAT_BAN_PHRASE, ANNOUNCE_LIST, SITE_WHITELIST, REGEXP } = require('./config');

    const basic = Buffer.from(`${CREDENTIALS.spotify_client_id}:${CREDENTIALS.spotify_client_secret}`).toString('base64');
    const sleep = ms => new Promise(res => setTimeout(() => res(), ms));
    const regexpCommand = new RegExp(REGEXP.command);

    let announceCount = 0;
    let skip_count = 0;
    let getAllBadges;
    let getAllEmotes;
    let getAllBttvGlobalEmotes;
    let getAllBttvChannelEmotes;
    let getAllFfzChannelEmotes;
    let getAllSevenGlobalEmotes;
    let getAllSevenChannelEmotes;

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
      const { access_token } = await getAccessToken()
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

    /* SPOTIFY BUTTONS */
    function check_states() {
      getPlaybackState().then(res => res.json()).then(res => {
        res.is_playing === true ? $('#btn-p img').attr('src', '/images/pause.svg') : $('#btn-p img').attr('src', '/images/play.svg');
        res.shuffle_state === true ? $('#btn-shuffle').addClass('on') : $('#btn-shuffle').removeClass('on');
        res.repeat_state === 'track' ? $('#btn-repeat').addClass('on') : $('#btn-repeat').removeClass('on');
      }).then(spotifyCurrentTrack());
    };
    $('#btn-info').click(() =>
      spotifyCurrentTrack().then(console.log(`Loading Spotify Data...`)).then(check_states()));
    $('#btn-next, #btn-forward').click(() =>
      nextSong().then(sleep(500).then(() => spotifyCurrentTrack())));
    $('#btn-previous').click(() =>
      prevSong().then(sleep(500).then(() => spotifyCurrentTrack())));
    $('#btn-p').click(() => {
      getPlaybackState().then(res => res.json()).then(res => {
        if (res.is_playing === true) {
          pauseSong();
          $('#btn-p img').attr('src', '/images/play.svg');
        } else {
          playSong();
          $('#btn-p img').attr('src', '/images/pause.svg');
        }
      });
    });
    $('#btn-shuffle').click(() => {
      getPlaybackState().then(res => res.json()).then(res => {
        if (res.shuffle_state === true) {
          shuffleSong(false);
          $('#btn-shuffle').removeClass('on');
        } else {
          shuffleSong(true);
          $('#btn-shuffle').addClass('on');
        }
      });
    });
    $('#btn-repeat').click(() => {
      getPlaybackState().then(res => res.json()).then(res => {
        if (res.repeat_state === 'track') {
          repeatSong('off');
          $('#btn-repeat').removeClass('on');
        } else {
          repeatSong('track');
          $('#btn-repeat').addClass('on');
        }
      });
    });
    $('#btn-mute').click(() =>
      getPlaybackState().then(res => res.json()).then(res => res.device.volume_percent === 0 ? volumeSong(40) : volumeSong(0)));
    setInterval(() =>
      getPlaybackState().then(res => res.status === 200 ? check_states() : ''), 15000);
    console.log('Spotify API');

    /* BOT CONNECTION */
    const client = new tmi.Client(BOT_CONFIG)
    client.connect().catch(console.error)

    /* EVENTS */
    client.on('connected', (address, port) => {
      onConnectedHandler(address, port);
    });
    client.on('disconnected', (reason) => {
      onDisconnectedHandler(reason)
    });
    client.on('hosted', (channel, username, viewers, autohost) => {
      onHostedHandler(channel, username, viewers, autohost)
    });
    client.on('subscription', (channel, username, method, message, tags) => {
      onSubscriptionHandler(channel, username, method, message, tags)
    });
    client.on('raided', (channel, username, viewers) => {
      onRaidedHandler(channel, username, viewers)
    });
    client.on('cheer', (channel, tags, message) => {
      onCheerHandler(channel, tags, message)
    });
    client.on('giftpaidupgrade', (channel, username, sender, tags) => {
      onGiftPaidUpgradeHandler(channel, username, sender, tags)
    });
    client.on('hosting', (channel, target, viewers) => {
      onHostingHandler(channel, target, viewers)
    });
    client.on('reconnect', () => {
      reconnectHandler()
    });
    client.on('resub', (channel, username, months, message, tags, methods) => {
      resubHandler(channel, username, months, message, tags, methods)
    });
    client.on('subgift', (channel, username, streakMonths, recipient, methods, tags) => {
      subGiftHandler(channel, username, streakMonths, recipient, methods, tags)
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
          case 'next':
            nextSong(), sleep(500).then(() => spotifyCurrentTrack());
            break;
          case 'prev':
            prevSong(), sleep(500).then(() => spotifyCurrentTrack());
            break;
          case 'pause':
            pauseSong(), $('#btn-p img').attr('src', '/images/play.svg'), sleep(500).then(() => spotifyCurrentTrack());
            break;
          case 'play':
            playSong(), $('#btn-p img').attr('src', '/images/pause.svg'), sleep(500).then(() => spotifyCurrentTrack());
            break;
          case 'mute':
            volumeSong(0);
            break;
          case 'vol':
            volumeSong(parseInt(argument));
            break;
          case 'skip':
            if (skip_count == 3) {
              skip_count = 0;
              nextSong();
              client.action(channel, `Song has been skipped`);
              return
            } else
              skip_count++
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
      };

      // ban case
      // if (msg === '!qwe') client.ban(channel, 'asd', 'qwe'), client.action(channel, `asd has been banned!`) // first: nickname, second: reason
    });

    /* FUNCTIONS */
    function onConnectedHandler(address, port) {
      console.log(`Bot Connected: ${address}:${port}`);
    };
    function onDisconnectedHandler(reason) {
      console.log(`Bot Disconnected: ${reason}`)
    };
    function onHostedHandler (channel, username, viewers, autohost) {
      client.say(channel, `Thank you @${username} for the host of ${viewers}!`)
    };
    function onRaidedHandler(channel, username, viewers) {
      client.say(channel, `Thank you @${username} for the raid of ${viewers}!`)
    };
    function onSubscriptionHandler(channel, username, method, message, tags) {
      client.say(channel, `Thank you @${username} for subscribing!`)
    };
    function onCheerHandler(channel, tags, message)  {
      client.say(channel, `Thank you @${tags.username} for the ${tags.bits} bits!`)
    };
    function onGiftPaidUpgradeHandler(channel, username, sender, tags) {
      client.say(channel, `Thank you @${username} for continuing your gifted sub!`)
    };
    function onHostingHandler(channel, target, viewers) {
      client.say(channel, `We are now hosting ${target} with ${viewers} viewers!`)
    };
    function reconnectHandler() {
      console.log('Reconnecting...')
    };
    function resubHandler(channel, username, months, message, tags, methods) {
      const cumulativeMonths = tags['msg-param-cumulative-months']
      client.say(channel, `Thank you @${username} for the ${cumulativeMonths} sub!`)
    };
    function subGiftHandler(channel, username, streakMonths, recipient, methods, tags) {
      client.say(channel, `Thank you @${username} for gifting a sub to ${recipient}}.`)

      // this comes back as a boolean from twitch, disabling for now
      // "msg-param-sender-count": false
      // const senderCount =  ~~tags["msg-param-sender-count"];
      // client.say(channel,
      //   `${username} has gifted ${senderCount} subs!`
      // )
    };

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

    function replaceBadge(b) {
      let badge = '';
      b === null ? badge = `<img src="https://static.twitchcdn.net/assets/dark-649b4a4625649be7bf30.svg" id="ch-badge">` : $.each(Object.keys(b), function(i, n) {
        const result = getAllBadges.find(({ name }) => name === n);
        badge += `<img src=${result.link} id="ch-badge">`;
      });
      return badge;
    };
    function replaceElements(e) {
      let m = [];
      let emotes = [].concat(getAllEmotes, getAllBttvGlobalEmotes, getAllBttvChannelEmotes, getAllFfzChannelEmotes, getAllSevenGlobalEmotes, getAllSevenChannelEmotes);
      $.each(e.split(' '), function(i, n) {
        let urlCheck = n.split('/')[2];
        const checkWL = SITE_WHITELIST.find(({link}) => link === urlCheck);
        const emote = emotes.find(({ name }) => name === n);
        if (emote)
          m.push(`<img src=${emote.link} id="ch-emote">`);
        else if (checkWL)
          $.ajax({ url: n, type: 'get', dataType: 'html', async: false, success: function(data) {
            let img;
            let site;
            data = $.parseHTML(data);
            const meta = getMetaData(data);
            site = meta.find(({name}) => name === 'twitter:site');
            site.value == '@github' ? img = meta.find(({name}) => name === 'twitter:image:src') : img = meta.find(({name}) => name === 'twitter:image');
            m.push(`<span id="ch-msg">${`<a href="${n}"><img src="${img.value}" id="ch-ythumb"></a>`}</span>`);
          }});
        else
          m.push(n);
      });
      return e = m.join(' ');
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

    /* COMMANDS */
    async function getUserInfo(user) {
      let param = $.param({
        login: user
      });

      return await useTwitchToken(TWITCH.user, param).then(res => res.json()).then(res => res.data[0]);
    };
    async function getUserFollowTime(client, tags, channel) {
      let param = $.param({
        to_id: CREDENTIALS.twitch_user_id,
        from_login: tags.username
      });

      const x = await useTwitchToken(TWITCH.follow, param).then(res => res.json()).then(res => res.data[0].followed_at);
      const date = new Date(x.split('T').shift());
      const options = {
        // weekday: 'short',          // long, short, narrow
        day: 'numeric',               // numeric, 2-digit
        year: 'numeric',              // numeric, 2-digit
        month: 'long',                // numeric, 2-digit, long, short, narrow
        // hour: 'numeric',           // numeric, 2-digit
        // minute: 'numeric',         // numeric, 2-digit
        // second: 'numeric',         // numeric, 2-digit
      }
      client.action(channel, `@${tags.username}, you've been following the channel since [${date.toLocaleDateString('en-UK', options)}]`)
    };
    // async function getTimeFollow(client, message, tags, channel, self) {
    //   let param = $.param({
    //     to_id: twitch_user_id,
    //     from_login: tags.username
    //   });
    //
    //   let t = await useTwitchToken(TWITCH.follow, param).then(res => res.json()).then(res => res.data[0].followed_at);
    //   let n = new Date().getTime();
    //   let f = (n - Date.parse(t));
    //   let year, month, day, hour, minute, second;
    //
    //   second = Math.floor(f / 1000);
    //   minute = Math.floor(second / 60);
    //   second = second % 60;
    //   hour = Math.floor(minute / 60);
    //   minute = minute % 60;
    //   day = Math.floor(hour / 24);
    //   hour = hour % 24;
    //   month = Math.floor(day / 30);
    //   day = day % 30;
    //   year = Math.floor(month / 12);
    //   month = month % 12;
    //
    //   var q = `${year}y ${month}m ${day}d ${hour}h ${minute}m ${second}s after followed!`;
    //   return q;
    // };
    async function getBadgesGlobal(client, message, tags, channel, self) {
      return await useTwitchToken(TWITCH.badges_global).then(res => res.json()).then(res => res.data);
    };
    async function getChannelBadges(client, message, tags, channel, self) {
      const param = $.param({
        broadcaster_id: CREDENTIALS.twitch_user_id,
      });

      return await useTwitchToken(TWITCH.badges, param).then(res => res.json()).then(res => res.data);
    };
    async function getEmotesGlobal(client, message, tags, channel, self) {
      return await useTwitchToken(TWITCH.emotes_global).then(res => res.json()).then(res => res.data);
    };
    async function getChannelEmotes(client, message, tags, channel, self) {
      const param = $.param({
        broadcaster_id: CREDENTIALS.twitch_user_id,
      });

      return await useTwitchToken(TWITCH.emotes, param).then(res => res.json()).then(res => res.data);
    };
    async function getChannelEmotesSet(client, message, tags, channel, self) {
      return client.emotesets;
    };
    async function getStreamInfo(client, message, tags, channel, self) {
      const param = $.param({
        broadcaster_id: CREDENTIALS.twitch_user_id,
      });

      return useTwitchToken(TWITCH_CHANNEL, param).then(res => res.json()).then(res => res.data[0]);
    };
    async function banUser(client, channel, user, duration) {
      const userData = await getUserInfo(user);

      client.timeout(channel, userData.login, duration, 'banned via ASMN');
    };

    useTwitchToken(TWITCH.emotes_global).then(res => res.json()).then(res => {
      let x = [];
      $.each(res.data, function(i, n) {
        x.push({
          id: n.id,
          name: n.name,
          link: `https://static-cdn.jtvnw.net/emoticons/v2/${n.id}/${EMOTES.format}/${EMOTES.theme}/${EMOTES.scale}`
        });
      });
      getAllEmotes = x;
    });
    useTwitchToken(TWITCH.badges_global).then(res => res.json()).then(res => {
      let x = [];
      $.each(res.data, function(i, n) {
        if (n.versions.length == 1)
          x.push({
            name: n.set_id,
            link: n.versions[0].image_url_1x,
          });
        else if (n.versions.length > 1)
          for (let k = 0; k < n.versions.length; k++)
            x.push({
              name: `${n.set_id}_${n.versions[k].id}`,
              link: n.versions[0].image_url_1x,
            });
      });
      getAllBadges = x;
    });

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
    fetch(SMILE.bttv_global).then(res => res.json()).then(res => {
      getAllBttvGlobalEmotes = replaceEmotes(res, 'betterttv.net', '1x');
    });
    fetch(`${SMILE.bttv_channel}/${CREDENTIALS.twitch_user_id}`).then(res => res.json()).then(res => {
      getAllBttvChannelEmotes = replaceEmotes(res.sharedEmotes, 'betterttv.net', '1x');
    });
    fetch(`${SMILE.ffz_channel}/${CREDENTIALS.twitch_user_id}`).then(res => res.json()).then(res => {
      getAllFfzChannelEmotes = replaceEmotes(res, 'frankerfacez.com', '1');
    });
    fetch(SMILE.seventv_global).then(res => res.json()).then(res => {
      getAllSevenGlobalEmotes = replaceEmotes(res, '7tv.app', '1x');
    });
    fetch(`${SMILE.seventv_channel}/${CREDENTIALS.twitch_user_name}/emotes`).then(res => res.json()).then(res => {
      getAllSevenChannelEmotes = replaceEmotes(res, '7tv.app', '1x');
    });

    // /* example code */
    // function parseMessage(message) {
    //   // Contains the component parts.
    //   let parsedMessage = {
    //     tags: null,
    //     source: null,
    //     command: null,
    //     parameters: null
    //   };
    //
    //   // The start index. Increments as we parse the IRC message.
    //   let idx = 0;
    //
    //   // The raw components of the IRC message.
    //   let rawTagsComponent = null;
    //   let rawSourceComponent = null;
    //   let rawCommandComponent = null;
    //   let rawParametersComponent = null;
    //
    //   // If the message includes tags, get the tags component of the IRC message.
    //   // The message includes tags.
    //   if (message[idx] === '@') {
    //     let endIdx = message.indexOf(' ');
    //     rawTagsComponent = message.slice(1, endIdx);
    //     // Should now point to source colon (:).
    //     idx = endIdx + 1;
    //   };
    //
    //   // Get the source component (nick and host) of the IRC message.
    //   // The idx should point to the source part; otherwise, it's a PING command.
    //   if (message[idx] === ':') {
    //     idx += 1;
    //     let endIdx = message.indexOf(' ', idx);
    //     rawSourceComponent = message.slice(idx, endIdx);
    //     // Should point to the command part of the message.
    //     idx = endIdx + 1;
    //   };
    //
    //   // Get the command component of the IRC message.
    //   // Looking for the parameters part of the message.
    //   // But not all messages include the parameters part.
    //   let endIdx = message.indexOf(':', idx);
    //   if (-1 == endIdx)
    //     endIdx = message.length;
    //
    //   rawCommandComponent = message.slice(idx, endIdx).trim();
    //
    //   // Get the parameters component of the IRC message.
    //   // Check if the IRC message contains a parameters component.
    //   // Should point to the parameters part of the message.
    //   if (endIdx != message.length) {
    //     idx = endIdx + 1;
    //     rawParametersComponent = message.slice(idx);
    //   };
    //
    //   // Parse the command component of the IRC message.
    //   parsedMessage.command = parseCommand(rawCommandComponent);
    //
    //   // Only parse the rest of the components if it's a command
    //   // we care about; we ignore some messages.
    //   // Is null if it's a message we don't care about.
    //   if (null == parsedMessage.command)
    //     return null;
    //   else {
    //     // The IRC message contains tags.
    //     if (null != rawTagsComponent)
    //       parsedMessage.tags = parseTags(rawTagsComponent);
    //
    //     parsedMessage.source = parseSource(rawSourceComponent);
    //
    //     parsedMessage.parameters = rawParametersComponent;
    //     if (rawParametersComponent && rawParametersComponent[0] === '!')
    //       parsedMessage.command = parseParameters(rawParametersComponent, parsedMessage.command); // The user entered a bot command in the chat window.
    //   }
    //
    //   return parsedMessage;
    // };
    // // Parses the tags component of the IRC message.
    // function parseTags(tags) {
    //   // badge-info=;badges=broadcaster/1;color=#0000FF;...
    //
    //   // List of tags to ignore.
    //   const tagsToIgnore = {
    //     'client-nonce': null,
    //     'flags': null
    //   };
    //
    //   // Holds the parsed list of tags.
    //   // The key is the tag's name (e.g., color).
    //   let dictParsedTags = {};
    //
    //   let parsedTags = tags.split(';');
    //
    //   parsedTags.forEach(tag => {
    //     // Tags are key/value pairs.
    //     let parsedTag = tag.split('=');
    //     let tagValue = (parsedTag[1] === '') ? null : parsedTag[1];
    //
    //       // Switch on tag name
    //       switch (parsedTag[0]) {
    //         case 'badges':
    //         case 'badge-info':
    //           // badges=staff/1,broadcaster/1,turbo/1;
    //           if (tagValue) {
    //             let dict = {};  // Holds the list of badge objects.
    //                             // The key is the badge's name (e.g., subscriber).
    //             let badges = tagValue.split(',');
    //             badges.forEach(pair => {
    //               let badgeParts = pair.split('/');
    //               dict[badgeParts[0]] = badgeParts[1];
    //             })
    //             dictParsedTags[parsedTag[0]] = dict;
    //           } else
    //             dictParsedTags[parsedTag[0]] = null;
    //           break;
    //
    //         case 'emotes':
    //           // emotes=25:0-4,12-16/1902:6-10
    //           if (tagValue) {
    //             let dictEmotes = {};  // Holds a list of emote objects.
    //                                   // The key is the emote's ID.
    //             let emotes = tagValue.split('/');
    //             emotes.forEach(emote => {
    //               let emoteParts = emote.split(':');
    //
    //               let textPositions = [];  // The list of position objects that identify
    //                                        // the location of the emote in the chat message.
    //               let positions = emoteParts[1].split(',');
    //               positions.forEach(position => {
    //                 let positionParts = position.split('-');
    //                 textPositions.push({
    //                   startPosition: positionParts[0],
    //                   endPosition: positionParts[1]
    //                 })
    //               });
    //               dictEmotes[emoteParts[0]] = textPositions;
    //             })
    //             dictParsedTags[parsedTag[0]] = dictEmotes;
    //           } else
    //             dictParsedTags[parsedTag[0]] = null;
    //           break;
    //         case 'emote-sets':
    //           // emote-sets=0,33,50,237
    //           let emoteSetIds = tagValue.split(',');  // Array of emote set IDs.
    //           dictParsedTags[parsedTag[0]] = emoteSetIds;
    //           break;
    //         default:
    //           // If the tag is in the list of tags to ignore, ignore
    //           // it; otherwise, add it.
    //           if (tagsToIgnore.hasOwnProperty(parsedTag[0]))
    //             ;
    //           else
    //             dictParsedTags[parsedTag[0]] = tagValue;
    //       }
    //   });
    //
    //   return dictParsedTags;
    // };
    // // Parses the command component of the IRC message.
    // function parseCommand(rawCommandComponent) {
    //   let parsedCommand = null;
    //   let commandParts = rawCommandComponent.split(' ');
    //
    //   switch (commandParts[0]) {
    //     case 'JOIN':
    //     case 'PART':
    //     case 'NOTICE':
    //     case 'CLEARCHAT':
    //     case 'HOSTTARGET':
    //     case 'PRIVMSG':
    //       parsedCommand = {
    //         command: commandParts[0],
    //         channel: commandParts[1]
    //       }
    //       break;
    //     case 'PING':
    //       parsedCommand = {
    //         command: commandParts[0]
    //       }
    //       break;
    //     case 'CAP':
    //       parsedCommand = {
    //         command: commandParts[0],
    //         isCapRequestEnabled: (commandParts[2] === 'ACK') ? true : false,
    //         // The parameters part of the messages contains the
    //         // enabled capabilities.
    //       }
    //       break;
    //     case 'GLOBALUSERSTATE':  // Included only if you request the /commands capability.
    //                              // But it has no meaning without also including the /tags capability.
    //       parsedCommand = {
    //         command: commandParts[0]
    //       }
    //       break;
    //     case 'USERSTATE':   // Included only if you request the /commands capability.
    //     case 'ROOMSTATE':   // But it has no meaning without also including the /tags capabilities.
    //       parsedCommand = {
    //         command: commandParts[0],
    //         channel: commandParts[1]
    //       }
    //       break;
    //     case 'RECONNECT':
    //       console.log('The Twitch IRC server is about to terminate the connection for maintenance.')
    //       parsedCommand = {
    //         command: commandParts[0]
    //       }
    //       break;
    //     case '421':
    //       console.log(`Unsupported IRC command: ${commandParts[2]}`)
    //       return null;
    //     case '001':  // Logged in (successfully authenticated).
    //       parsedCommand = {
    //         command: commandParts[0],
    //         channel: commandParts[1]
    //       }
    //       break;
    //     case '002':  // Ignoring all other numeric messages.
    //     case '003':
    //     case '004':
    //     case '353':  // Tells you who else is in the chat room you're joining.
    //     case '366':
    //     case '372':
    //     case '375':
    //     case '376':
    //       console.log(`numeric message: ${commandParts[0]}`)
    //       return null;
    //     default:
    //       console.log(`\nUnexpected command: ${commandParts[0]}\n`);
    //       return null;
    //   };
    //
    //   return parsedCommand;
    // };
    // // Parses the source (nick and host) components of the IRC message.
    // function parseSource(rawSourceComponent) {
    //   // Not all messages contain a source
    //   if (null == rawSourceComponent)
    //     return null;
    //   else {
    //     let sourceParts = rawSourceComponent.split('!');
    //     return {
    //       nick: (sourceParts.length == 2) ? sourceParts[0] : null,
    //       host: (sourceParts.length == 2) ? sourceParts[1] : sourceParts[0]
    //     }
    //   }
    // };
    // // Parsing the IRC parameters component if it contains a command (e.g., !dice).
    // function parseParameters(rawParametersComponent, command) {
    //   let idx = 0
    //   let commandParts = rawParametersComponent.slice(idx + 1).trim();
    //   let paramsIdx = commandParts.indexOf(' ');
    //
    //   // no parameters
    //   if (-1 == paramsIdx)
    //     command.botCommand = commandParts.slice(0);
    //   else {
    //     command.botCommand = commandParts.slice(0, paramsIdx);
    //     command.botCommandParams = commandParts.slice(paramsIdx).trim();
    //     // TODO: remove extra spaces in parameters string
    //   }
    //
    //   return command;
    // };
  });
}).call(this);
