# frozen_string_literal: true

require "rails_helper"

# == Schema Information
#
# Table name: items
#
#  id           :integer          not null, primary key
#  description  :text
#  discarded_at :datetime
#  name         :string           not null
#  phone_number :string
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  user_id      :integer          not null
#
# Indexes
#
#  index_items_on_discarded_at  (discarded_at)
#  index_items_on_user_id       (user_id)
#
# Foreign Keys
#
#  user_id  (user_id => users.id)
#
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
