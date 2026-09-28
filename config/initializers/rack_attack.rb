# frozen_string_literal: true

class Rack::Attack
  # Rack::Attack::Railtie auto-inserts this middleware; no manual
  # config.middleware.use call needed.

  # A single process cache is fine for this template's single-Puma-process
  # Kamal deploy; swap for a shared store (e.g. solid_cache) if you scale
  # to multiple app instances behind a load balancer.
  self.cache.store = ActiveSupport::Cache::MemoryStore.new

  throttle("logins/ip", limit: 10, period: 20.seconds) do |req|
    req.ip if req.path == "/users/sign_in" && req.post?
  end

  throttle("logins/email", limit: 10, period: 20.seconds) do |req|
    if req.path == "/users/sign_in" && req.post?
      req.params.dig("user", "email")&.downcase&.presence
    end
  end

  # The web login form is Google-only (see app/frontend/pages/auth/login.tsx)
  # — POST /users/sign_in has no UI path to it. The JSON API login
  # (POST /api/v1/session) is the only password-login surface real clients
  # use, so it needs the same IP throttle or the web-form throttles above
  # protect nothing in practice.
  throttle("api_logins/ip", limit: 10, period: 20.seconds) do |req|
    req.ip if req.path == "/api/v1/session" && req.post?
  end

  self.throttled_responder = lambda do |_request|
    [ 429, { "Content-Type" => "application/json" }, [ { error: "Too many attempts. Try again shortly." }.to_json ] ]
  end
end
