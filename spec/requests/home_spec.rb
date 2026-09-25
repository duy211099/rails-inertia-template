# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Home", type: :request do
  fixtures :users, :items

  it "preserves anonymous shared props and the homepage's snake_case keys" do
    get root_path, headers: { "X-Inertia" => "true", "X-Inertia-Version" => ViteRuby.digest }
    expect(response.parsed_body.fetch("props")).to include("user" => nil, "recent_items" => [], "rails_version" => Rails.version)
  end

  it "shares a public profile and the user's recent items" do
    sign_in users(:one)
    get root_path, headers: { "X-Inertia" => "true", "X-Inertia-Version" => ViteRuby.digest }
    props = response.parsed_body.fetch("props")
    expect(props.fetch("user").keys).to contain_exactly("id", "name", "email", "avatarUrl")
    expect(props.fetch("recent_items").map { |item| item.fetch("id") }).to match_array(users(:one).items.ids)
  end
end
