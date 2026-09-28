# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Auth event logging", type: :request do
  fixtures :users

  it "logs a successful sign-in against the user" do
    expect {
      post user_session_path, params: { user: { email: users(:one).email, password: "password123" } }
    }.to change(AuthEvent, :count).by(1)

    event = AuthEvent.last
    expect(event).to have_attributes(user_id: users(:one).id, event_type: "success")
  end

  it "logs a failed sign-in without a user association" do
    expect {
      post user_session_path, params: { user: { email: users(:one).email, password: "wrong" } }
    }.to change(AuthEvent, :count).by(1)

    event = AuthEvent.last
    expect(event).to have_attributes(user_id: nil, email: users(:one).email, event_type: "failure")
  end

  it "does not log an auth event for unrelated authentication failures, like visiting a page while signed out" do
    expect {
      get items_path
    }.not_to change(AuthEvent, :count)
  end

  it "does not block deleting a user who has signed in (and been logged)" do
    post user_session_path, params: { user: { email: users(:one).email, password: "password123" } }

    expect { users(:one).destroy }.not_to raise_error
    expect(AuthEvent.count).to be >= 1
  end
end
