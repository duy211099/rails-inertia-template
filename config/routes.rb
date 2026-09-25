# frozen_string_literal: true

Rails.application.routes.draw do
  mount LetterOpenerWeb::Engine, at: "/letter_opener" if Rails.env.development?

  draw :public

  # Demo inertia
  draw :demo

  # Authentication
  draw :devise

  # Demo CRUD
  draw :items

  # Audit log
  resources :versions, only: %i[index]

  # Solid Queue web UI (admin only)
  mount MissionControl::Jobs::Engine, at: "/jobs"
end
