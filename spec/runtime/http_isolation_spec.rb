# frozen_string_literal: true

require "rails_helper"
require "net/http"

RSpec.describe "Backend HTTP isolation" do
  it "blocks accidental external requests" do
    expect { Net::HTTP.get(URI("https://network-check.invalid")) }.to raise_error(WebMock::NetConnectNotAllowedError)
  end

  it "allows explicitly stubbed integrations" do
    stub_request(:get, "https://network-check.invalid").to_return(body: "stubbed response")
    expect(Net::HTTP.get(URI("https://network-check.invalid"))).to eq("stubbed response")
  end
end
