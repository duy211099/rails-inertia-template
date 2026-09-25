# frozen_string_literal: true

class ItemsIndexResource < ApplicationResource
  many :items, resource: ItemSerializer
  one :pagy, resource: PagySerializer
end
