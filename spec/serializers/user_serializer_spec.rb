# frozen_string_literal: true

require "rails_helper"

RSpec.describe UserSerializer, type: :serializer do
  fixtures :users, :items

  it "includes createdAt" do
    hash = described_class.new(users(:one)).serializable_hash

    expect(hash["createdAt"]).to eq(users(:one).created_at)
  end

  it "serializes a nil name" do
    user = User.create!(email: "no-items@example.com", password: "password123", name: nil)

    hash = described_class.new(user).serializable_hash

    expect(hash["name"]).to be_nil
  end
end
