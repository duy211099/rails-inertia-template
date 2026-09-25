# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Collection props", type: :request do
  fixtures :users, :items

  def inertia_headers(component, only: nil)
    { "X-Inertia" => "true", "X-Inertia-Version" => ViteRuby.digest }.tap do |headers|
      if only
        headers["X-Inertia-Partial-Component"] = component
        headers["X-Inertia-Partial-Data"] = only
      end
    end
  end

  it "does not serialize items when only pagination is requested" do
    sign_in users(:one)
    # Serialization must be lazy, not merely filtered out of the response.
    allow(ItemSerializer).to receive(:new).and_raise("unrequested serialization")
    get items_path, headers: inertia_headers("items/index", only: "pagy")
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("props")).to include("pagy")
    expect(response.parsed_body.fetch("props")).not_to have_key("items")
  end

  it "does not serialize versions when only pagination is requested" do
    sign_in users(:one)
    allow(VersionSerializer).to receive(:new).and_raise("unrequested serialization")
    get versions_path, headers: inertia_headers("versions/index", only: "pagy")
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("props")).to include("pagy")
    expect(response.parsed_body.fetch("props")).not_to have_key("versions")
  end
end
