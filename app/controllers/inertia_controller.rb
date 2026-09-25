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

    UserSerializer.new(current_user).serializable_hash
  }

  inertia_share locale: -> { I18n.locale.to_s }

  inertia_share availableLocales: -> { I18n.available_locales.map(&:to_s) }
end
