# frozen_string_literal: true

class ItemSerializer < BaseSerializer
  attributes :id, :name, :description, :created_at, :updated_at
end
