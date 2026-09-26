# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Items API", type: :request do
  include Skooma::RSpec[Rails.root.join("docs/openapi.yml")]

  fixtures :users, :items

  it "has a valid OpenAPI contract" do
    expect(skooma_openapi_schema).to be_valid_document
  end

  it "returns JSON 401 without a browser redirect" do
    get "/api/v1/items"
    expect(response).to conform_response_schema(:unauthorized)
    expect(response.parsed_body).to include("error" => include("code" => "unauthorized"))
  end

  it "rejects unauthenticated writes" do
    expect do
      post "/api/v1/items", params: { item: { name: "Unauthorized" } }, as: :json
    end.not_to change(Item, :count)
    expect(response).to conform_response_schema(:unauthorized)
  end

  context "with real session and CSRF protection" do
    around do |example|
      original = ActionController::Base.allow_forgery_protection
      ActionController::Base.allow_forgery_protection = true
      example.run
    ensure
      ActionController::Base.allow_forgery_protection = original
    end

    def csrf_token
      response.parsed_body.at_css('meta[name="csrf-token"]')["content"]
    end

    before do
      get new_user_session_path
      token = csrf_token
      post user_session_path, params: { user: { email: users(:one).email, password: "password123" } },
        headers: { "X-CSRF-Token" => token }
      get items_path
    end

    it "accepts a session cookie and CSRF token on a documented create request" do
      token = csrf_token
      post "/api/v1/items", params: { item: { name: "Browser item" } },
        headers: { "X-CSRF-Token" => token }, as: :json
      expect(response).to conform_schema(:created)
      expect(response.parsed_body.fetch("item").fetch("name")).to eq("Browser item")
    end

    it "rejects writes without CSRF even when authenticated" do
      expect do
        post "/api/v1/items", params: { item: { name: "No token" } }, as: :json
      end.not_to change(Item, :count)
      expect(response).to conform_response_schema(:unprocessable_content)
      expect(response.parsed_body.dig("error", "code")).to eq("invalid_csrf_token")
    end

    it "supports documented reads without CSRF" do
      get "/api/v1/items", params: { page: 1, limit: 1 }, as: :json
      expect(response).to conform_schema(:ok)
    end

    %i[patch put].each do |verb|
      it "accepts a documented #{verb} request with CSRF" do
        token = csrf_token
        public_send(verb, "/api/v1/items/#{items(:one).id}", params: { item: { name: "Updated" } },
          headers: { "X-CSRF-Token" => token }, as: :json)
        expect(response).to conform_schema(:ok)
        expect(items(:one).reload.name).to eq("Updated")
      end
    end

    it "accepts a documented deletion with CSRF" do
      token = csrf_token
      delete "/api/v1/items/#{items(:one).id}", headers: { "X-CSRF-Token" => token }, as: :json
      expect(response).to conform_schema(:no_content)
      expect(Item.unscoped.find(items(:one).id)).to be_discarded
    end

    it "stops authorizing API requests after logout" do
      token = csrf_token
      delete destroy_user_session_path, headers: { "X-CSRF-Token" => token }
      get "/api/v1/items", as: :json
      expect(response).to conform_response_schema(:unauthorized)
    end

    it "rejects writes with an invalid CSRF token" do
      patch "/api/v1/items/#{items(:one).id}", params: { item: { name: "No token" } },
        headers: { "X-CSRF-Token" => "invalid" }, as: :json
      expect(response).to conform_response_schema(:unprocessable_content)
      expect(items(:one).reload.name).to eq("First Item")
    end
  end

  context "when signed in" do
    before { sign_in users(:one) }

    it "lists only owned, kept items using Alba and Pagy" do
      items(:two).discard!
      get "/api/v1/items", as: :json
      expect(response).to conform_response_schema(:ok)
      expect(response.parsed_body.fetch("items").pluck("id")).to eq([ items(:one).id ])
      expect(response.parsed_body.fetch("pagy")).to include("count" => 1, "limit" => 12)
      expect(response.parsed_body.fetch("items").first).to include("phoneNumber", "createdAt", "updatedAt")
    end

    it "paginates in stable order" do
      get "/api/v1/items", params: { limit: 1, page: 2 }, as: :json
      expected = users(:one).items.order(created_at: :desc, id: :desc).second
      expect(response.parsed_body.fetch("items").pluck("id")).to eq([ expected.id ])
      expect(response.parsed_body.fetch("pagy")).to include("page" => 2, "limit" => 1, "count" => 2)
    end

    it "caps page size" do
      get "/api/v1/items", params: { limit: 1000 }, as: :json
      expect(response.parsed_body.fetch("pagy").fetch("limit")).to eq(100)
    end

    [ { page: 0 }, { page: "abc" }, { limit: -1 }, { page: [ 1 ] } ].each do |query|
      it "rejects invalid pagination #{query}" do
        get "/api/v1/items", params: query, as: :json
        expect(response).to conform_response_schema(:bad_request)
        expect(response.parsed_body).to include("error" => include("code" => "bad_request"))
      end
    end

    it "returns an empty page beyond the last page" do
      get "/api/v1/items", params: { page: 100 }, as: :json
      expect(response).to conform_response_schema(:ok)
      expect(response.parsed_body.fetch("items")).to eq([])
    end

    it "shows an owned item" do
      get "/api/v1/items/#{items(:one).id}", as: :json
      expect(response).to conform_response_schema(:ok)
      expect(response.parsed_body.fetch("item")).to include("id" => items(:one).id)
    end

    it "creates an item and records the authenticated author" do
      expect do
        post "/api/v1/items", params: { item: { name: "API item", phone_number: "123", user_id: users(:two).id } }, as: :json
      end.to change(Item, :count).by(1)
      created = Item.order(:id).last
      expect(created).to have_attributes(user_id: users(:one).id, phone_number: "123")
      expect(response).to conform_response_schema(:created)
      expect(response.headers["Location"]).to end_with("/api/v1/items/#{created.id}")
      expect(created.versions.last.whodunnit).to eq(users(:one).id.to_s)
    end

    it "returns structured validation errors" do
      expect do
        post "/api/v1/items", params: { item: { name: "" } }, as: :json
      end.not_to change(Item, :count)
      expect(response).to conform_response_schema(:unprocessable_content)
      expect(response.parsed_body).to include("error" => include("code" => "validation_failed", "details" => include("name")))
    end

    it "rejects missing item parameters" do
      post "/api/v1/items", params: {}, as: :json
      expect(response).to conform_response_schema(:bad_request)
      expect(response.parsed_body).to include("error" => include("code" => "bad_request"))
    end

    it "rejects a scalar item payload" do
      post "/api/v1/items", params: { item: "invalid" }, as: :json
      expect(response).to conform_response_schema(:bad_request)
    end

    it "rejects malformed JSON" do
      post "/api/v1/items", params: '{"item":', headers: { "CONTENT_TYPE" => "application/json" }
      expect(response).to conform_response_schema(:bad_request)
      expect(response.parsed_body).to include("error" => include("code" => "bad_request"))
    end

    it "updates an owned item" do
      patch "/api/v1/items/#{items(:one).id}", params: { item: { name: "Updated", user_id: users(:two).id } }, as: :json
      expect(response).to conform_response_schema(:ok)
      expect(items(:one).reload).to have_attributes(name: "Updated", user_id: users(:one).id)
    end

    it "also accepts PUT updates" do
      put "/api/v1/items/#{items(:one).id}", params: { item: { description: "Details" } }, as: :json
      expect(response).to conform_response_schema(:ok)
      expect(items(:one).reload.description).to eq("Details")
    end

    it "preserves the record when an update is invalid" do
      original = items(:one).name
      patch "/api/v1/items/#{items(:one).id}", params: { item: { name: "" } }, as: :json
      expect(response).to conform_response_schema(:unprocessable_content)
      expect(items(:one).reload.name).to eq(original)
    end

    it "soft-deletes an owned item" do
      delete "/api/v1/items/#{items(:one).id}", as: :json
      expect(response).to conform_response_schema(:no_content)
      expect(response.body).to be_empty
      expect(Item.unscoped.find(items(:one).id)).to be_discarded
    end

    %i[get patch delete].each do |verb|
      it "conceals another user's item on #{verb}" do
        public_send(verb, "/api/v1/items/#{items(:three).id}", params: { item: { name: "Hacked" } }, as: :json)
        expect(response).to conform_response_schema(:not_found)
        expect(response.parsed_body).to include("error" => include("code" => "not_found"))
        expect(items(:three).reload).to have_attributes(name: "Third Item", discarded_at: nil)
      end
    end

    it "conceals discarded items" do
      items(:one).discard!
      get "/api/v1/items/#{items(:one).id}", as: :json
      expect(response).to conform_response_schema(:not_found)
    end
  end

  context "when signed in as an admin" do
    before { sign_in users(:one).tap { |u| u.update!(role: :admin) } }

    it "lists every user's items, not just their own" do
      get "/api/v1/items", as: :json
      expect(response.parsed_body.fetch("items").pluck("id")).to include(items(:three).id)
    end

    it "shows another user's item" do
      get "/api/v1/items/#{items(:three).id}", as: :json
      expect(response).to conform_response_schema(:ok)
    end

    it "updates another user's item" do
      patch "/api/v1/items/#{items(:three).id}", params: { item: { name: "Fixed by admin" } }, as: :json
      expect(response).to conform_response_schema(:ok)
      expect(items(:three).reload.name).to eq("Fixed by admin")
    end

    it "deletes another user's item" do
      delete "/api/v1/items/#{items(:three).id}", as: :json
      expect(response).to conform_response_schema(:no_content)
      expect(Item.unscoped.find(items(:three).id)).to be_discarded
    end
  end
end
