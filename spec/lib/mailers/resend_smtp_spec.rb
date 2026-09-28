# frozen_string_literal: true

require "rails_helper"

RSpec.describe Mailers::ResendSmtp do
  describe ".settings_for" do
    it "builds SMTP settings pointed at Resend with the given API key and domain" do
      settings = described_class.settings_for(api_key: "re_123", domain: "mail.example.com")

      expect(settings).to include(
        address: "smtp.resend.com",
        port: 587,
        domain: "mail.example.com",
        user_name: "resend",
        password: "re_123",
        authentication: :plain,
        enable_starttls_auto: true
      )
    end

    it "defaults the domain when none is given" do
      settings = described_class.settings_for(api_key: "re_123")
      expect(settings[:domain]).to eq("resend.dev")
    end
  end
end
