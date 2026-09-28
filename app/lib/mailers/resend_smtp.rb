# frozen_string_literal: true

module Mailers
  module ResendSmtp
    def self.settings_for(api_key:, domain: "resend.dev")
      {
        address: "smtp.resend.com",
        port: 587,
        domain: domain,
        user_name: "resend",
        password: api_key,
        authentication: :plain,
        enable_starttls_auto: true
      }
    end
  end
end
