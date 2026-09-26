# frozen_string_literal: true

Rails.application.routes.draw do
  draw :letter_opener

  draw :public

  draw :home

  # Authentication
  draw :devise

  draw :items

  draw :api
  draw :api_docs

  draw :admin

  draw :versions
  draw :jobs

  draw :locale
end
