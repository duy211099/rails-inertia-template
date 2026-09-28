# frozen_string_literal: true

# Loaded directly (not autoloaded) because config/initializers/*.rb run
# before Zeitwerk's main autoloader is set up in this Rails version.
require_relative "../../app/lib/observability/sentry_config"

dsn = ENV["SENTRY_DSN"]

# Sentry.init must run at the top level of this initializer, not deferred
# (e.g. inside config.after_initialize). sentry-rails registers its own
# config.after_initialize hook when the gem loads, before this file runs;
# that hook wires up Rails.error, backtrace cleaning, tracing, etc., but
# only if Sentry.initialized? is already true when it fires. A Sentry.init
# call deferred to a later-registered after_initialize block runs after
# sentry-rails' hook has already skipped that setup.
if Observability::SentryConfig.enabled?(dsn)
  Sentry.init do |config|
    config.dsn = dsn
    config.breadcrumbs_logger = [ :active_support_logger ]
    config.traces_sample_rate = 0.1
    config.rails.register_error_subscriber = true
  end
end
