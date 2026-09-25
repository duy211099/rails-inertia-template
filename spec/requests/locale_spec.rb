# frozen_string_literal: true

require "rails_helper"

RSpec.describe "PATCH /locale", type: :request do
  it "sets the locale cookie for a supported locale" do
    patch locale_path, params: { locale: "en" }
    expect(response).to have_http_status(:no_content)
    expect(response.cookies["locale"]).to eq("en")
  end

  it "rejects an unsupported locale and does not set a cookie" do
    patch locale_path, params: { locale: "xx" }
    expect(response).to have_http_status(:unprocessable_content)
    expect(response.cookies["locale"]).to be_nil
  end

  it "rejects a missing locale param" do
    patch locale_path
    expect(response).to have_http_status(:bad_request)
  end

  it "rejects a non-string locale param without raising" do
    expect {
      patch locale_path, params: { locale: [ "en" ] }
    }.not_to raise_error
    expect(response).to have_http_status(:bad_request)
  end
end
