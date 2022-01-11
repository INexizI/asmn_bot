const queryString = require('query-string')
const Buffer = require('buffer/').Buffer

const client_id = 'c79d615a151e4d6fbb37a0f3468ff3c9';
const client_secret = '4e4a37e225654065bff02e3954a8b2fd';
const refresh_token = 'AQCuORMiFq2ETN1CQX9UR5B5IrezZq5hTo1Rz0csk84ciKvJgTn-RKxXKUkZzhGt2as3XoqtGqnod4QxlNw4NSLrWiKM0EAoKKYLIloaxbOinRxIP7WYcyC59hLapOClI8s';

const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`;
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

// const getAccessToken = async () => {
//   const response = await fetch(TOKEN_ENDPOINT, {
//     method: 'POST',
//     headers: {
//       Authorization: `Basic ${basic}`,
//       'Content-Type': 'application/x-www-form-urlencoded',
//     },
//     body: querystring.stringify({
//       grant_type: 'refresh_token',
//       refresh_token,
//     }),
//   });
//
//   return response.json();
// };

const xhr = new XMLHttpRequest();
xhr.onload = () => {
  xhr.open('POST', TOKEN_ENDPOINT);
  xhr.setRequestHeader('Authorization', `Basic ${basic}`);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      console.log(xhr.status);
      console.log(xhr.responseText);
    }
  };
  var data = querystring.stringify({
    grant_type: 'refresh_token',
    refresh_token,
  })
  console.log(data);
  // xhr.send(data);
};


export const getNowPlaying = async () => {
  const { access_token } = await getAccessToken();

  return $.get(NOW_PLAYING_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
};

export default async (_, res) => {
  const response = await getNowPlaying();

  if (response.status === 204 || response.status > 400) {
    return res.status(200).json({ isPlaying: false });
  }

  const song = await response.json();
  const isPlaying = song.is_playing;
  const title = song.item.name;
  const artist = song.item.artists.map((_artist) => _artist.name).join(', ');
  const album = song.item.album.name;
  const albumImageUrl = song.item.album.images[0].url;
  const songUrl = song.item.external_urls.spotify;

  return res.status(200).json({
    album,
    albumImageUrl,
    artist,
    isPlaying,
    songUrl,
    title,
  });
};

console.log('123 QWE');
