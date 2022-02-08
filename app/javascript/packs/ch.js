(function() {
  $(document).on("turbolinks:load", function() {
    const queryString = require('query-string')
    const Buffer = require('buffer/').Buffer

    /* CREDENTIALS */
    const twitch_user_id =        process.env.BOT_ID;
    const twitch_user_name =      process.env.BOT_NAME;
    const twitch_client_id =      process.env.TCLIENT_ID;
    const twitch_client_secret =  process.env.TCLIENT_SECRET;
    const spotify_client_id =     process.env.SCLIENT_ID;
    const spotify_client_secret = process.env.SCLIENT_SECRET;
    const spotify_refresh_token = process.env.SREFRESH_TOKEN;

    const basic = Buffer.from(`${spotify_client_id}:${spotify_client_secret}`).toString('base64');
    let skip_count = 0;

    /* ENDPOINTS */
    const TWITCH_TOKEN =         'https://id.twitch.tv/oauth2/token';
    const TWITCH_INFO =          'https://api.twitch.tv/helix/channels';
    const TWITCH_BADGES_GLOBAL = 'https://api.twitch.tv/helix/chat/badges/global';
    const TWITCH_BADGES =        'https://api.twitch.tv/helix/chat/badges';
    const TWITCH_EMOTES_GLOBAL = 'https://api.twitch.tv/helix/chat/emotes/global';
    const TWITCH_EMOTES =        'https://api.twitch.tv/helix/chat/emotes';
    const TWITCH_EMOTES_SET =    'https://api.twitch.tv/helix/chat/emotes/set';
    const TWITCH_FOLLOW =        'https://api.twitch.tv/helix/users/follows';
    const TWITCH_POLL =          'https://api.twitch.tv/helix/polls';
    const TWITCH_PREDICTIONS =   'https://api.twitch.tv/helix/predictions';

    const TOKEN_ENDPOINT =       'https://accounts.spotify.com/api/token';
    const NEXT_SONG =            'https://api.spotify.com/v1/me/player/next';
    const NOW_PLAYING =          'https://api.spotify.com/v1/me/player/currently-playing';

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
      })
      let url = `${TWITCH_TOKEN}?${param}`
      const response = await fetch(url, {
        method: 'POST',
      });

      const x = await response.json()
      return x
    }
    // const useTwitchToken = async () => {
    //   const { access_token } = await getTwitchToken();
    //   /*
    //       work with access_token
    //   */
    // }

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

      const x = await response.json()
      return x
    }
    const getNowPlaying = async () => {
      const { access_token } = await getAccessToken()
      return fetch(NOW_PLAYING, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
    }
    const getCurrentPlaylist = async () => {
      const { access_token } = await getAccessToken()
      return fetch(PLAYLIST_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
    }
    const nextSong = async () => {
      const { access_token } = await getAccessToken()
      return fetch(NEXT_SONG, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
    }
    const spotifyCurrentTrack = async (_, res) => {
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
        const x = song.item;
        return x
      }
    }
    // const spotifyPlaylist = async (_, res) => {
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
    // }
    $('#btn').click(function() {
      console.log(`Loading Spotify Data...`);
      spotifyCurrentTrack();
    });
    console.log('Spotify API');

    const regexpCommand = new RegExp(/^!([a-zA-Z0-9]+)(?:\W+)?(.*)?/);
    const prefix = '#';

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
      github: { response: 'https://github.com/INexizI' }
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

      // commands for mods
      if (tags.mod == true || tags.username === twitch_user_name) {
        if (msg === '!next') {
          nextSong();
          client.action(channel, `Song has been skipped`);
          return;
        }
        // if (msg === '!playlist') {
        //   playlist(client, message, tags, channel, self);
        //   return;
        // }
      }

      // commands for all
      if (msg === '!sound') {
        var x = 'Sound commands:';
        $.each(allSound, function(i, n) {
          x += ` #${i}`;
        })
        client.action(channel, x)
      }
      if (msg.charAt(0) === '#') {
        let soundCommand = message.substring(1);
        let audio = new Audio(`/sounds/${soundCommand}.wav`);
        // audio.autoplay = true;
        // audio.muted = true;
        audio.volume = 0.1;
        audio.play();
      }
      if (msg === '!ping') {
        ping(client, message, tags, channel, self);
        return;
      }
      if (msg.slice(0, 4) === '!ban') {
        const ban = {
          1: 'Is permanently banned from this channel',
          2: 'BAN SMOrc',
          3: 'BibleThump',
          4: 'AngelThump'
        };
        var n = Math.floor(Math.random() * 4) + 1;
        client.action(channel, `${msg.slice(5)} ${ban[n]}`);
      }
      if (msg === '!song') {
        song(client, message, tags, channel, self);
        return;
      }
      if (msg === 'skip') { // need to validate uniq user message by tags['user-id']
        skip_count++;
        if (skip_count == 3) {
          skip_count = 0;
          nextSong();
          client.action(channel, `Song has been skipped`);
          return;
        }
      }
      if (msg === '!follow') {
        getUserFollowTime(client, message, tags, channel, self);
        return;
      }
      if (msg === '!info') {
        getStreamInfo(client, message, tags, channel, self);
        return;
      }
      // if (msg.slice(0, 6) === '!title') {
      //   changeTitle(client, message, tags, channel, self);
      //   return;
      // }
      if (msg === '!emotes') {
        getChannelEmotes(client, message, tags, channel, self);
        return;
      }
      if (msg === '!set') {
        getChannelEmotesSet(client, message, tags, channel, self);
        return;
      }
    })

    /* FUNCTIONS */
    function onConnectedHandler(address, port) {
      console.log(`Bot Connected: ${address}:${port}`)
      // client.action(twitch_user_name, "I'm alive! VoHiYo")
    }
    function onDisconnectedHandler(reason) {
      console.log(`Bot Disconnected: ${reason}`)
      // client.action(twitch_user_name, "NotLikeThis")
    }
    function onHostedHandler (channel, username, viewers, autohost) {
      client.say(channel,
        `Thank you @${username} for the host of ${viewers}!`
      )
    }
    function onRaidedHandler(channel, username, viewers) {
      client.say(channel,
        `Thank you @${username} for the raid of ${viewers}!`
      )
    }
    function onSubscriptionHandler(channel, username, method, message, tags) {
      client.say(channel,
        `Thank you @${username} for subscribing!`
      )
    }
    function onCheerHandler(channel, tags, message)  {
      client.say(channel,
        `Thank you @${tags.username} for the ${tags.bits} bits!`
      )
    }
    function onGiftPaidUpgradeHandler(channel, username, sender, tags) {
      client.say(channel,
        `Thank you @${username} for continuing your gifted sub!`
      )
    }
    function onHostingHandler(channel, target, viewers) {
      client.say(channel,
        `We are now hosting ${target} with ${viewers} viewers!`
      )
    }
    function reconnectHandler() {
      console.log('Reconnecting...')
    }
    function resubHandler(channel, username, months, message, tags, methods) {
      const cumulativeMonths = tags['msg-param-cumulative-months']
      client.say(channel,
        `Thank you @${username} for the ${cumulativeMonths} sub!`
      )
    }
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
    }

    function onMessageHandler (channel, tags, message, self) {
      if (message.charAt(0) !== prefix) {
        const broadcaster = 'https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/1'
        const moderator = 'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/1'
        // const subscriber = '' // subscriber badges
        $('.chat').append(
          `<p>
          ${tags.subscriber == true ? `<img src=${subscriber} id="ch-badge">` : ''}
          ${tags.username === twitch_user_name ? `<img src=${broadcaster} id="ch-badge">` : ''}
          ${tags.mod == true ? `<img src=${moderator} id="ch-badge">` : ''}
          <span style="color: ${tags.color}" id="ch-user">${tags['display-name']}: </span>
          ${message === 'Kappa' ? '<img src="https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/1.0" id="ch-emote">' : `<span id="ch-msg">${message}</span>`}
          </p>`
        )
        clearChat()
      }
    }
    function clearChat() {
      let msg_limit = $('.chat p').length;
      let msg_first = $('.chat').children(':first');
      if (msg_limit > 5)
        msg_first.remove();
    }

    /* COMMANDS */
    function ping(client, message, tags, channel, self) {
      client.ping().then(function(data) {
        let ping = Math.floor(Math.round(data*1000))
        client.action(channel, `@${tags.username}, your ping is ${ping}ms`)
      })
    }
    function song(client, message, tags, channel, self) {
      const getSong = async () => {
        const cs = await spotifyCurrentTrack();
        if (typeof cs !== 'undefined')
          client.action(channel, `${cs.artists.map((_artist) => _artist.name).join(', ')} - ${cs.name} 👉 ${cs.external_urls.spotify} 👈`)
      }
      getSong()
    }
    // function playlist(client, message, tags, channel, self) {
    //   const getPlaylist = async () => {
    //     const pl = await spotifyPlaylist();
    //     if (typeof pl !== 'undefined')
    //       console.log(pl)
    //   }
    //   getPlaylist()
    // }
    // async function getUserInfo(client, message, tags, channel, self) {
    //   const userInfo = async () => {
    //     let url = `https://api.twitch.tv/helix/users?login=${tags.username}`
    //     const { access_token } = await getTwitchToken();
    //     return fetch(url, {
    //       headers: {
    //         Authorization: `Bearer ${access_token}`,
    //         'Client-Id': twitch_client_id,
    //       },
    //     }).then((res) => res.json())
    //   }
    //   const response = await userInfo();
    //   const x = response.data[0];
    //   return x;
    // }
    async function getUserFollowTime(client, message, tags, channel, self) {
      const followTime = async () => {
        let param = $.param({
          to_id: twitch_user_id,
          from_login: tags.username
        });
        let url = `${TWITCH_FOLLOW}?${param}`;
        const { access_token } = await getTwitchToken();
        return fetch(url, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Client-Id': twitch_client_id,
          },
        }).then((res) => res.json());
      };
      const response = await followTime();
      const x = response.data[0].followed_at;
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
    }
    async function getChannelBadgesGlobal(client, message, tags, channel, self) {
      const channelBadgesGlobal = async () => {
        let url = `${TWITCH_BADGES_GLOBAL}`;
        const { access_token } = await getTwitchToken();
        return fetch(url, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Client-Id': twitch_client_id,
          },
        }).then((res) => res.json());
      };
      const response = await channelBadgesGlobal();
      const x = response.data
      console.log(x);
    }
    async function getChannelBadges(client, message, tags, channel, self) {
      const channelBadges = async () => {
        let param = $.param({
          broadcaster_id: twitch_user_id,
        });
        let url = `${TWITCH_BADGES}?${param}`;
        const { access_token } = await getTwitchToken();
        return fetch(url, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Client-Id': twitch_client_id,
          },
        }).then((res) => res.json());
      };
      const response = await channelBadges();
      const x = response.data
      console.log(x);
    }
    async function getEmotesGlobal(client, message, tags, channel, self) {
      const emotesGlobal = async () => {
        let url = `${TWITCH_EMOTES_GLOBAL}`;
        const { access_token } = await getTwitchToken();
        return fetch(url, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Client-Id': twitch_client_id,
          },
        }).then((res) => res.json());
      };
      const response = await emotesGlobal();
      const x = response.data
      console.log(x);
    }
    async function getChannelEmotes(client, message, tags, channel, self) {
      const channelEmotes = async () => {
        let param = $.param({
          // broadcaster_id: twitch_user_id,
          broadcaster_id: '31089858',
        });
        let url = `${TWITCH_EMOTES}?${param}`;
        const { access_token } = await getTwitchToken();
        return fetch(url, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Client-Id': twitch_client_id,
          },
        }).then((res) => res.json());
      };
      const response = await channelEmotes();
      const x = response.data
      console.log(x);
      return x[0];
    }
    async function getChannelEmotesSet(client, message, tags, channel, self) {
      const channelSet = async () => {
        const { emote_set_id } = await getChannelEmotes();
        let param = $.param({
          emote_set_id: emote_set_id,
        });
        let url = `${TWITCH_EMOTES_SET}?${param}`;
        const { access_token } = await getTwitchToken();
        return fetch(url, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Client-Id': twitch_client_id,
          },
        }).then((res) => res.json());
      };
      const response = await channelSet();
      const x = response.data
      console.log(x);
    }
    function qwe() {
      'https://static-cdn.jtvnw.net/emoticons/v2/<id>/<format>/<theme_mode>/<scale>'
      'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_8c568486560d4ebeabf7f86ae97bc85d/animated/dark/3.0'
    }
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
    // }
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
    // }
    async function getStreamInfo(client, message, tags, channel, self) {
      const getInfo = async () => {
        let param = $.param({
          broadcaster_id: twitch_user_id,
        });
        let url = `${TWITCH_INFO}?${param}`;
        const { access_token } = await getTwitchToken();
        return fetch(url, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Client-Id': twitch_client_id,
          },
        }).then((res) => res.json());
      }

      const response = await getInfo();
      const x = response.data[0];
      console.log(x);
    }
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
    //     let url = `${TWITCH_INFO}?${param}`;
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
    // }

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
