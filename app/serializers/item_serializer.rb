# frozen_string_literal: true

class ItemSerializer < BaseSerializer
  object_as :item, model: "Item"

  attributes :id, :name, :description, :created_at, :updated_at
end
