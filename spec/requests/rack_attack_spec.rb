# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Rack::Attack login throttling", type: :request do
  it "throttles repeated login attempts from the same IP" do
    11.times do
      post user_session_path, params: { user: { email: "nonexistent@example.com", password: "wrong" } }
    end

    expect(response).to have_http_status(:too_many_requests)
  end

  it "throttles repeated login attempts against the JSON API login endpoint" do
    11.times do
      post api_v1_session_path, params: { email: "nonexistent@example.com", password: "wrong" }
    end

    expect(response).to have_http_status(:too_many_requests)
  end
end
