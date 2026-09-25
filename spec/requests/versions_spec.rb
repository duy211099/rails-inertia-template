# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Versions", type: :request do
  fixtures :users, :items

  it "redirects anonymous users" do
    get versions_path
    expect(response).to redirect_to(new_user_session_path)
  end

  it "returns only the signed-in user's audit records" do
    own = PaperTrail::Version.create!(item_type: "Item", item_id: items(:one).id,
      event: "update", whodunnit: users(:one).id.to_s, object: '{"phone_number":"123"}')
    PaperTrail::Version.create!(item_type: "Item", item_id: items(:three).id,
      event: "update", whodunnit: users(:two).id.to_s)
    sign_in users(:one)
    get versions_path, headers: { "X-Inertia" => "true", "X-Inertia-Version" => ViteRuby.digest }
    props = response.parsed_body.fetch("props")
    expect(response).to have_http_status(:ok)
    expect(props.fetch("versions").map { |version| version.fetch("id") }).to eq([ own.id ])
    expect(props.dig("versions", 0, "object")).to eq("phone_number" => "123")
    expect(props.fetch("pagy")).to include("count" => 1, "prev" => nil, "next" => nil)
  end

  it "returns an empty collection and pagination when there are no audit records" do
    sign_in users(:one)
    get versions_path, headers: { "X-Inertia" => "true", "X-Inertia-Version" => ViteRuby.digest }
    expect(response.parsed_body.fetch("props")).to include("versions" => [], "pagy" => hash_including("count" => 0))
  end
end
