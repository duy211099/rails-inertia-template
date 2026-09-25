# frozen_string_literal: true

require "rails_helper"

RSpec.describe UserSerializer do
  fixtures :users

  it "exposes the public profile with camelCase keys and no authentication secrets" do
    user = users(:one)
    user.avatar_url = "https://example.com/avatar.png"
    result = described_class.one(user).stringify_keys
    expect(result).to eq("id" => user.id, "name" => "User One", "email" => "user_one@example.com", "avatarUrl" => "https://example.com/avatar.png")
  end
end
