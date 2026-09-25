# frozen_string_literal: true

module Api
  module V1
    class BaseController < ActionController::Base
      include ActionPolicy::Controller
      include Pagy::Method

      protect_from_forgery with: :exception
      prepend_before_action :require_api_user!
      before_action :set_paper_trail_whodunnit
      authorize :user, through: :current_user

      rescue_from ActiveRecord::RecordNotFound do
        render_error :not_found, "Record not found.", :not_found
      end
      rescue_from ActionPolicy::Unauthorized do
        render_error :forbidden, "Access denied.", :forbidden
      end
      rescue_from ActionController::ParameterMissing, ActionDispatch::Http::Parameters::ParseError do
        render_error :bad_request, "Invalid request parameters.", :bad_request
      end
      rescue_from ActionController::InvalidAuthenticityToken do
        render_error :invalid_csrf_token, "A valid CSRF token is required.", :unprocessable_content
      end

      private

      def require_api_user!
        render_error(:unauthorized, "Sign in to continue.", :unauthorized) unless current_user
      end

      def render_error(code, message, status, details: {})
        render json: { error: { code: code, message: message, details: details } }, status: status
      end
    end
  end
end
