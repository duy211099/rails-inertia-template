# frozen_string_literal: true

require "rails_helper"

RSpec.describe "API documentation", type: :request do
  fixtures :users

  it "requires login to view Swagger UI" do
    get "/api/docs"
    expect(response).to redirect_to(new_user_session_path)
  end

  it "requires login to fetch the contract" do
    get "/api/openapi.json"
    expect(response).to have_http_status(:unauthorized)
  end

  context "when signed in" do
    before { sign_in users(:one) }

    it "serves a dedicated Swagger page" do
      get "/api/docs"
      expect(response).to have_http_status(:ok)
      expect(response.body).to include('id="swagger-ui"', "api_docs", "Try it out")
      expect(response.body).not_to include('data-page=', 'entrypoints/inertia')
      expect(response.headers["Cache-Control"]).to include("no-store")
    end

    it "serves the same contract used by Skooma" do
      get "/api/openapi.json"
      expect(response).to have_http_status(:ok)
      expect(response.media_type).to eq("application/json")
      expect(response.parsed_body).to eq(YAML.safe_load_file(Rails.root.join("docs/openapi.yml")))
    end
  end
end
