# frozen_string_literal: true

class VersionsIndexResource < ApplicationResource
  many :versions, resource: VersionSerializer
  one :pagy, resource: PagySerializer
end
