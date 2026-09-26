# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Omniauth callbacks", type: :request do
  fixtures :users

  around do |example|
    OmniAuth.config.test_mode = true
    # Test env runs Rails.cache as :null_store; the client-origin flow is
    # built on the cache actually holding the one-time code between
    # requests, so swap in a real store for the duration of each example.
    original_cache = Rails.cache
    Rails.cache = ActiveSupport::Cache::MemoryStore.new
    example.run
  ensure
    OmniAuth.config.test_mode = false
    OmniAuth.config.mock_auth[:google_oauth2] = nil
    Rails.cache = original_cache
  end

  def mock_google_auth(email:, uid: "google-uid-1", name: "Google User")
    OmniAuth.config.mock_auth[:google_oauth2] = OmniAuth::AuthHash.new(
      provider: "google_oauth2", uid: uid,
      info: { email: email, name: name, image: "https://example.com/avatar.png" }
    )
  end

  # The request phase (POSTing to /users/auth/google_oauth2, matching the
  # app's own Google button) is what records the ?origin= param into the
  # session, which the callback later reads via env["omniauth.origin"] — so
  # tests go through both steps to exercise that passthrough for real,
  # rather than calling the callback directly.
  def request_then_callback(origin: nil)
    post "/users/auth/google_oauth2", params: (origin ? { origin: origin } : {})
    get "/users/auth/google_oauth2/callback"
  end

  def inertia_get(path)
    get path, headers: { "X-Inertia" => "true", "X-Inertia-Version" => ViteRuby.digest }
  end

  context "without a client origin (normal web login)" do
    it "signs the user in with a cookie session and redirects to root" do
      mock_google_auth(email: "new-google-user@example.com")
      request_then_callback
      expect(response).to redirect_to(root_path)

      inertia_get(root_path)
      expect(response.parsed_body.dig("props", "user", "email")).to eq("new-google-user@example.com")
    end
  end

  context "with the client origin" do
    it "redirects to a one-time code, without signing in the web session" do
      mock_google_auth(email: "new-google-user@example.com")
      request_then_callback(origin: "client")
      expect(response.location).to match(%r{\A.*/#code=[\w-]+\z})

      # Same cookie jar as the omniauth request above (the request phase
      # itself touches the session for omniauth.origin/omniauth.params, so a
      # session cookie exists regardless — what matters is that it carries
      # no signed-in Devise user).
      get items_path
      expect(response).to redirect_to(new_user_session_path)
    end

    it "the code redeems for a working bearer token" do
      mock_google_auth(email: "new-google-user@example.com")
      request_then_callback(origin: "client")
      code = response.location[/#code=([\w-]+)/, 1]

      post "/api/v1/session/exchange", params: { code: code }, as: :json
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig("user", "email")).to eq("new-google-user@example.com")
    end

    it "redirects with an error fragment when the account can't be created" do
      # Same email as an existing password-auth user, fresh OAuth identity —
      # User#from_omniauth refuses to silently link the two (see user_spec.rb).
      mock_google_auth(email: users(:two).email, uid: "unclaimed-uid")
      request_then_callback(origin: "client")
      expect(response.location).to match(%r{\A.*/#error=})
    end
  end

  context "when authentication fails" do
    before { OmniAuth.config.mock_auth[:google_oauth2] = :invalid_credentials }

    it "redirects to root for the normal web flow" do
      get "/users/auth/google_oauth2/callback"
      expect(response).to redirect_to(root_path)
    end

    it "redirects with an error fragment for the client origin" do
      post "/users/auth/google_oauth2", params: { origin: "client" }
      get "/users/auth/google_oauth2/callback"
      expect(response.location).to match(%r{\A.*/#error=})
    end
  end
end
