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

  it "tells Inertia to do a full reload instead of a raw JSON body Inertia's client can't parse" do
    10.times do
      post user_session_path, params: { user: { email: "nonexistent@example.com", password: "wrong" } },
        headers: { "X-Inertia" => "true" }
    end

    post user_session_path, params: { user: { email: "nonexistent@example.com", password: "wrong" } },
      headers: { "X-Inertia" => "true" }

    expect(response).to have_http_status(:conflict)
    expect(response.headers["X-Inertia-Location"]).to eq(user_session_path)
  end

  it "throttles by email against the JSON API login endpoint even when the attacker rotates IPs" do
    11.times do |i|
      post api_v1_session_path,
        params: { email: "nonexistent@example.com", password: "wrong" }.to_json,
        headers: { "CONTENT_TYPE" => "application/json", "REMOTE_ADDR" => "10.0.0.#{i}" }
    end

    expect(response).to have_http_status(:too_many_requests)
  end

  it "does not blow up on a POST with no request body at all" do
    # Rack::MockRequest#post with no explicit input leaves req.body nil,
    # unlike every Rails-generated request in this spec file (which always
    # has a form- or JSON-encoded body). Anything that unconditionally
    # calls req.body.read would 500 on a request shaped like this.
    mock_response = Rack::MockRequest.new(Rails.application).post(
      "/api/v1/session", "HTTP_HOST" => "example.com"
    )

    expect(mock_response.status).not_to eq(500)
  end
end
