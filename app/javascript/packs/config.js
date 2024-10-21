/* CREDENTIALS */
const CREDENTIALS = {
  twitch_user_id:            process.env.BOT_ID,
  twitch_user_name:          process.env.BOT_NAME,
  twitch_client_id:          process.env.TCLIENT_ID,
  twitch_client_secret:      process.env.TCLIENT_SECRET,
  spotify_client_id:         process.env.SCLIENT_ID,
  spotify_client_secret:     process.env.SCLIENT_SECRET,
  spotify_refresh_token:     process.env.SREFRESH_TOKEN,
  spotify_client_id_alt:     process.env.SCLIENT_ID_ALT,
  spotify_client_secret_alt: process.env.SCLIENT_SECRET_ALT,
  spotify_refresh_token_alt: process.env.SREFRESH_TOKEN_ALT,
  crypto_key:                process.env.CRYPTO_KEY,
  crypto_iv:                 process.env.CRYPTO_IV,
  seventv_user:              process.env.SEVENTV_USER_ID
}
/* ENDPOINTS */
const TWITCH = {
  token:         'https://id.twitch.tv/oauth2/token',
  user:          'https://api.twitch.tv/helix/users',
  follow:        'https://api.twitch.tv/helix/users/follows',
  channel:       'https://api.twitch.tv/helix/channels',
  badges_global: 'https://api.twitch.tv/helix/chat/badges/global',
  badges:        'https://api.twitch.tv/helix/chat/badges',
  emotes_global: 'https://api.twitch.tv/helix/chat/emotes/global',
  emotes:        'https://api.twitch.tv/helix/chat/emotes',
  emotes_set:    'https://api.twitch.tv/helix/chat/emotes/set',
  poll:          'https://api.twitch.tv/helix/polls',
  predictions:   'https://api.twitch.tv/helix/predictions',
  ban:           'https://api.twitch.tv/helix/moderation/bans',
  mods:          'https://api.twitch.tv/helix/moderation/moderators'
}
const SPOTIFY = {
  authorize:      'https://accounts.spotify.com/authorize',
  token:          'https://accounts.spotify.com/api/token',
  playback_state: 'https://api.spotify.com/v1/me/player',
  previous:       'https://api.spotify.com/v1/me/player/previous',
  next:           'https://api.spotify.com/v1/me/player/next',
  pause:          'https://api.spotify.com/v1/me/player/pause',
  play:           'https://api.spotify.com/v1/me/player/play',
  shuffle:        'https://api.spotify.com/v1/me/player/shuffle',
  repeat:         'https://api.spotify.com/v1/me/player/repeat',
  volume:         'https://api.spotify.com/v1/me/player/volume',
  recently:       'https://api.spotify.com/v1/me/player/recently-played',
  track:          'https://api.spotify.com/v1/tracks'
}
const SMILE = {
  bttv_global:     'https://api.betterttv.net/3/cached/emotes/global',
  bttv_channel:    'https://api.betterttv.net/3/cached/users/twitch',
  ffz_channel:     'https://api.betterttv.net/3/cached/frankerfacez/users/twitch',
  // seventv_global:  'https://api.7tv.app/v2/emotes/global',
  // seventv_channel: 'https://api.7tv.app/v2/users'
  seventv_user:  'https://7tv.io/v3/users/twitch',
  seventv_set:  'https://7tv.io/v3/emote-sets',
}
/* MESSAGE VARIABLE */
const MESSAGE = {
  prefix: '#',
  limit: 10
}
/* BOT CONNECTION */
const BOT_CONFIG = {
  options: { debug: true },
  connection: {
    cluster: 'aws',
    reconnect: true,
    secure: true,
    timeout: 180000,
    reconnectDecay: 1.4,
    reconnectInterval: 1000
  },
  channels: [
    // NOTE(D): add here channels to connect
    process.env.BOT_NAME
   ],
  identity: {
    username: process.env.BOT_NAME,
    password: process.env.BOT_PASSWORD,
  }
}
/* EMOTES CONFIG */
const EMOTES = {
  format: 'static',   // [static, animated]
  scale:  '1.0',      // [1.0, 2.0, 3.0]
  theme:  'dark'      // [light, dark]
};
/* ALL SOUND COMMANDS */
const SOUND_COMMAND = {
  // NOTE(D): FILE_NAME: SOUND_FILE.WAV
};
/* ARRAYS */
// NOTE(D): ban-words
const BAN_LIST = [
  { name: 'qwe', reason: 'qwe' },
  { name: 'asd', reason: 'asd' },
  { name: 'zxc', reason: 'zxc' }
];
// NOTE(D): chat phrase after ban
const CHAT_BAN_PHRASE = [
  { id: 1, text: 'Is permanently banned from this channel' },
  { id: 2, text: 'disintegrated' },
  /*
  { id: 3, text: 'var 3' },
  ...
  add more vars
  */
];
// NOTE(D): announce messages
const ANNOUNCE_LIST = [
  { text: 'qwe!' },
  { text: 'asd!' },
  { text: 'zxc!' }
];
// NOTE(D): site whitelist
const SITE_WHITELIST = [
  { id: 1, name: 'YouTube', link: 'www.youtube.com' },
  { id: 2, name: 'YouTube', link: 'youtu.be' },
  { id: 3, name: 'Imgur', link: 'imgur.com' },
  { id: 4, name: 'GitHub', link: 'github.com' },
  { id: 5, name: 'Spotify', link: 'open.spotify.com' },
  { id: 6, name: 'Spotify', link: 'api.spotify.com' }
];
// NOTE(D): RegExp
const REGEXP = {
  command: (/^!([a-zA-Z0-9]+)(?:\W+)?(.*)?/),
  // message: (/(\<\/?\w+\ ?>)/g, '\*'),
  message: (/[.*+?^${}()|[\]\\]/g, '\\$&')
};

export {
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
}
