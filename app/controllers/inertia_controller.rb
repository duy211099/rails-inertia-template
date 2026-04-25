# frozen_string_literal: true

class InertiaController < ApplicationController
  inertia_share flash: -> {
    {
      notice: flash[:notice],
      alert: flash[:alert]
    }
  }

  inertia_share user: -> {
    return nil unless current_user

    UserSerializer.one(current_user)
  }
end
