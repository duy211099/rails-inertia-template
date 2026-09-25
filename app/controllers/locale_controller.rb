# frozen_string_literal: true

class LocaleController < ApplicationController
  def update
    locale = params[:locale]
    return head :bad_request unless locale.is_a?(String) && locale.present?
    return head :unprocessable_content unless I18n.available_locales.map(&:to_s).include?(locale)

    cookies[:locale] = { value: locale, expires: 1.year }
    head :no_content
  end
end
