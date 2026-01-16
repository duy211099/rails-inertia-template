# frozen_string_literal: true

class InertiaController < ApplicationController
  # Share data with all Inertia responses
  # see https://inertia-rails.dev/guide/shared-data
  inertia_share flash: -> {
    {
      notice: flash[:notice],
      alert: flash[:alert]
    }
  }

  inertia_share user: -> {
    return nil unless current_user

    current_user.as_json(only: [ :id, :name, :email ], methods: [ :avatar_url ])
  }
end
