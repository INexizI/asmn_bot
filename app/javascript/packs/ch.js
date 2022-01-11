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
          refresh_token,
        }),
      });

      const x = await response.json();
      return x
    }

    // const getAccessToken = async () => {
    //   // request options
    //   const options = {
    //     method: 'POST',
    //     body: queryString.stringify({
    //       grant_type: 'refresh_token',
    //       refresh_token,
    //     }),
    //     headers: {
    //       Authorization: `Basic ${basic}`,
    //       'Content-Type': 'application/x-www-form-urlencoded',
    //     }
    //   }
    //   // send post request
    //   const response = await fetch(TOKEN_ENDPOINT, options)
    //     .then(res => res.json())
    //     .then(data => {
    //       var at = data.access_token
    //       return at
    //     })
    //     .catch(err => console.error(err));
    //
    //   return response
    // }

    // export const getNowPlaying = async () => {
    //   const { access_token } = await getAccessToken();
    //
    //   return fetch(NOW_PLAYING_ENDPOINT, {
    //     headers: {
    //       Authorization: `Bearer ${access_token}`,
    //     },
    //   });
    // };
    const getNowPlaying = async () => {
      const { access_token } = await getAccessToken();

      return fetch(NOW_PLAYING_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        }
      })
    }

    const spotifyData = async (_, res) => {
      const response = await getNowPlaying();
      console.log(response.status);

      if (response.status === 204 || response.status > 400) {
        // return res.status(200).json({ isPlaying: false });
        console.log(response.status);
      }

      const song = await response.json();
      console.log(song);
      const isPlaying = song.is_playing;
      const title = song.item.name;
      const artist = song.item.artists.map((_artist) => _artist.name).join(', ');
      const album = song.item.album.name;
      const albumImageUrl = song.item.album.images[0].url;
      const songUrl = song.item.external_urls.spotify;

      console.log('123');

      // return res.status(200).json({
      //   album,
      //   albumImageUrl,
      //   artist,
      //   isPlaying,
      //   songUrl,
      //   title
      // })
    }
    spotifyData();

    console.log('123 QWE');
  });
}).call(this);
