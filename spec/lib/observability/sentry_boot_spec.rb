# frozen_string_literal: true

require "rails_helper"
require "open3"

# This exercises a real subprocess boot, not a single class — no good
# described_class fits an integration spec like this.
# rubocop:disable RSpec/DescribeClass
RSpec.describe "Sentry boot configuration" do
  # sentry-rails registers its own config.after_initialize hook (which
  # wires Rails.error, backtrace cleaning, tracing, etc.) when the gem
  # loads — before the app's own initializers run. That hook starts with
  # `next unless Sentry.initialized?`. If Sentry.init itself runs inside
  # an after_initialize block registered later (by config/initializers),
  # sentry-rails' hook fires first, finds Sentry not yet initialized, and
  # skips all Rails integration. Only calling Sentry.init at the top
  # level of the initializer (not deferred) avoids this ordering bug.
  it "initializes Sentry early enough for sentry-rails' own Rails integration to register" do
    env = {
      "SECRET_KEY_BASE" => "x",
      "RAILS_ENV" => "production",
      "SENTRY_DSN" => "https://abc@o0.ingest.sentry.io/1",
      "R2_ACCESS_KEY_ID" => "x",
      "R2_SECRET_ACCESS_KEY" => "x",
      "R2_ENDPOINT" => "https://example.com",
      "R2_BUCKET" => "test"
    }

    stdout, stderr, status = Open3.capture3(
      env,
      "bin/rails", "runner",
      "puts !Sentry.configuration.backtrace_cleanup_callback.nil?"
    )

    expect(status).to be_success, "boot failed: #{stderr}"
    expect(stdout).to include("true")
  end
end
# rubocop:enable RSpec/DescribeClass
