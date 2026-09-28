# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Session lockout", type: :request do
  fixtures :users

  it "locks the account after 5 failed attempts, blocking even the correct password" do
    5.times do
      post user_session_path, params: { user: { email: users(:one).email, password: "wrong" } }
    end

    expect(users(:one).reload).to be_access_locked

    post user_session_path, params: { user: { email: users(:one).email, password: "password123" } }

    expect(response.body).to include(I18n.t("devise.failure.locked"))
  end

  it "does not lock the account before the 5th failed attempt" do
    4.times do
      post user_session_path, params: { user: { email: users(:one).email, password: "wrong" } }
    end

    expect(users(:one).reload).not_to be_access_locked
  end
end
