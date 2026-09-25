# frozen_string_literal: true

require "rails_helper"

RSpec.describe Item, type: :model do
  fixtures :users, :items

  it "requires a nonblank name" do
    [ nil, "", "   " ].each do |name|
      item = described_class.new(name: name, user: users(:one))
      expect(item).not_to be_valid
      expect(item.errors[:name]).to be_present
    end
  end

  it "requires an owner" do
    item = described_class.new(name: "Test Item")
    expect(item).not_to be_valid
    expect(item.errors[:user]).to be_present
  end

  it "saves a named item with optional description and phone number" do
    item = described_class.create!(name: "Test Item", user: users(:one), description: "Details", phone_number: "123456")
    expect(item.reload).to have_attributes(description: "Details", phone_number: "123456", user: users(:one))
  end

  it "allows a blank description" do
    expect(described_class.new(name: "Test Item", user: users(:one), description: nil)).to be_valid
  end

  it "has valid fixtures associated with their owners" do
    expect([ items(:one), items(:two), items(:three) ]).to all(be_valid)
    expect(items(:one).user).to eq(users(:one))
  end

  it "hides discarded items without deleting their database rows" do
    item = items(:one)
    expect { item.discard! }.to change(described_class, :count).by(-1)
    expect(described_class.unscoped.find(item.id)).to be_discarded
    expect(users(:one).items).not_to include(item)
  end

  it "restores discarded items to the default scope" do
    item = items(:one)
    item.discard!
    item.undiscard!
    expect(described_class.find(item.id)).to be_kept
  end

  it "records item changes for the audit history" do
    item = items(:one)
    expect { item.update!(name: "Updated") }.to change(item.versions, :count).by(1)
    expect(item.versions.last.changeset["name"]).to eq([ "First Item", "Updated" ])
  end
end
