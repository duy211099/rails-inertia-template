# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Admin", type: :request do
  fixtures :users, :items

  it "redirects anonymous visitors to the MVC sign-in page" do
    get admin_root_path
    expect(response).to redirect_to(new_user_session_path)
  end

  it "redirects signed-in non-admins with an access-denied alert" do
    sign_in users(:one)
    get admin_root_path
    expect(response).to redirect_to(root_path)
    follow_redirect!
    expect(response.body).to include(I18n.t("admin.access_denied"))
  end

  it "shows every user's items to a signed-in admin" do
    users(:one).update!(role: :admin)
    sign_in users(:one)
    get admin_root_path, headers: { "X-Inertia" => "true", "X-Inertia-Version" => ViteRuby.digest }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to include("component" => "admin/dashboard")
    ids = response.parsed_body.dig("props", "items").map { |item| item["id"] }
    expect(ids).to include(items(:one).id, items(:two).id, items(:three).id)
  end
end
