# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Admin::Users", type: :request do
  fixtures :users, :items

  def sign_in_admin
    UserRole.create!(user: users(:one), role: Role.create!(name: "admin"))
    sign_in User.find(users(:one).id)
  end

  def inertia_get(path, params = {})
    get path, params: params, headers: { "X-Inertia" => "true", "X-Inertia-Version" => ViteRuby.digest }
  end

  describe "GET /admin/users" do
    it "redirects anonymous visitors to sign-in" do
      get admin_users_path
      expect(response).to redirect_to(new_user_session_path)
    end

    it "redirects signed-in non-admins with an access-denied alert" do
      sign_in users(:one)
      get admin_users_path
      expect(response).to redirect_to(root_path)
      follow_redirect!
      expect(response.body).to include(I18n.t("admin.access_denied"))
    end

    it "redirects a signed-in dev-role user (below admin level)" do
      UserRole.create!(user: users(:one), role: Role.create!(name: "dev"))
      sign_in User.find(users(:one).id)
      get admin_users_path
      expect(response).to redirect_to(root_path)
    end

    it "lists every user for an admin" do
      sign_in_admin
      inertia_get admin_users_path
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to include("component" => "admin/users/index")
      emails = response.parsed_body.dig("props", "users").map { |u| u["email"] }
      expect(emails).to contain_exactly(users(:one).email, users(:two).email)
    end

    it "searches by name or email" do
      sign_in_admin
      inertia_get admin_users_path, q: users(:two).email
      emails = response.parsed_body.dig("props", "users").map { |u| u["email"] }
      expect(emails).to contain_exactly(users(:two).email)
    end

    it "returns an empty list when the search matches nothing" do
      sign_in_admin
      inertia_get admin_users_path, q: "no-such-user"
      expect(response.parsed_body.dig("props", "users")).to eq([])
    end

    it "sorts by name ascending" do
      sign_in_admin
      # Backdated so default created_at order would put it LAST — only an
      # actual name sort puts it first alphabetically.
      user = User.create!(email: "aaa-first@example.com", password: "password123", name: "AAA First")
      user.update_column(:created_at, 10.years.ago)

      inertia_get admin_users_path, sort: "name", direction: "asc"
      names = response.parsed_body.dig("props", "users").map { |u| u["name"] }
      expect(names.first).to eq("AAA First")
    end

    it "sorts by created_at descending by default" do
      sign_in_admin
      inertia_get admin_users_path
      ids = response.parsed_body.dig("props", "users").map { |u| u["id"] }
      expect(ids).to eq(User.order(created_at: :desc).pluck(:id))
    end

    it "rejects an unknown sort column, falling back to created_at" do
      sign_in_admin
      inertia_get admin_users_path, sort: "encrypted_password", direction: "asc"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig("props", "sort")).to be_nil
    end

    it "filters by role" do
      sign_in_admin
      admin_role = Role.find_by(name: "admin")
      inertia_get admin_users_path, role: [ "admin" ]
      emails = response.parsed_body.dig("props", "users").map { |u| u["email"] }
      expect(emails).to match_array(admin_role.users.map(&:email))
    end
  end

  describe "GET /admin/users/:id" do
    it "shows a user's detail to an admin" do
      sign_in_admin
      inertia_get admin_user_path(users(:two))
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to include("component" => "admin/users/show")
      expect(response.parsed_body.dig("props", "user", "email")).to eq(users(:two).email)
    end

    it "404s for an unknown id" do
      sign_in_admin
      inertia_get admin_user_path("00000000-0000-0000-0000-000000000000")
      expect(response).to have_http_status(:not_found)
    end

    it "redirects non-admins" do
      sign_in users(:one)
      get admin_user_path(users(:two))
      expect(response).to redirect_to(root_path)
    end
  end
end
