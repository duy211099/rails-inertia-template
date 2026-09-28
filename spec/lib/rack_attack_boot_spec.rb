# frozen_string_literal: true

require "rails_helper"
require "open3"

# This exercises a real subprocess boot, not a single class — no good
# described_class fits an integration spec like this.
# rubocop:disable RSpec/DescribeClass
RSpec.describe "Rack::Attack boot configuration" do
  # A plain in-process MemoryStore, one per Puma worker, silently
  # multiplies the configured throttle limit by WEB_CONCURRENCY in
  # production (each worker counts independently). Rails.cache is backed
  # by solid_cache there, which all workers (and processes) share.
  it "uses the shared Rails.cache in production instead of a per-process store" do
    env = {
      "SECRET_KEY_BASE" => "x",
      "RAILS_ENV" => "production",
      "R2_ACCESS_KEY_ID" => "x",
      "R2_SECRET_ACCESS_KEY" => "x",
      "R2_ENDPOINT" => "https://example.com",
      "R2_BUCKET" => "test"
    }

    stdout, stderr, status = Open3.capture3(
      env,
      "bin/rails", "runner",
      "puts Rack::Attack.cache.store == Rails.cache"
    )

    expect(status).to be_success, "boot failed: #{stderr}"
    expect(stdout).to include("true")
  end
end
# rubocop:enable RSpec/DescribeClass
