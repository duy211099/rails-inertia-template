# frozen_string_literal: true

# Loaded directly (not autoloaded) because config/initializers/*.rb run
# before Zeitwerk's main autoloader is set up in this Rails version.
require_relative "../../app/lib/mailers/resend_smtp"

# Applied via on_load(:action_mailer), not Rails.application.config.
# ActionMailer::Base copies config.action_mailer.* onto itself when it is
# loaded (eagerly in production, lazily otherwise) via its own on_load
# hook. A later write to Rails.application.config.action_mailer.* — e.g.
# from config.after_initialize — never reaches ActionMailer::Base once
# that copy has already happened, which is silent and only shows up
# under eager loading (production).
ActiveSupport.on_load(:action_mailer) do
  api_key = ENV["RESEND_API_KEY"]
  next unless api_key.present?

  self.delivery_method = :smtp
  self.smtp_settings = Mailers::ResendSmtp.settings_for(
    api_key: api_key,
    domain: ENV.fetch("RESEND_DOMAIN", "resend.dev")
  )
end
