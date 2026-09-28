# frozen_string_literal: true

require "rails_helper"

RSpec.describe AuthEvent, type: :model do
  it "defines success and failure event types" do
    expect(described_class.event_types.keys).to contain_exactly("success", "failure")
  end

  it "does not require a user (failed logins may not resolve to one)" do
    event = described_class.new(email: "nobody@example.com", event_type: :failure, ip_address: "127.0.0.1")
    expect(event).to be_valid
  end

  it "requires event_type (column is NOT NULL)" do
    event = described_class.new(email: "nobody@example.com", ip_address: "127.0.0.1")
    expect(event).not_to be_valid
    expect(event.errors[:event_type]).to be_present
  end

  it "discards a value that doesn't look like an email before saving" do
    # A failed login's email param is whatever the client typed into that
    # field — sometimes a password pasted into the wrong box. Only persist
    # it when it's at least shaped like an email, so a plaintext secret
    # never lands in the audit trail.
    event = described_class.create!(email: "hunter2", event_type: :failure, ip_address: "127.0.0.1")
    expect(event.email).to be_nil
  end

  it "keeps a value that looks like an email" do
    event = described_class.create!(email: "Nobody@Example.com", event_type: :failure, ip_address: "127.0.0.1")
    expect(event.email).to eq("Nobody@Example.com")
  end
end
