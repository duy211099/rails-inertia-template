# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Locale resolution", type: :request do
  it "only advertises en as available (i18n-tasks' bundled ru.yml must not leak in)" do
    expect(I18n.available_locales).to eq([ :en ])
  end

  # I18n.with_locale restores the prior locale once its block (the
  # controller action) returns, so I18n.locale read *after* `get` always
  # reflects the value from before the request, not what was resolved
  # during it. Spy on the argument SetsLocale passes to I18n.with_locale
  # instead of inspecting I18n.locale post-request.
  def expect_resolved_locale
    allow(I18n).to receive(:with_locale).and_call_original
  end

  def verify_resolved_locale!(locale)
    expect(I18n).to have_received(:with_locale).with(locale).once
  end

  it "defaults to en with no cookie or header" do
    expect_resolved_locale
    get root_path
    expect(response).to have_http_status(:ok)
    verify_resolved_locale!(:en)
  end

  it "honors a supported Accept-Language header" do
    expect_resolved_locale
    get root_path, headers: { "Accept-Language" => "en-US,en;q=0.9" }
    expect(response).to have_http_status(:ok)
    verify_resolved_locale!(:en)
  end

  it "falls back to en for an unsupported Accept-Language header" do
    expect_resolved_locale
    get root_path, headers: { "Accept-Language" => "fr-FR,fr;q=0.9" }
    expect(response).to have_http_status(:ok)
    verify_resolved_locale!(:en)
  end

  it "does not raise for a malformed Accept-Language header" do
    expect {
      get root_path, headers: { "Accept-Language" => "../../etc" }
    }.not_to raise_error
    expect(response).to have_http_status(:ok)
  end

  it "honors a supported locale cookie" do
    expect_resolved_locale
    get root_path, headers: { "Cookie" => "locale=en" }
    expect(response).to have_http_status(:ok)
    verify_resolved_locale!(:en)
  end

  it "does not raise for a garbage locale cookie and falls back to default" do
    expect {
      get root_path, headers: { "Cookie" => "locale=xx" }
    }.not_to raise_error
    expect(response).to have_http_status(:ok)
  end

  it "does not raise for a locale cookie with invalid UTF-8 bytes" do
    expect {
      get root_path, headers: { "Cookie" => "locale=%FF%FE" }
    }.not_to raise_error
    expect(response).to have_http_status(:ok)
  end

  it "prefers the cookie over a differing Accept-Language header" do
    original_locales = I18n.available_locales
    I18n.available_locales = %i[en fr]
    begin
      expect_resolved_locale
      get root_path, headers: { "Cookie" => "locale=fr", "Accept-Language" => "en-US" }
      expect(response).to have_http_status(:ok)
      verify_resolved_locale!(:fr)
    ensure
      I18n.available_locales = original_locales
    end
  end

  context "with the JSON API (Api::V1::BaseController, a separate inheritance chain)" do
    fixtures :users

    it "resolves locale for authenticated API requests too" do
      sign_in users(:one)
      expect_resolved_locale
      get api_v1_items_path, headers: { "Accept-Language" => "en-US" }
      expect(response).to have_http_status(:ok)
      verify_resolved_locale!(:en)
    end

    it "localizes the unauthenticated 401 error message" do
      original_locales = I18n.available_locales
      I18n.available_locales = %i[en fr]
      I18n.backend.store_translations(:fr, api: { v1: { errors: { unauthorized: "Connectez-vous pour continuer." } } })
      begin
        get api_v1_items_path, headers: { "Accept-Language" => "fr" }
        expect(response).to have_http_status(:unauthorized)
        expect(response.parsed_body.dig("error", "message")).to eq("Connectez-vous pour continuer.")
      ensure
        I18n.available_locales = original_locales
      end
    end

    it "localizes a rescue_from error message (RecordNotFound)" do
      original_locales = I18n.available_locales
      I18n.available_locales = %i[en fr]
      I18n.backend.store_translations(:fr, api: { v1: { errors: { not_found: "Enregistrement introuvable." } } })
      begin
        sign_in users(:one)
        get api_v1_item_path(id: 0), headers: { "Accept-Language" => "fr" }
        expect(response).to have_http_status(:not_found)
        expect(response.parsed_body.dig("error", "message")).to eq("Enregistrement introuvable.")
      ensure
        I18n.available_locales = original_locales
      end
    end
  end
end
