import tmi from 'tmi.js'

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
  { name: 'booya', value: '/sounds/booya.wav' },
  { name: 'ding', value: '/sounds/ding_ding_ding.mp3' },
  { name: 'faith', value: '/sounds/faith.mp3' },
  { name: 'goblin', value: '/sounds/goblin.wav' },
  { name: 'green', value: '/sounds/green.wav' },
  { name: 'way', value: '/sounds/klk.mp3' },
  { name: 'dio', value: '/sounds/kono_dio_da.mp3' },
  { name: 'mk', value: '/sounds/mk.mp3' },
  { name: 'meteorit', value: '/sounds/meteorit.wav' },
  { name: 'mgs', value: '/sounds/mgs.mp3' },
  { name: 'succ', value: '/sounds/succ.mp3' }
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
  if (tags.username === process.env.TWITCH_BOT_USERNAME) return;

  if (message.charAt(0) == '!') {
    const [raw, command, argument] = message.match(regexpCommand);
    const { response } = commands[command] || {};
    if (typeof response === 'function')
      client.action(channel, response(tags.username));
    else if (typeof response === 'string')
      client.action(channel, response);

    var soundCommand = message.substring(1);
    var audio = new Audio('/sounds/' + soundCommand + '.mp3');
    audio.play();
  };

  if (message.toLowerCase() === '!ping') {
    ping(client, message, tags, channel, self)
    return
  }

  onMessageHandler(channel, tags, message, self)
})

/* FUNCTIONS */
function onConnectedHandler(address, port) {
    console.log(`Bot Connected: ${address}:${port}`)
    client.action("a_s_m_n", "I'm alive! VoHiYo")
}
function onDisconnectedHandler(reason) {
    console.log(`Bot Disconnected: ${reason}`)
    client.action("a_s_m_n", "NotLikeThis")
}
function onMessageHandler (channel, tags, message, self) {
//   checkTwitchChat(tags, message, channel)
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
