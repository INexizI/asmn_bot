(function() {
  $(document).on("turbolinks:load", function() {
    $('#img').click(function() {
      cmd = $('#cmd_text').val();
      soundCommand = new Audio('/sounds/' + cmd + '.mp3');
      console.log(cmd);
      soundCommand.play();
    });

    // const config = {
    //     options: { debug: true },
    //     connection: {
    //         cluster: 'aws',
    //         reconnect: true,
    //         secure: true,
    //         timeout: 180000,
    //         reconnectDecay: 1.4,
    //         reconnectInterval: 1000
    //     },
    //     channels: [ process.env.TWITCH_BOT_USERNAME ],
    //     identity: {
    //         username: process.env.TWITCH_BOT_USERNAME,
    //         // password: process.env.TWITCH_OAUTH_TOKEN /* you and bot in once */
    //         password: process.env.TWITCH_OAUTH_BOT_TOKEN /* separated you and bot */
    //     }
    // }
  });
}).call(this);
