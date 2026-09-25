# frozen_string_literal: true

module Api
  module V1
    class BaseController < ActionController::Base
      include ActionPolicy::Controller
      include Pagy::Method
      include SetsLocale

      protect_from_forgery with: :exception
      prepend_before_action :require_api_user!
      before_action :set_paper_trail_whodunnit
      authorize :user, through: :current_user

      rescue_from ActiveRecord::RecordNotFound do
        render_error :not_found, I18n.t("api.errors.not_found"), :not_found
      end
      rescue_from ActionPolicy::Unauthorized do
        render_error :forbidden, I18n.t("api.errors.forbidden"), :forbidden
      end
      rescue_from ActionController::ParameterMissing, ActionDispatch::Http::Parameters::ParseError do
        render_error :bad_request, I18n.t("api.errors.bad_request"), :bad_request
      end
      rescue_from ActionController::InvalidAuthenticityToken do
        render_error :invalid_csrf_token, I18n.t("api.errors.invalid_csrf_token"), :unprocessable_content
      end

      private

      def require_api_user!
        render_error(:unauthorized, I18n.t("api.errors.unauthorized"), :unauthorized) unless current_user
      end

      def render_error(code, message, status, details: {})
        render json: { error: { code: code, message: message, details: details } }, status: status
      end
    end
  end
end
