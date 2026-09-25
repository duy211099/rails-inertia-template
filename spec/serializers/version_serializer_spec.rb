# frozen_string_literal: true

require "rails_helper"

RSpec.describe VersionSerializer do
  def serialize(object:, changes:)
    version = PaperTrail::Version.new(id: 7, item_type: "Item", item_id: 3, event: "update",
      object: object, object_changes: changes, created_at: Time.utc(2026, 1, 2, 3, 4, 5))
    described_class.one(version).stringify_keys
  end

  it "parses JSON snapshots and changes and formats timestamps" do
    result = serialize(object: '{"name":"Old"}', changes: '{"name":["Old","New"]}')
    expect(result).to include("object" => { "name" => "Old" }, "objectChanges" => { "name" => [ "Old", "New" ] }, "createdAt" => "2026-01-02T03:04:05Z")
  end

  [ nil, "", "not-json", "---\nname: Old\n" ].each do |value|
    it "returns null for blank or legacy data #{value.inspect}" do
      expect(serialize(object: value, changes: value)).to include("object" => nil, "objectChanges" => nil)
    end
  end
end
