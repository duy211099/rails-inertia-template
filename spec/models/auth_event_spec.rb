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
end
