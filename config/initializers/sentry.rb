# frozen_string_literal: true

Rails.application.config.after_initialize do
  dsn = ENV["SENTRY_DSN"]

  if Observability::SentryConfig.enabled?(dsn)
    Sentry.init do |config|
      config.dsn = dsn
      config.breadcrumbs_logger = [ :active_support_logger ]
      config.traces_sample_rate = 0.1
    end
  end
end
