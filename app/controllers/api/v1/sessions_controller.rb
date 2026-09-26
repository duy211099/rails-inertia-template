# frozen_string_literal: true

module Api
  module V1
    # Devise-jwt intercepts create/destroy and appends the Authorization
    # header (create) / revokes the token (destroy) automatically, based on
    # the request matchers configured in config/initializers/devise.rb.
    class SessionsController < BaseController
      LOGIN_CODE_TTL = 60.seconds

      skip_before_action :require_api_user!, only: %i[create exchange]

      # No session cookie exists yet to forge at this point in the flow —
      # the client is exchanging credentials (or a one-time code) for a
      # bearer token, not acting on an established cookie session.
      skip_forgery_protection only: %i[create exchange]

      # Lets a client that already holds a token (e.g. restored from
      # localStorage, or one just handed to it via the Google redirect)
      # fetch the current user without re-authenticating.
      def show
        render json: { user: UserSerializer.new(current_user).serializable_hash }
      end

      def create
        user = User.find_by(email: params[:email])

        if user&.valid_password?(params[:password])
          # store: false — a mobile/API client is a separate login from the
          # browser's web session; this shouldn't also start (or touch) a
          # cookie session. devise-jwt still dispatches the token because it
          # hooks into Warden's set_user callback, which fires regardless.
          sign_in(user, store: false)
          render json: { user: UserSerializer.new(user).serializable_hash }
        else
          render_error :invalid_credentials, "api.v1.errors.invalid_credentials", :unauthorized
        end
      end

      def destroy
        sign_out(current_user)
        head :no_content
      end

      # Redeems the one-time code the Google-login redirect put in the URL
      # (see Users::OmniauthCallbacksController#client_redirect_url).
      # The code itself is single-use and short-lived, so leaking it in the
      # URL bar/history is far cheaper than leaking a 30-day bearer token
      # would be — sign_in here is what makes devise-jwt append the actual
      # Authorization header on the response.
      def exchange
        key = self.class.login_code_cache_key(params[:code])
        user_id = Rails.cache.read(key)
        Rails.cache.delete(key)
        user = user_id && User.find_by(id: user_id)

        if user
          sign_in(user, store: false)
          render json: { user: UserSerializer.new(user).serializable_hash }
        else
          render_error :invalid_or_expired_code, "api.v1.errors.invalid_or_expired_code", :unauthorized
        end
      end

      # Shared with Users::OmniauthCallbacksController, which writes the
      # code/user-id pair this action redeems.
      def self.login_code_cache_key(code)
        "api/v1/session/login_code/#{code}"
      end
    end
  end
end
