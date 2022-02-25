(function() {
  $(document).on("turbolinks:load", function() {
    const queryString = require('query-string')
    const Buffer = require('buffer/').Buffer

    /* CREDENTIALS */
    const twitch_test_id =        process.env.TEST_ID;
    const twitch_user_id =        process.env.BOT_ID;
    const twitch_user_name =      process.env.BOT_NAME;
    const twitch_client_id =      process.env.TCLIENT_ID;
    const twitch_client_secret =  process.env.TCLIENT_SECRET;
    const spotify_client_id =     process.env.SCLIENT_ID;
    const spotify_client_secret = process.env.SCLIENT_SECRET;
    const spotify_refresh_token = process.env.SREFRESH_TOKEN;

    const basic = Buffer.from(`${spotify_client_id}:${spotify_client_secret}`).toString('base64');
    const sleep = ms => new Promise(res => setTimeout(() => res(), ms));
    const regexpCommand = new RegExp(/^!([a-zA-Z0-9]+)(?:\W+)?(.*)?/);
    const prefix = '#';
    let skip_count = 0;

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

    const TOKEN_ENDPOINT =       'https://accounts.spotify.com/api/token';
    const PLAYBACK_STATE =       'https://api.spotify.com/v1/me/player';                    // get
    const NOW_PLAYING =          'https://api.spotify.com/v1/me/player/currently-playing';  // get
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
    const getNowPlaying = async () => {
      const { access_token } = await getAccessToken();
      return fetch(NOW_PLAYING, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
    };
    const getPlaybackState = async () => {
      const { access_token } = await getAccessToken();
      return fetch(PLAYBACK_STATE, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
    };
    // const getCurrentPlaylist = async () => {
    //   const { access_token } = await getAccessToken();
    //   return fetch(PLAYLIST_ENDPOINT, {
    //     headers: {
    //       Authorization: `Bearer ${access_token}`,
    //     },
    //   });
    // };
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
    const spotifyCurrentTrack = async () => {
      const response = await getNowPlaying();
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
    // const spotifyPlaylist = async () => {
    //   const response = await getCurrentPlaylist();
    //   console.log(`response status: ${response.status}`);
    //   if (response.status === 204 || response.status > 400) {
    //     console.log(`Spotify offline`);
    //     $('#sp-title').text(`Spotify offline`);
    //     $('#sp-artist, #sp-albumName, #sp-albumImg, #sp-link').empty();
    //   } else if (response.status === 200) {
    //     const song = await response.json();
    //     const x = song.items;
    //     return x
    //   }
    // };

    function check_states() {
      getPlaybackState().then(res => res.json()).then(res => {
        res.shuffle_state === true ? $('#btn-shuffle').addClass('on') : $('#btn-shuffle').removeClass('on');
        res.repeat_state === 'off' ? $('#btn-repeat').removeClass('on') : $('#btn-repeat').addClass('on');
      });
    };
    $('#btn-info').click(() =>
      spotifyCurrentTrack().then(console.log(`Loading Spotify Data...`)).then(check_states()));
    $('#btn-next, #btn-forward').click(() =>
      Promise.all([nextSong(), sleep(500).then(() => spotifyCurrentTrack())]));
    $('#btn-previous').click(() =>
      Promise.all([prevSong(), sleep(500).then(() => spotifyCurrentTrack())]));
    $('#btn-pause').click(() =>
      Promise.all([pauseSong(), sleep(500).then(() => spotifyCurrentTrack())]));
    $('#btn-play').click(() =>
      Promise.all([playSong(), sleep(500).then(() => spotifyCurrentTrack())]));
    $('#btn-shuffle').click(() => {
      getPlaybackState()
        .then(res => res.json())
        .then(res => res.shuffle_state === false ? shuffleSong(true).then($('#btn-shuffle').addClass('on')) : shuffleSong(false).then($('#btn-shuffle').removeClass('on')))
    });
    $('#btn-repeat').click(() => {
      getPlaybackState()
        .then(res => res.json())
        .then(res => res.repeat_state === 'off' ? repeatSong('track').then($('#btn-repeat').addClass('on')) : repeatSong('off').then($('#btn-repeat').removeClass('on')))
    });
    setInterval(() =>
      getPlaybackState().then(res => res.status === 200 ? (spotifyCurrentTrack(), check_states()) : ''), 15000);
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
      github: { response: process.env.GITHUB },
    }

    const allSound = {
      booya:        '/sounds/booya.wav',
      bruh:         '/sounds/.wav',
      ding:         '/sounds/ding.wav',
      dio:          '/sounds/dio.wav',
      faild:        '/sounds/faild.wav',
      faith:        '/sounds/faith.wav',
      goblin:       '/sounds/goblin.wav',
      green:        '/sounds/green.wav',
      klk:          '/sounds/klk.wav',
      meteorit:     '/sounds/meteorit.wav',
      mgs:          '/sounds/mgs.wav',
      mk:           '/sounds/mk.wav',
      mucaraevo:    '/sounds/mucaraevo.wav',
      ntf:          '/sounds/ntf.wav',
      omg:          '/sounds/omg.wav',
      ouh:          '/sounds/ouh.wav',
      quieres:      '/sounds/quieres.wav',
      roger:        '/sounds/roger.wav',
      soi:          '/sounds/soi.wav',
      succ:         '/sounds/succ.wav',
      teme:         '/sounds/teme.wav',
      tuturu:       '/sounds/tuturu.wav',
      vkluchi:      '/sounds/vkluchi.wav',
      weeaboo:      '/sounds/weeaboo.wav',
      wrong:        '/sounds/wrong.wav',
      yare:         '/sounds/yare.wav',
      yooh:         '/sounds/yooh.wav',
    }

    const client = new tmi.Client(config)
    client.connect().catch(console.error);

    /* EVENTS */
    client.on('connected', (address, port) => {
        onConnectedHandler(address, port)
    })
    client.on('disconnected', (reason) => {
      onDisconnectedHandler(reason)
    })
    client.on('hosted', (channel, username, viewers, autohost) => {
      onHostedHandler(channel, username, viewers, autohost)
    })
    client.on('subscription', (channel, username, method, message, tags) => {
      onSubscriptionHandler(channel, username, method, message, tags)
    })
    client.on('raided', (channel, username, viewers) => {
      onRaidedHandler(channel, username, viewers)
    })
    client.on('cheer', (channel, tags, message) => {
      onCheerHandler(channel, tags, message)
    })
    client.on('giftpaidupgrade', (channel, username, sender, tags) => {
      onGiftPaidUpgradeHandler(channel, username, sender, tags)
    })
    client.on('hosting', (channel, target, viewers) => {
      onHostingHandler(channel, target, viewers)
    })
    client.on('reconnect', () => {
      reconnectHandler()
    })
    client.on('resub', (channel, username, months, message, tags, methods) => {
      resubHandler(channel, username, months, message, tags, methods)
    })
    client.on('subgift', (channel, username, streakMonths, recipient, methods, tags) => {
      subGiftHandler(channel, username, streakMonths, recipient, methods, tags)
    })

    client.on('chat', (channel, tags, message, self) => {
      if (self) return;
      // if (tags.username === 'a_s_m_n') return;
      let msg = message.toLowerCase();

      if (msg.charAt(0) === '!') {
        const [raw, command, argument] = message.match(regexpCommand);
        const { response } = commands[command] || {};
        if (typeof response === 'function')
          client.action(channel, response(tags.username));
        else if (typeof response === 'string')
          client.action(channel, response);
      } else
        onMessageHandler(channel, tags, message, self);

      /* commands for mods */
      if (tags.mod == true || tags.username === twitch_user_name) {
        if (msg === '!next') Promise.all([nextSong(), sleep(1000).then(() => spotifyCurrentTrack())]).then(client.action(channel, `Song has been skipped to next`));
        if (msg === '!prev') Promise.all([prevSong(), sleep(1000).then(() => spotifyCurrentTrack())]).then(client.action(channel, `Song has been skipped to previous`));
        if (msg === '!pause') Promise.all([pauseSong(), sleep(1000).then(() => spotifyCurrentTrack())]);
        if (msg === '!play') Promise.all([playSong(), sleep(1000).then(() => spotifyCurrentTrack())]);
        // if (msg === '!playlist') playlist(client, message, tags, channel, self);

        /* test commands */
        if (msg === '!info') getStreamInfo(client, message, tags, channel, self).then(res => console.log(res));
        // if (msg.slice(0, 6) === '!title') changeTitle(client, message, tags, channel, self);
        if (msg === '!u') getUserInfo(client, message, tags, channel, self).then(res => console.log(res));
        if (msg === '!gb') getBadgesGlobal(client, message, tags, channel, self).then(res => console.log(res));
        if (msg === '!cb') getChannelBadges(client, message, tags, channel, self).then(res => console.log(res));
        if (msg === '!ge') getEmotesGlobal(client, message, tags, channel, self).then(res => console.log(res));
        if (msg === '!ce') getChannelEmotes(client, message, tags, channel, self).then(res => console.log(res));
        if (msg === '!es') getChannelEmotesSet(client, message, tags, channel, self).then(res => console.log(res));
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
          2: 'BAN SMOrc',
          3: 'BibleThump',
          4: 'AngelThump'
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
    })

    /* FUNCTIONS */
    function onConnectedHandler(address, port) {
      console.log(`Bot Connected: ${address}:${port}`)
      // client.action(twitch_user_name, "I'm alive! VoHiYo")
    };
    function onDisconnectedHandler(reason) {
      console.log(`Bot Disconnected: ${reason}`)
      // client.action(twitch_user_name, "NotLikeThis")
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

    async function onMessageHandler (channel, tags, message, self) {
      if (message.charAt(0) !== prefix) {
        // console.log(tags);

        const b = await replaceBadge();
        let badge = '';
        $.each(Object.keys(tags.badges), function(i, n) {
          const result = b.find( ({ name }) => name === n );
          badge += `<img src=${result.link} id="ch-badge">`;
        });

        const e = await replaceEmote();
        let m = [];
        $.each(message.split(' '), function(i, n) {
          const result = e.find( ({ name }) => name === n );
          typeof result == 'object' ? m.push(`<img src=${result.link} id="ch-emote">`) : m.push(n);
          message = m.join(' ');
        });

        $('.chat').append(
          `<p>
            <span id="ch-block">${badge}</span>
            <span style="color: ${tags.color}" id="ch-user">${tags['display-name']}: </span>
            <span id="ch-msg">${message}</span>
          </p>`
        )
        clearChat();
      }
    };
    function clearChat() {
      let msg_limit = $('.chat p').length;
      let msg_first = $('.chat').children(':first');
      if (msg_limit > 5)
        msg_first.remove();
    };
    async function replaceEmote() {
      const emotes = await getEmotesGlobal();
      const channelEmotes = await getChannelEmotes();
      let x = emotes.concat(channelEmotes);
      let y = [];
      $.each(x, function(i, n) {
        y.push({
          id: n.id,
          name: n.name,
          link: `https://static-cdn.jtvnw.net/emoticons/v2/${n.id}/${iconConfig.format}/${iconConfig.theme}/${iconConfig.scale}`
        });
      });
      // console.log(y);
      return y;
    };
    async function replaceBadge() {
      const badges = await getBadgesGlobal();
      let x = [];
      $.each(badges, function(i, n) {
        if (n.versions.length == 1)
          x.push({
            name: n.set_id,
            link: n.versions[0].image_url_1x,
          });
          // console.log(`${n.set_id}: ${n.versions[0].image_url_1x}`);
        else if (n.versions.length > 1)
          for (let k = 0; k < n.versions.length; k++)
            x.push({
              name: `${n.set_id}_${n.versions[k].id}`,
              link: n.versions[0].image_url_1x,
            });
            // console.log(`${n.set_id}_${n.versions[k].id}: ${n.versions[k].image_url_1x}`);
      });
      // console.log(x);
      return x;
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
        // broadcaster_id: twitch_user_id,
        broadcaster_id: twitch_test_id,
      });
      return await useTwitchToken(TWITCH_BADGES, param).then(res => res.json()).then(res => res.data);
    };
    async function getEmotesGlobal(client, message, tags, channel, self) {
      return await useTwitchToken(TWITCH_EMOTES_GLOBAL).then(res => res.json()).then(res => res.data);
    };
    async function getChannelEmotes(client, message, tags, channel, self) {
      let param = $.param({
        // broadcaster_id: twitch_user_id,
        broadcaster_id: twitch_test_id,
      });
      return await useTwitchToken(TWITCH_EMOTES, param).then(res => res.json()).then(res => res.data);
    };
    async function getChannelEmotesSet(client, message, tags, channel, self) {
      return client.emotesets;
      // return await getChannelEmotes().then(res => res[0].emote_set_id);
    };
    // async function createPoll(client, message, tags, channel, self) {
    //   const poll = async () => {
    //     let data = {
    //       broadcaster_id: twitch_user_id,
    //       title: `1st var or 2nd var!`,
    //       choices: [
    //         { title: `1st var` },
    //         { title: `2nd var` }
    //       ],
    //       duration: 1800,
    //     };
    //     const { access_token } = await getTwitchToken();
    //     const response = await fetch(TWITCH_POLL, {
    //       method: 'POST',
    //       headers: {
    //         Authorization: `Bearer ${access_token}`,
    //         'Client-Id': twitch_client_id,
    //       },
    //       body: JSON.stringify(data)
    //     }).then((res) => res.json());
    //   };
    //
    //   const response = await poll();
    //   const x = response.data;
    //   console.log(x);
    // };
    // async function createPrediction(client, message, tags, channel, self) {
    //   const predictions = async () => {
    //     let data = {
    //       broadcaster_id: twitch_user_id,
    //       title: `W or L?`,
    //       outcomes: [
    //         { title: `yep` },
    //         { title: `nope` }
    //       ],
    //       prediction_window: 120,
    //     };
    //     const { access_token } = await getTwitchToken();
    //     const response = await fetch(TWITCH_PREDICTIONS, {
    //       method: 'POST',
    //       headers: {
    //         Authorization: `Bearer ${access_token}`,
    //         'Client-Id': twitch_client_id,
    //       },
    //       body: JSON.stringify(data)
    //     }).then((res) => res.json());
    //   };
    //
    //   const response = await predictions();
    //   const x = response.data;
    //   console.log(x);
    // };
    async function getStreamInfo(client, message, tags, channel, self) {
      let param = $.param({
        broadcaster_id: twitch_user_id,
      });

      return useTwitchToken(TWITCH_CHANNEL, param).then(res => res.json()).then(res => res.data[0]);
    };
    // async function changeTitle(client, message, tags, channel, self) {
    //   const newTitle = async () => {
    //     const title = message.slice(7);
    //     console.log(title);
    //     let data = {
    //       // game_id: '1469308723', // "Software and Game Development"
    //       title: title,
    //       // broadcaster_language: 'en'
    //     };
    //     let param = $.param({
    //       broadcaster_id: twitch_user_id,
    //     });
    //     let url = `${TWITCH_CHANNEL}?${param}`;
    //     const { access_token } = await getTwitchToken();
    //     return fetch(url, {
    //       method: 'PATCH',
    //       headers: {
    //         Authorization: `Bearer ${access_token}`,
    //         'Client-Id': twitch_client_id,
    //         'Content-Type': 'application/json',
    //       },
    //       body: JSON.stringify(data)
    //     }).then((res) => res.json());
    //   }
    //
    //   const response = await newTitle();
    //   const x = response;
    //   console.log(x);
    // };

    /*
        if you want whispers messages from bot to user:
            https://dev.twitch.tv/limit-increase

        // Handle different message types..
        switch(tags["message-type"]) {
            case "action":
                // This is an action message..
                break;
            case "chat":
                // This is a chat message..
                break;
            case "whisper":
                // This is a whisper..
                break;
            default:
                // Something else ?
                break;
        }
    */
  });
}).call(this);
