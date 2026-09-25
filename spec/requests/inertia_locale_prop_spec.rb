# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Inertia locale prop", type: :request do
  it "shares the resolved locale on every Inertia response" do
    # Uses root_path (InertiaExampleController < InertiaController) rather
    # than a Devise page: Users::SessionsController inherits ApplicationController
    # (via DeviseController) but not InertiaController, so InertiaController's
    # inertia_share blocks (flash, user, locale alike) never reach Devise pages —
    # pre-existing behavior, unrelated to this change.
    get root_path, headers: { "X-Inertia" => "true", "X-Inertia-Version" => ViteRuby.digest }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("props", "locale")).to eq("en")
  end

  it "shares the list of available locales on every Inertia response" do
    get root_path, headers: { "X-Inertia" => "true", "X-Inertia-Version" => ViteRuby.digest }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("props", "availableLocales")).to eq([ "en" ])
  end
end
