# frozen_string_literal: true

class VersionSerializer < BaseSerializer
  typelize_from PaperTrail::Version

  attributes :id, :item_type, :item_id, :event
  typelize id: :number, item_id: :number, created_at: :string,
    object: "Record<string, unknown> | null",
    object_changes: "Record<string, [unknown, unknown]> | null"

  attribute(:created_at) { |version| version.created_at.iso8601 }
  attribute(:object) { |version| parse_json(version.object) }
  attribute(:object_changes) { |version| parse_json(version.object_changes) }

  private

  def parse_json(value)
    return nil if value.blank?

    JSON.parse(value)
  rescue JSON::ParserError
    # Legacy YAML snapshots are deliberately not deserialized.
    nil
  end
end
