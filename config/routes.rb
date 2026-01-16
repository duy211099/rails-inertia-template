# frozen_string_literal: true

Rails.application.routes.draw do
  draw :public

  # Demo inertia
  draw :demo

  # Authentication
  draw :devise

  # Demo CRUD
  draw :items
end
