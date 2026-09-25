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
    return nil unless candidate.is_a?(String) && candidate.valid_encoding? && candidate.present?

    candidate.to_sym if I18n.available_locales.map(&:to_s).include?(candidate)
  end

  def locale_from_header
    http_accept_language.compatible_language_from(I18n.available_locales)
  end
end
