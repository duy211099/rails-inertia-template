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
end
