# frozen_string_literal: true

require "rails_helper"

RSpec.describe UserPolicy, type: :policy do
  fixtures :users

  %i[index? show?].each do |rule|
    it "denies a non-admin for #{rule}" do
      expect(described_class.new(users(:one), user: users(:one)).apply(rule)).to be(false)
    end

    it "allows an admin for #{rule}" do
      UserRole.create!(user: users(:two), role: Role.create!(name: "admin"))
      admin = User.find(users(:two).id)

      expect(described_class.new(users(:one), user: admin).apply(rule)).to be(true)
    end
  end
end
