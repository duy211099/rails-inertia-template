# frozen_string_literal: true

class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  def google_oauth2
    auth = request.env["omniauth.auth"]
    @user = User.from_omniauth(
      provider: auth.provider,
      uid: auth.uid,
      email: auth.info.email,
      name: auth.info.name,
      avatar_url: auth.info.image
    )

    if @user.persisted?
      if client_origin?
        # Deliberately doesn't touch the web session cookie — the client
        # app authenticates itself over the JSON API (JWT), which is a
        # wholly separate login from any cookie session in this browser.
        redirect_to client_redirect_url(@user)
      else
        flash[:notice] = I18n.t("devise.omniauth_callbacks.success", kind: "Google")
        sign_in_and_redirect @user, event: :authentication
      end
    elsif client_origin?
      redirect_to "/##{{ error: @user.errors.full_messages.join(', ') }.to_query}"
    else
      session["devise.google_data"] = request.env["omniauth.auth"].except(:extra)
      redirect_to new_user_registration_url, alert: @user.errors.full_messages.join("\n")
    end
  end

  def failure
    if client_origin?
      redirect_to "/##{{ error: 'Authentication failed, please try again.' }.to_query}"
    else
      redirect_to root_path, alert: "Authentication failed, please try again."
    end
  end

  private

  # The client app authenticates over the JSON API rather than Devise's
  # cookie session, so it flags its Google login link with ?origin=client
  # (read here via OmniAuth's built-in origin-param passthrough) to get a
  # one-time code back instead of a cookie session.
  def client_origin?
    request.env["omniauth.origin"] == "client"
  end

  # Puts a random, single-use, 60-second code in the URL instead of the JWT
  # itself — the client immediately exchanges it for the real token via POST
  # (see Api::V1::SessionsController#exchange). A leaked code is nearly
  # worthless (single-use, dead in a minute); a leaked raw token in the
  # address bar/history would grant 30 days of API access.
  def client_redirect_url(user)
    code = SecureRandom.urlsafe_base64(24)
    Rails.cache.write(Api::V1::SessionsController.login_code_cache_key(code), user.id,
      expires_in: Api::V1::SessionsController::LOGIN_CODE_TTL)
    "/##{{ code: code }.to_query}"
  end
end
