(function() {
  $(document).on("turbolinks:load", function() {
    const queryString = require('query-string')
    const Buffer = require('buffer/').Buffer

    const client_id = 'c79d615a151e4d6fbb37a0f3468ff3c9';
    const client_secret = '4e4a37e225654065bff02e3954a8b2fd';
    const refresh_token = 'AQCuORMiFq2ETN1CQX9UR5B5IrezZq5hTo1Rz0csk84ciKvJgTn-RKxXKUkZzhGt2as3XoqtGqnod4QxlNw4NSLrWiKM0EAoKKYLIloaxbOinRxIP7WYcyC59hLapOClI8s';

    const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
    const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`;
    const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

    const getAccessToken = async () => {
      const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basic}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: queryString.stringify({
          grant_type: 'refresh_token',
          refresh_token: refresh_token
        }),
      });

      const x = await response.json();
      return x
    }

    const getNowPlaying = async () => {
      const { access_token } = await getAccessToken()

      return fetch(NOW_PLAYING_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
    }

    const spotifyData = async (_, res) => {
      const response = await getNowPlaying();
      console.log(`response status: ${response.status}`)

      if (response.status === 204 || response.status > 400) {
        // return res.status(200).json({ isPlaying: false });
        console.log(`Spotify offline`)
        $('#sp-title').text(`Spotify offline`)
      } else if (response.status === 200) {
        const song = await response.json();
        console.log(song);
        const isPlaying = song.is_playing;
        if (song.item === null) {
          $('#sp-title').text(`Current song can't be find`)
          $('#sp-artist, #sp-albumName, #sp-albumImg, #sp-link').empty()
        } else {
          const title = song.item.name;
          const artist = song.item.artists.map((_artist) => _artist.name).join(', ');
          // const album = song.item.album.name;
          const albumImageUrl = song.item.album.images[0].url;
          const songUrl = song.item.external_urls.spotify;
          const currentSong = [
            { isPlaying: isPlaying },
            { title: title },
            { artist: artist },
            // { album: album },
            { albumImageUrl: albumImageUrl },
            { songUrl: songUrl }
          ]
          $('#sp-title').text(title)
          $('#sp-artist').text(artist)
          // $('#sp-albumName').text(album)
          $('#sp-albumImg').html(`<img src="${albumImageUrl}">`)
          $('#sp-link').html(`<a target="_blank" rel="noopener noreferrer" href="${songUrl}">song here</a>`)
        }
        // const isPlaying = song.is_playing;
        // const title = song.item.name;
        // const artist = song.item.artists.map((_artist) => _artist.name).join(', ');
        // const album = song.item.album.name;
        // const albumImageUrl = song.item.album.images[0].url;
        // const songUrl = song.item.external_urls.spotify;

        const qq = song.item;
        return qq
      }
      // setTimeout(spotifyData, 60000)
    }
    $('#btn').click(function() {
      console.log(`Loading Spotify Data...`);
      spotifyData();
    });
    console.log('Spotify API');

    const regexpCommand = new RegExp(/^!([a-zA-Z0-9]+)(?:\W+)?(.*)?/);
    const prefix = '#';

    /* CONNECTION OPTIONS */
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
      channels: [ 'a_s_m_n' ],
      identity: {
        username: 'a_s_m_n',
        password: 'oauth:a080402tz6v7cvhw67dgrg7j99l7bt' /* separated you and bot */
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

    const allSound = [
      // { name: 'ding', value: '/sounds/ding_ding_ding.mp3' },
      // { name: 'faith', value: '/sounds/faith.mp3' },
      // { name: 'dio', value: '/sounds/kono_dio_da.mp3' },
      // { name: 'way', value: '/sounds/klk.mp3' },
      { name: 'mk', value: '/sounds/mk.mp3' },
      { name: 'mgs', value: '/sounds/mgs.mp3' },
      { name: 'succ', value: '/sounds/succ.mp3' },
      // { name: 'booya', value: '/sounds/booya.wav' },
      // { name: 'goblin', value: '/sounds/goblin.wav' },
      // { name: 'green', value: '/sounds/green.wav' },
      // { name: 'meteorit', value: '/sounds/meteorit.wav' },
    ]

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
      if (tags.username === 'a_s_m_n') return;

      if (message.charAt(0) == '!') {
        const [raw, command, argument] = message.match(regexpCommand);
        const { response } = commands[command] || {};
        if (typeof response === 'function')
          client.action(channel, response(tags.username));
        else if (typeof response === 'string')
          client.action(channel, response);
      };

      if (message.toLowerCase() === '!succ' || message.toLowerCase() === '!mgs' || message.toLowerCase() === '!mk') {
        var soundCommand = message.substring(1);
        var audio = new Audio('/sounds/' + soundCommand + '.mp3');
        // audio.autoplay = true;
        // audio.muted = true;
        audio.volume = 0.1;
        audio.play();
      }
      if (message.toLowerCase() === '!ping') {
        ping(client, message, tags, channel, self);
        return;
      }
      if (message.toLowerCase().slice(0, 4) === '!ban') {
        const ban = {
          1: 'Is permanently banned from this channel',
          2: 'BAN SMOrc',
          3: 'BibleThump',
          4: 'AngelThump'
        };
        var n = Math.floor(Math.random() * 4) + 1;
        client.action(channel, `${message.toLowerCase().slice(5)} ${ban[n]}`);
      }
      if (message.toLowerCase() === '!song') {
        song(client, message, tags, channel, self);
        return;
      }

      onMessageHandler(channel, tags, message, self);
    })

    /* FUNCTIONS */
    function onConnectedHandler(address, port) {
      console.log(`Bot Connected: ${address}:${port}`)
      // client.action("a_s_m_n", "I'm alive! VoHiYo")
    }
    function onDisconnectedHandler(reason) {
      console.log(`Bot Disconnected: ${reason}`)
      client.action("a_s_m_n", "NotLikeThis")
    }
    function onMessageHandler (channel, tags, message, self) {
      // checkTwitchChat(tags, message, channel)
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
    function reconnectHandler () {
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

    /* COMMANDS */
    function ping(client, message, tags, channel, self) {
      client.ping().then(function(data) {
        let ping = Math.floor(Math.round(data*1000))
        client.action(channel, `@${tags.username}, your ping is ${ping}ms`)
      })
    }
    function song(client, message, tags, channel, self) {
      const getSong = async () => {
        const cs = await spotifyData();
        console.log(cs);
        client.action(channel, `@${tags.username}, ${cs.artists.map((_artist) => _artist.name).join(', ')} - ${cs.name} ${cs.external_urls.spotify} 👈`)
        // client.action(channel, `qwe`)
      }
      getSong()
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
