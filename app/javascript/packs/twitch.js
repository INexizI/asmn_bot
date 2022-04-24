(function() {
  $(document).on("turbolinks:load", function() {
    const queryString = require('query-string')
    const Buffer = require('buffer/').Buffer

    /* CREDENTIALS */
    const twitch_user_id =            process.env.BOT_ID;
    const twitch_user_name =          process.env.BOT_NAME;
    const twitch_client_id =          process.env.TCLIENT_ID;
    const twitch_client_secret =      process.env.TCLIENT_SECRET;
    const spotify_client_id =         process.env.SCLIENT_ID;
    const spotify_client_secret =     process.env.SCLIENT_SECRET;
    const spotify_refresh_token =     process.env.SREFRESH_TOKEN;
    const spotify_client_id_alt =     process.env.SCLIENT_ID_ALT;
    const spotify_client_secret_alt = process.env.SCLIENT_SECRET_ALT;
    const spotify_refresh_token_alt = process.env.SREFRESH_TOKEN_ALT;

    const basic = Buffer.from(`${spotify_client_id}:${spotify_client_secret}`).toString('base64');
    // const basic = Buffer.from(`${spotify_client_id_alt}:${spotify_client_secret_alt}`).toString('base64');
    const sleep = ms => new Promise(res => setTimeout(() => res(), ms));
    const regexpCommand = new RegExp(/^!([a-zA-Z0-9]+)(?:\W+)?(.*)?/);
    const prefix = '#';
    let skip_count = 0;
    let getAllEmotes; // array of all emotes
    let getAllBadges; // array of all badges

    /* ENDPOINTS */
    const TWITCH_TOKEN =         'https://id.twitch.tv/oauth2/token';
    const TWITCH_USER =          'https://api.twitch.tv/helix/users';
    const TWITCH_FOLLOW =        'https://api.twitch.tv/helix/users/follows';
    const TWITCH_CHANNEL =       'https://api.twitch.tv/helix/channels';
    const TWITCH_BADGES_GLOBAL = 'https://api.twitch.tv/helix/chat/badges/global';
    const TWITCH_BADGES =        'https://api.twitch.tv/helix/chat/badges';
    const TWITCH_EMOTES_GLOBAL = 'https://api.twitch.tv/helix/chat/emotes/global';
    const TWITCH_EMOTES =        'https://api.twitch.tv/helix/chat/emotes';
    const TWITCH_EMOTES_SET =    'https://api.twitch.tv/helix/chat/emotes/set';
    const TWITCH_POLL =          'https://api.twitch.tv/helix/polls';
    const TWITCH_PREDICTIONS =   'https://api.twitch.tv/helix/predictions';

    const AUTHORIZE =            'https://accounts.spotify.com/authorize';
    const TOKEN_ENDPOINT =       'https://accounts.spotify.com/api/token';
    const PLAYBACK_STATE =       'https://api.spotify.com/v1/me/player';                    // get
    const PREVIOUS_SONG =        'https://api.spotify.com/v1/me/player/previous';           // post
    const NEXT_SONG =            'https://api.spotify.com/v1/me/player/next';               // post
    const PAUSE_SONG =           'https://api.spotify.com/v1/me/player/pause';              // put
    const PLAY_SONG =            'https://api.spotify.com/v1/me/player/play';               // put
    const SHUFFLE_SONG =         'https://api.spotify.com/v1/me/player/shuffle';            // put
    const REPEAT_MODE =          'https://api.spotify.com/v1/me/player/repeat';             // put
    const VOLUME =               'https://api.spotify.com/v1/me/player/volume';             // put
    const RECENTLY_PLAY =        'https://api.spotify.com/v1/me/player/recently-played';    // get

    /* EMOTES CONFIG */
    const iconConfig = {
      format: 'static',   // [static, animated]
      scale:  '1.0',      // [1.0, 2.0, 3.0]
      theme:  'dark'      // [light, dark]
    };

    /* TWITCH API */
    const getTwitchToken = async () => {
      let param = $.param({
        client_id: twitch_client_id,
        client_secret: twitch_client_secret,
        grant_type: 'client_credentials',
        scope: [
          'user:read:email',
          'channel:manage:polls',
          'channel:manage:broadcast',
          'channel:manage:predictions'
        ]
      });
      let url = `${TWITCH_TOKEN}?${param}`
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
          'Client-Id': twitch_client_id,
        },
      });
    };

    /* SPOTIFY API */
    const getAccessToken = async () => {
      const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basic}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: queryString.stringify({
          grant_type: 'refresh_token',
          refresh_token: spotify_refresh_token
        }),
      });

      return await response.json();
    };
    const getPlaybackState = async () => {
      const { access_token } = await getAccessToken();
      return fetch(PLAYBACK_STATE, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
    };
    const shuffleSong = async (param) => {
      const { access_token } = await getAccessToken();
      return fetch(`${SHUFFLE_SONG}?state=${param}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
    };
    const repeatSong = async (param) => {
      const { access_token } = await getAccessToken();
      return fetch(`${REPEAT_MODE}?state=${param}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
    };
    const prevSong = async () => {
      const { access_token } = await getAccessToken()
      return fetch(PREVIOUS_SONG, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
    };
    const nextSong = async () => {
      const { access_token } = await getAccessToken();
      return fetch(NEXT_SONG, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
    };
    const pauseSong = async () => {
      const { access_token } = await getAccessToken();
      return fetch(PAUSE_SONG, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
    };
    const playSong = async () => {
      const { access_token } = await getAccessToken();
      return fetch(PLAY_SONG, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
    };
    const volumeSong = async (param) => {
      const { access_token } = await getAccessToken();
      return fetch(`${VOLUME}?volume_percent=${param}`, {
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
    // setInterval(() =>
    //   getPlaybackState().then(res => res.status === 200 ? check_states() : ''), 15000);
    console.log('Spotify API');

    /* BOT CONNECTION */
    const config = {
      options: { debug: true },
      connection: {
        cluster: 'aws',
        reconnect: true,
        secure: true,
        timeout: 180000,
        reconnectDecay: 1.4,
        reconnectInterval: 1000
      },
      channels: [ twitch_user_name ],
      identity: {
        username: twitch_user_name,
        password: process.env.BOT_PASSWORD,
      }
    }

    const commands = {
      bot: {
        response: (user) =>
          `@${user}, KonCha`
      },
      roll: {
        response: (user) =>
          `@${user} rolls [ ${Math.floor(Math.random() * 100) + 1} ]`
      },
      github: {
        response: process.env.GITHUB
      },
    }

    const allSound = {
      // <COMMAND_NAME_1>: '/sounds/<FILE_NAME_1>.wav',
      // <COMMAND_NAME_2>: '/sounds/<FILE_NAME_2>.wav',
    }

    const client = new tmi.Client(config)
    client.connect().catch(console.error);

    /* EVENTS */
    client.on('connected', (address, port) => {
        onConnectedHandler(address, port)
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

      if (msg.charAt(0) === '!') {
        const [raw, command, argument] = message.match(regexpCommand);
        const { response } = commands[command] || {};
        if (typeof response === 'function')
          client.action(channel, response(tags.username));
        else if (typeof response === 'string')
          client.action(channel, response);
      // } else if ((msg.indexOf('<') > -1) && (msg !== '<3'))
      //   client.say(channel, `/delete ${tags['id']}`); // client.say(channel, `/ban ${tags.username} F`);
      } else if ((msg.charAt(0) !== prefix) && (msg.slice(0, 4) !== 'http'))
        onMessageHandler(channel, tags, message, self);
      else if ((msg.slice(12, 19) == 'youtube') || (msg.slice(8, 16) == 'youtu.be'))
        onLinkHandler(channel, tags, message, self);

      /* commands for mods */
      if (tags.mod == true || tags.username === twitch_user_name) {
        if (msg === '!next') nextSong(), sleep(500).then(() => spotifyCurrentTrack());
        if (msg === '!prev') prevSong(), sleep(500).then(() => spotifyCurrentTrack());
        if (msg === '!pause') pauseSong(), $('#btn-p img').attr('src', '/images/play.svg'), sleep(500).then(() => spotifyCurrentTrack());
        if (msg === '!play') playSong(), $('#btn-p img').attr('src', '/images/pause.svg'), sleep(500).then(() => spotifyCurrentTrack());
        if (msg.slice(0, 4) === '!vol') volumeSong(parseInt(msg.slice(5)));
        if (msg === '!mute') volumeSong(0);
      }

      /* commands for all */
      if (msg === '!sound') {
        var x = 'Sound commands:';
        $.each(allSound, function(i, n) {
          x += ` #${i}`;
        });
        client.action(channel, x);
      };
      if (msg.charAt(0) === '#') {
        let soundCommand = message.substring(1);
        let audio = new Audio(`/sounds/${soundCommand}.wav`);
        // audio.autoplay = true;
        // audio.muted = true;
        audio.volume = 0.1;
        audio.play();
      };
      if (msg === '!ping') ping(client, message, tags, channel, self);
      if (msg.slice(0, 4) === '!ban') {
        const ban = {
          1: 'Is permanently banned from this channel',
          2: 'var 2',
          3: 'var 3',
          4: 'var 4'
        };
        var n = Math.floor(Math.random() * 4) + 1;
        client.action(channel, `${msg.slice(5)} ${ban[n]}`);
      };
      if (msg === '!song') song(client, message, tags, channel, self);
      if (msg === 'skip') { // need to validate uniq user message by tags['user-id']
        skip_count++;
        if (skip_count == 3) {
          skip_count = 0;
          nextSong();
          client.action(channel, `Song has been skipped`);
          return;
        }
      };
      if (msg === '!follow') getUserFollowTime(client, message, tags, channel, self);
    });

    /* FUNCTIONS */
    function onConnectedHandler(address, port) {
      console.log(`Bot Connected: ${address}:${port}`)
    };
    function onDisconnectedHandler(reason) {
      console.log(`Bot Disconnected: ${reason}`)
    };
    function onHostedHandler (channel, username, viewers, autohost) {
      client.say(channel,
        `Thank you @${username} for the host of ${viewers}!`
      )
    };
    function onRaidedHandler(channel, username, viewers) {
      client.say(channel,
        `Thank you @${username} for the raid of ${viewers}!`
      )
    };
    function onSubscriptionHandler(channel, username, method, message, tags) {
      client.say(channel,
        `Thank you @${username} for subscribing!`
      )
    };
    function onCheerHandler(channel, tags, message)  {
      client.say(channel,
        `Thank you @${tags.username} for the ${tags.bits} bits!`
      )
    };
    function onGiftPaidUpgradeHandler(channel, username, sender, tags) {
      client.say(channel,
        `Thank you @${username} for continuing your gifted sub!`
      )
    };
    function onHostingHandler(channel, target, viewers) {
      client.say(channel,
        `We are now hosting ${target} with ${viewers} viewers!`
      )
    };
    function reconnectHandler() {
      console.log('Reconnecting...')
    };
    function resubHandler(channel, username, months, message, tags, methods) {
      const cumulativeMonths = tags['msg-param-cumulative-months']
      client.say(channel,
        `Thank you @${username} for the ${cumulativeMonths} sub!`
      )
    };
    function subGiftHandler(channel, username, streakMonths, recipient, methods, tags) {
      client.say(channel,
        `Thank you @${username} for gifting a sub to ${recipient}}.`
      )

      // this comes back as a boolean from twitch, disabling for now
      // "msg-param-sender-count": false
      // const senderCount =  ~~tags["msg-param-sender-count"];
      // client.say(channel,
      //   `${username} has gifted ${senderCount} subs!`
      // )
    };

    async function onMessageHandler(channel, tags, message, self) {
      const r = message.replace(/(\<\/?\w+\ ?>)/g, '\*');

      /* FIXME: high latency on callback/return user profile picture
      const { profile_image_url } = await getUserInfo(client, message, tags, channel, self);
      <span><img src=${profile_image_url} id="ch-user-pic"></span> */

      const b = replaceBadge(tags.badges);
      const e = replaceEmote(r);

      $('.chat').append(`
        <div id="ch-block">
          <span id="ch-badge">${b}</span>
          <p>
            <span style="color: ${tags.color}" id="ch-user">${tags['display-name']}: </span>
          </p>
          <span id="ch-msg">${e}</span>
        </div>
      `);
      clearChat();

      $('.chat').animate({scrollTop: document.body.scrollHeight}, 1000);
    };
    async function onLinkHandler(channel, tags, message, self) {
      const { profile_image_url } = await getUserInfo(client, message, tags, channel, self);
      const b = await replaceBadge(tags.badges);

      $.get(message, data => {
        let id = $(data).find('meta[itemprop=videoId]').attr('content');
        let title = $(data).find('meta[itemprop=name]').attr('content');
        // let i = `https://img.youtube.com/vi/${id}/0.jpg`;
        let img = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;

        $('.chat').append(`
          <div id="ch-block">
            <span id="ch-badge">${b}</span>
            <p>
              <span><img src=${profile_image_url} id="ch-user-pic"></span>
              <span style="color: ${tags.color}" id="ch-user">${tags['display-name']}: </span>
            </p>
            <span id="ch-msg">${`<a href="${message}"><img src="${img}" id="ch-ythumb" title="${title}"></a>`}</span>
          </div>
        `);
        clearChat();

        $('.chat').animate({scrollTop: document.body.scrollHeight}, 1000);
      });
    };

    function clearChat() {
      let msg_limit = $('.chat div').length;
      let msg_first = $('.chat').children(':first');
      if (msg_limit > 5)
        msg_first.remove();
    };
    function replaceBadge(b) {
      let badge = '';
      $.each(Object.keys(b), function(i, n) {
        const result = getAllBadges.find( ({ name }) => name === n );
        badge += `<img src=${result.link} id="ch-badge">`;
      });
      return badge;
    };
    function replaceEmote(e) {
      let m = [];
      $.each(e.split(' '), function(i, n) {
        const result = getAllEmotes.find( ({ name }) => name === n );
        typeof result == 'object' ? m.push(`<img src=${result.link} id="ch-emote">`) : m.push(n);
        return e = m.join(' ');
      });
      return e;
    };

    /* COMMANDS */
    function ping(client, message, tags, channel, self) {
      client.ping().then(data => {
        let ping = Math.floor(Math.round(data*1000))
        client.action(channel, `@${tags.username}, your ping is ${ping}ms`)
      });
    };
    function song(client, message, tags, channel, self) {
      spotifyCurrentTrack().then(res => typeof res === 'object' ? client.action(channel, `${res.artists.map((_artist) => _artist.name).join(', ')} - ${res.name} 👉 ${res.external_urls.spotify} 👈`) : '');
    };
    async function getUserInfo(client, message, tags, channel, self) {
      let param = $.param({
        login: tags.username
      });

      return await useTwitchToken(TWITCH_USER, param).then(res => res.json()).then(res => res.data[0]);
    };
    async function getUserFollowTime(client, message, tags, channel, self) {
      let param = $.param({
        to_id: twitch_user_id,
        from_login: tags.username
      });

      const x = await useTwitchToken(TWITCH_FOLLOW, param).then(res => res.json()).then(res => res.data[0].followed_at);
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
    async function getBadgesGlobal(client, message, tags, channel, self) {
      return await useTwitchToken(TWITCH_BADGES_GLOBAL).then(res => res.json()).then(res => res.data);
    };
    async function getChannelBadges(client, message, tags, channel, self) {
      let param = $.param({
        broadcaster_id: twitch_user_id,
      });

      return await useTwitchToken(TWITCH_BADGES, param).then(res => res.json()).then(res => res.data);
    };
    async function getEmotesGlobal(client, message, tags, channel, self) {
      return await useTwitchToken(TWITCH_EMOTES_GLOBAL).then(res => res.json()).then(res => res.data);
    };
    async function getChannelEmotes(client, message, tags, channel, self) {
      let param = $.param({
        broadcaster_id: twitch_user_id,
      });

      return await useTwitchToken(TWITCH_EMOTES, param).then(res => res.json()).then(res => res.data);
    };
    async function getChannelEmotesSet(client, message, tags, channel, self) {
      return client.emotesets;
    };
    async function getStreamInfo(client, message, tags, channel, self) {
      let param = $.param({
        broadcaster_id: twitch_user_id,
      });

      return useTwitchToken(TWITCH_CHANNEL, param).then(res => res.json()).then(res => res.data[0]);
    };
    async function getTimeFollow(client, message, tags, channel, self) {
      let param = $.param({
        to_id: twitch_user_id,
        from_login: tags.username
      });

      let t = await useTwitchToken(TWITCH_FOLLOW, param).then(res => res.json()).then(res => res.data[0].followed_at);
      let n = new Date().getTime();
      let f = (n - Date.parse(t));
      let year, month, day, hour, minute, second;

      second = Math.floor(f / 1000);
      minute = Math.floor(second / 60);
      second = second % 60;
      hour = Math.floor(minute / 60);
      minute = minute % 60;
      day = Math.floor(hour / 24);
      hour = hour % 24;
      month = Math.floor(day / 30);
      day = day % 30;
      year = Math.floor(month / 12);
      month = month % 12;

      var q = `${year}y ${month}m ${day}d ${hour}h ${minute}m ${second}s after followed!`;
      return q;
    };

    useTwitchToken(TWITCH_EMOTES_GLOBAL).then(res => res.json()).then(res => {
      let x = [];
      $.each(res.data, function(i, n) {
        x.push({
          id: n.id,
          name: n.name,
          link: `https://static-cdn.jtvnw.net/emoticons/v2/${n.id}/${iconConfig.format}/${iconConfig.theme}/${iconConfig.scale}`
        });
      });
      getAllEmotes = x;
    });
    useTwitchToken(TWITCH_BADGES_GLOBAL).then(res => res.json()).then(res => {
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
  });
}).call(this);
