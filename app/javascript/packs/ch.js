(function() {
  $(document).on("turbolinks:load", function() {
    const queryString = require('query-string')
    const Buffer = require('buffer/').Buffer

    const twitch_user_id = process.env.BOT_ID;
    const twitch_user_name = process.env.BOT_NAME;
    const twitch_client_id = process.env.TCLIENT_ID;
    const twitch_client_secret = process.env.TCLIENT_SECRET;
    const spotify_client_id = process.env.SCLIENT_ID;
    const spotify_client_secret = process.env.SCLIENT_SECRET;
    const spotify_refresh_token = process.env.SREFRESH_TOKEN;

    const basic = Buffer.from(`${spotify_client_id}:${spotify_client_secret}`).toString('base64');
    const TWITCH_TOKEN = 'https://id.twitch.tv/oauth2/token';
    const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;
    const NEXT_SONG = 'https://api.spotify.com/v1/me/player/next';
    const NOW_PLAYING = `https://api.spotify.com/v1/me/player/currently-playing`;
    let skip_count = 0;

    const getTwitchToken = async () => {
      let url = 'https://id.twitch.tv/oauth2/token?' + $.param({
        client_id: twitch_client_id,
        client_secret: twitch_client_secret,
        grant_type: 'client_credentials',
        scope: 'user:read:email'
      })
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

    /* SPOTIFY */
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
      ding:     '/sounds/ding_ding_ding.mp3',
      faith:    '/sounds/faith.mp3',
      dio:      '/sounds/kono_dio_da.mp3',
      way:      '/sounds/klk.mp3',
      mk:       '/sounds/mk.mp3',
      mgs:      '/sounds/mgs.mp3',
      succ:     '/sounds/succ.mp3',
      booya:    '/sounds/booya.wav',
      goblin:   '/sounds/goblin.wav',
      green:    '/sounds/green.wav',
      meteorit: '/sounds/meteorit.wav',
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

      if (message.charAt(0) == '!') {
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
          x += ` !${i}`;
        })
        client.action(channel, x)
      }
      if (msg === '!succ' || msg === '!mgs' || msg === '!mk' || msg === '!booya') {
        let soundCommand = message.substring(1);
        let audio = new Audio(`/sounds/${soundCommand}.mp3`);
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
      const moderator = 'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/1'
      const broadcaster = 'https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/1'
      $('.chat').append(
        `<p>
          ${(tags.mod == true ? '<img src=' + moderator + ' id="ch-badge">' : '')}
          <span style="color: ${tags.color}" id="ch-user">${tags['display-name']}: </span>
          <span id="ch-msg">${message}</span>
        </p>`
      )
      clearChat()
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
        let url = `https://api.twitch.tv/helix/users/follows?to_id=${twitch_user_id}&from_login=${tags.username}`
        const { access_token } = await getTwitchToken();
        return fetch(url, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Client-Id': twitch_client_id,
          },
        }).then((res) => res.json())
      }
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
