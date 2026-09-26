# frozen_string_literal: true

module Api
  module V1
    class BaseController < ActionController::Base
      include ActionPolicy::Controller
      include Pagy::Method
      include SetsLocale

      # CSRF only matters for cookie-based (browser session) requests: a
      # Bearer token isn't attached automatically by the browser, so a
      # request authenticating that way can't be forged cross-site.
      protect_from_forgery with: :exception, unless: -> { request.headers["Authorization"].present? }
      prepend_before_action :require_api_user!
      before_action :set_paper_trail_whodunnit
      authorize :user, through: :current_user

      rescue_from ActiveRecord::RecordNotFound do
        render_error :not_found, "api.v1.errors.not_found", :not_found
      end
      rescue_from ActionPolicy::Unauthorized do
        render_error :forbidden, "api.v1.errors.forbidden", :forbidden
      end
      rescue_from ActionController::ParameterMissing, ActionDispatch::Http::Parameters::ParseError do
        render_error :bad_request, "api.v1.errors.bad_request", :bad_request
      end
      rescue_from ActionController::InvalidAuthenticityToken do
        render_error :invalid_csrf_token, "api.v1.errors.invalid_csrf_token", :unprocessable_content
      end

      private

      def require_api_user!
        render_error(:unauthorized, "api.v1.errors.unauthorized", :unauthorized) unless current_user
      end

      # I18n.locale is not reliable here: SetsLocale's around_action wraps
      # process_action from the outside, but ActionController::Rescue's
      # rescue clause (which invokes rescue_from handlers) and a
      # prepend_before_action halt both run outside/before that wrapper's
      # active locale, so ambient I18n.t would silently fall back to the
      # default locale. Resolve explicitly instead of relying on ambient state.
      def render_error(code, i18n_key, status, details: {})
        message = I18n.t(i18n_key, locale: resolve_locale)
        render json: { error: { code: code, message: message, details: details } }, status: status
      end
    end
  end
end
