Rails.application.routes.draw do
  root to: 'home#index'

  get 'login', to: 'home#login', as: :login
end
