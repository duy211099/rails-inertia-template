# frozen_string_literal: true

namespace :api, defaults: { format: :json } do
  namespace :v1 do
    resource :session, only: %i[show create destroy], controller: "sessions" do
      post :exchange, on: :collection
    end
    resources :items, only: %i[index show create update destroy]
  end
end
