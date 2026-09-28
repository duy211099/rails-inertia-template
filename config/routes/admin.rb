# frozen_string_literal: true

namespace :admin do
  root to: "dashboard#index"
  resources :users, only: %i[index show]
end
