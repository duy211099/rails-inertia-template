# frozen_string_literal: true

module SetsLocale
  extend ActiveSupport::Concern

  included do
    around_action :switch_locale
  end

  private

  def switch_locale(&action)
    I18n.with_locale(resolve_locale, &action)
  end

  def resolve_locale
    locale_from_cookie || locale_from_header || I18n.default_locale
  end

  def locale_from_cookie
    candidate = cookies[:locale]
    candidate&.to_sym if candidate.present? && I18n.available_locales.include?(candidate.to_sym)
  end

  def locale_from_header
    http_accept_language.compatible_language_from(I18n.available_locales)
  end
end
