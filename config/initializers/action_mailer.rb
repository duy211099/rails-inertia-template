# frozen_string_literal: true

Rails.application.config.after_initialize do
  if (api_key = ENV["RESEND_API_KEY"]).present?
    Rails.application.config.action_mailer.delivery_method = :smtp
    Rails.application.config.action_mailer.smtp_settings =
      Mailers::ResendSmtp.settings_for(api_key: api_key, domain: ENV.fetch("RESEND_DOMAIN", "resend.dev"))
  end
end
