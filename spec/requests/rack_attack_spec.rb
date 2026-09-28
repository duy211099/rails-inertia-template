# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Rack::Attack login throttling", type: :request do
  before { Rack::Attack.cache.store.clear }

  it "throttles repeated login attempts from the same IP" do
    11.times do
      post user_session_path, params: { user: { email: "nonexistent@example.com", password: "wrong" } }
    end

    expect(response).to have_http_status(:too_many_requests)
  end
end
