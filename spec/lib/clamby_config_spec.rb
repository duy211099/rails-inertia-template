# frozen_string_literal: true

require "rails_helper"

RSpec.describe Clamby do
  # Clamby's default config (daemonize: false, error_clamscan_client_error:
  # false) treats ANY scanner client error — a missing signature DB, clamd
  # down, exit status 2 — the same as a detected virus ("return true to
  # maintain legacy behavior"), which would purge legitimate uploads
  # whenever the scanner itself has a problem. daemonize + explicit client
  # error handling makes a scanner error raise instead, so it can be
  # retried rather than silently destroying the file.
  it "raises on a scanner client error instead of treating it as an infection" do
    expect(described_class.config[:daemonize]).to be(true)
    expect(described_class.config[:error_clamscan_client_error]).to be(true)
  end
end
