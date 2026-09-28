# frozen_string_literal: true

require "rails_helper"
require "open3"

# This exercises a real subprocess boot, not a single class — no good
# described_class fits an integration spec like this.
# rubocop:disable RSpec/DescribeClass
RSpec.describe "Resend SMTP boot configuration" do
  # Eager loading (production-like) applies ActionMailer's on_load config
  # hooks before config/initializers/*.rb finish running. An initializer
  # that only writes to Rails.application.config.action_mailer.* after
  # boot is silently ignored under eager_load — this reproduces that
  # environment via a real subprocess boot rather than mocking it.
  it "applies Resend SMTP settings to ActionMailer::Base even when eager loaded" do
    env = {
      "SECRET_KEY_BASE" => "x",
      "RAILS_ENV" => "production",
      "RESEND_API_KEY" => "re_test123",
      "RESEND_DOMAIN" => "mail.example.com",
      "R2_ACCESS_KEY_ID" => "x",
      "R2_SECRET_ACCESS_KEY" => "x",
      "R2_ENDPOINT" => "https://example.com",
      "R2_BUCKET" => "test"
    }

    stdout, stderr, status = Open3.capture3(
      env,
      "bin/rails", "runner",
      "puts [ActionMailer::Base.delivery_method, ActionMailer::Base.smtp_settings[:address]].join(',')"
    )

    expect(status).to be_success, "boot failed: #{stderr}"
    expect(stdout).to include("smtp,smtp.resend.com")
  end
end
# rubocop:enable RSpec/DescribeClass
