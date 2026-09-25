# frozen_string_literal: true

require "rails_helper"

RSpec.describe ItemPolicy, type: :policy do
  fixtures :users, :items

  %i[index? create? new?].each do |rule|
    it "allows authenticated users to #{rule}" do
      expect(described_class.new(Item, user: users(:one)).apply(rule)).to be(true)
    end
  end

  %i[show? update? edit? destroy?].each do |rule|
    it "allows the owner to #{rule}" do
      expect(described_class.new(items(:one), user: users(:one)).apply(rule)).to be(true)
    end

    it "prevents another user from #{rule}" do
      expect(described_class.new(items(:one), user: users(:two)).apply(rule)).to be(false)
    end
  end

  it "scopes the collection to the user's kept items" do
    items(:two).discard!
    policy = described_class.new(Item, user: users(:one))
    expect(policy.apply_scope(Item.all, type: :active_record_relation)).to contain_exactly(items(:one))
  end
end
