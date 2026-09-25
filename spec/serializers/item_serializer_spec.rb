# frozen_string_literal: true

require "rails_helper"

RSpec.describe ItemSerializer do
  fixtures :users, :items

  it "preserves nullable fields, camelCase keys and JSON timestamps" do
    item = items(:one)
    item.assign_attributes(description: nil, phone_number: nil,
      created_at: Time.utc(2026, 1, 2, 3, 4, 5), updated_at: Time.utc(2026, 1, 2, 3, 4, 5))
    result = JSON.parse(described_class.new(item).serialize)
    expect(result).to eq("id" => item.id, "name" => item.name, "description" => nil,
      "phoneNumber" => nil, "createdAt" => "2026-01-02T03:04:05.000Z", "updatedAt" => "2026-01-02T03:04:05.000Z")
  end

  it "serializes an empty collection as an array" do
    expect(described_class.new([]).serializable_hash).to eq([])
  end
end
