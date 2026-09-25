# frozen_string_literal: true

class LocaleController < ApplicationController
  def update
    locale = params[:locale].presence
    return head :bad_request if locale.blank?
    return head :unprocessable_content unless I18n.available_locales.include?(locale.to_sym)

    cookies[:locale] = { value: locale, expires: 1.year }
    head :no_content
  end
end
