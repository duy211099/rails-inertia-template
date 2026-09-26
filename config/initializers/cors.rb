# frozen_string_literal: true

# Only the JSON API is cross-origin-able. The Inertia app itself is
# same-origin (server-rendered navigation) and never goes through here.
origins = ENV.fetch("API_CORS_ORIGINS", "").split(",").map(&:strip).reject(&:empty?)

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins origins.presence || []

    resource "/api/*",
      headers: :any,
      methods: %i[get post put patch delete options head],
      expose: %w[Authorization],
      credentials: false
  end
end
