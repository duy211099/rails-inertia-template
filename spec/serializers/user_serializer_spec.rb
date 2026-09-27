# frozen_string_literal: true

require "rails_helper"

RSpec.describe UserSerializer, type: :serializer do
  fixtures :users, :items

  it "includes createdAt and itemsCount" do
    hash = described_class.new(users(:one)).serializable_hash

    expect(hash["createdAt"]).to eq(users(:one).created_at)
    expect(hash["itemsCount"]).to eq(2)
  end

  it "returns zero itemsCount for a user with no items" do
    user = User.create!(email: "no-items@example.com", password: "password123", name: nil)

    hash = described_class.new(user).serializable_hash

    expect(hash["itemsCount"]).to eq(0)
    expect(hash["name"]).to be_nil
  end
end
