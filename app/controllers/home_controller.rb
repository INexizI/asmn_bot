class HomeController < ApplicationController
  def index
  end

  def login
    query_params = {
      client_id: ENV['SCLIENT_ID'],
      response_type: "code",
      redirect_uri: ENV['REDIRECT_LOGIN'],
      scope: "ugc-image-upload user-modify-playback-state user-read-playback-state user-read-currently-playing user-follow-modify user-follow-read user-read-recently-played user-read-playback-position user-top-read playlist-read-collaborative playlist-modify-public playlist-read-private playlist-modify-private app-remote-control streaming user-read-email user-read-private user-library-modify user-library-read",
      show_dialog: true
    }

    url = ENV['AUTHORIZE']
    external_url = "#{url}?#{query_params.to_query}"
    redirect_to  external_url, allow_other_host: true
  end

  def q
    if params[:error]
      puts 'Login failed!', params
      redirect_to "#{ENV['REDIRECT_LOGIN']}/failure"
    else
      body = {
        grant_type: "authorization_code",
        code: params[:code],
        redirect_uri: ENV['REDIRECT_LOGIN'],
        client_id: ENV['SCLIENT_ID'],
        client_secret: ENV['SCLIENT_SECRET']
      }
      auth_response = RestClient.post(ENV['TOKEN'], body)
      auth_params = JSON.parse(auth_response.body)
      header = { Authorization: "Bearer #{auth_params["access_token"]}" }
      user_response = RestClient.get(ENV['USER_PROFILE'], header)
      user_params = JSON.parse(user_response.body)
    end
  end
end
