# frozen_string_literal: true

Rails.application.routes.draw do
  draw :letter_opener

  draw :public

  # Demo inertia
  draw :demo

  # Authentication
  draw :devise

  # Demo CRUD
  draw :items

  draw :api
  draw :api_docs

  draw :versions
  draw :jobs
end
