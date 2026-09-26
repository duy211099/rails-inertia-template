# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Home", type: :request do
  fixtures :users, :items

  it "renders the home page for anonymous visitors" do
    get root_path, headers: { "X-Inertia" => "true", "X-Inertia-Version" => ViteRuby.digest }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to include("component" => "home/index")
    expect(response.parsed_body.dig("props", "user")).to be_nil
  end

  it "shares the signed-in user's profile, same as any other Inertia page" do
    sign_in users(:one)
    get root_path, headers: { "X-Inertia" => "true", "X-Inertia-Version" => ViteRuby.digest }
    expect(response.parsed_body.dig("props", "user").keys).to contain_exactly("id", "name", "email", "avatarUrl")
  end
end
