# frozen_string_literal: true

class Rack::Attack
  # Rack::Attack::Railtie auto-inserts this middleware; no manual
  # config.middleware.use call needed.

  # A plain MemoryStore is per-process, so in production (multiple Puma
  # workers) each worker would count throttle hits independently and the
  # effective limit would multiply by worker count. Rails.cache is backed
  # by solid_cache there and shared across all of them. Non-production
  # environments keep a private MemoryStore — test's Rails.cache is a
  # NullStore (see config/environments/test.rb) which never actually
  # counts anything, and would silently disable throttling entirely.
  self.cache.store = Rails.env.production? ? Rails.cache : ActiveSupport::Cache::MemoryStore.new

  throttle("logins/ip", limit: 10, period: 20.seconds) do |req|
    req.ip if req.path == "/users/sign_in" && req.post?
  end

  throttle("logins/email", limit: 10, period: 20.seconds) do |req|
    if req.path == "/users/sign_in" && req.post?
      login_email(req)&.downcase&.presence
    end
  end

  # The web login form is Google-only (see app/frontend/pages/auth/login.tsx)
  # — POST /users/sign_in has no UI path to it. The JSON API login
  # (POST /api/v1/session) is the only password-login surface real clients
  # use, so it needs the same IP/email throttles or the web-form throttles
  # above protect nothing in practice.
  throttle("api_logins/ip", limit: 10, period: 20.seconds) do |req|
    req.ip if req.path == "/api/v1/session" && req.post?
  end

  throttle("api_logins/email", limit: 10, period: 20.seconds) do |req|
    if req.path == "/api/v1/session" && req.post?
      login_email(req)&.downcase&.presence
    end
  end

  # req.params only parses query strings and form-encoded bodies — a JSON
  # POST body (how /api/v1/session is actually called, and how any
  # fetch()-based client could call /users/sign_in too) is invisible to it,
  # so the email-keyed throttles above would silently only ever see nil for
  # JSON requests. Falls back to a manual JSON parse, rewinding the body so
  # the Rails app downstream can still read it.
  def self.login_email(req)
    return req.params.dig("user", "email") if req.params.dig("user", "email").present?
    return req.params["email"] if req.params["email"].present?

    return nil if req.body.nil?

    body = req.body.read
    req.body.rewind
    json = JSON.parse(body)
    json["email"] || json.dig("user", "email")
  rescue JSON::ParserError
    nil
  end

  self.throttled_responder = lambda do |request|
    # Inertia's client treats any non-Inertia, non-redirect response as
    # invalid and shows a broken "invalid response" state rather than
    # rendering it — a raw 429 JSON body included. Inertia's own documented
    # escape hatch for this is a 409 with X-Inertia-Location, which it
    # handles as an instruction to do a full browser reload of that URL.
    if request.get_header("HTTP_X_INERTIA")
      [ 409, { "X-Inertia-Location" => request.path }, [] ]
    else
      [ 429, { "Content-Type" => "application/json" }, [ { error: "Too many attempts. Try again shortly." }.to_json ] ]
    end
  end
end
