# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Sessions API", type: :request do
  include ActiveSupport::Testing::TimeHelpers

  fixtures :users

  describe "POST /api/v1/session" do
    it "returns a bearer token and the user for valid credentials" do
      post "/api/v1/session", params: { email: users(:one).email, password: "password123" }, as: :json

      expect(response).to have_http_status(:ok)
      expect(response.headers["Authorization"]).to match(/\ABearer .+\z/)
      expect(response.parsed_body.dig("user", "email")).to eq(users(:one).email)
    end

    it "does not start a cookie session — the API login is independent of the web session" do
      post "/api/v1/session", params: { email: users(:one).email, password: "password123" }, as: :json

      expect(response.headers["Set-Cookie"].to_s).not_to include("_rails_inertia_template_session")
    end

    it "rejects an invalid password" do
      post "/api/v1/session", params: { email: users(:one).email, password: "wrong" }, as: :json

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body.dig("error", "code")).to eq("invalid_credentials")
    end

    it "rejects an unknown email" do
      post "/api/v1/session", params: { email: "nobody@example.com", password: "password123" }, as: :json

      expect(response).to have_http_status(:unauthorized)
    end

    it "requires no CSRF token, unlike the cookie-based API flow" do
      post "/api/v1/session", params: { email: users(:one).email, password: "password123" },
        headers: { "X-CSRF-Token" => "" }, as: :json

      expect(response).to have_http_status(:ok)
    end
  end

  describe "GET /api/v1/session" do
    it "returns the current user for a valid token" do
      post "/api/v1/session", params: { email: users(:one).email, password: "password123" }, as: :json
      token = response.headers["Authorization"]

      get "/api/v1/session", headers: { "Authorization" => token }, as: :json

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig("user", "id")).to eq(users(:one).id)
    end

    it "rejects a request with no token" do
      get "/api/v1/session", as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "DELETE /api/v1/session" do
    it "revokes the token so it can no longer authenticate" do
      post "/api/v1/session", params: { email: users(:one).email, password: "password123" }, as: :json
      token = response.headers["Authorization"]

      delete "/api/v1/session", headers: { "Authorization" => token }, as: :json
      expect(response).to have_http_status(:no_content)

      get "/api/v1/items", headers: { "Authorization" => token }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "POST /api/v1/session/exchange" do
    # Test env runs Rails.cache as :null_store (writes are no-ops), but the
    # exchange flow is fundamentally built on the cache actually holding the
    # code between requests, so swap in a real store just for this block.
    around do |example|
      original_cache = Rails.cache
      Rails.cache = ActiveSupport::Cache::MemoryStore.new
      example.run
    ensure
      Rails.cache = original_cache
    end

    def issue_code(user)
      code = SecureRandom.urlsafe_base64(24)
      Rails.cache.write(Api::V1::SessionsController.login_code_cache_key(code), user.id,
        expires_in: Api::V1::SessionsController::LOGIN_CODE_TTL)
      code
    end

    it "redeems a valid one-time code for a bearer token" do
      code = issue_code(users(:one))

      post "/api/v1/session/exchange", params: { code: code }, as: :json

      expect(response).to have_http_status(:ok)
      expect(response.headers["Authorization"]).to match(/\ABearer .+\z/)
      expect(response.parsed_body.dig("user", "id")).to eq(users(:one).id)
    end

    it "is single-use — a replayed code fails with a distinct, non-misleading error" do
      code = issue_code(users(:one))
      post "/api/v1/session/exchange", params: { code: code }, as: :json

      post "/api/v1/session/exchange", params: { code: code }, as: :json
      expect(response).to have_http_status(:unauthorized)
      # Regression: this must never be "invalid_credentials" (the password-
      # login error) — a replayed code has nothing to do with a wrong
      # password, and reusing that message confused a real login here.
      expect(response.parsed_body.dig("error", "code")).to eq("invalid_or_expired_code")
    end

    it "rejects an unknown code" do
      post "/api/v1/session/exchange", params: { code: "does-not-exist" }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end

    it "rejects an expired code" do
      code = issue_code(users(:one))
      travel(Api::V1::SessionsController::LOGIN_CODE_TTL + 1.second) do
        post "/api/v1/session/exchange", params: { code: code }, as: :json
      end
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
