# frozen_string_literal: true

class UsersIndexResource < ApplicationResource
  many :users, resource: UserSerializer
  one :pagy, resource: PagySerializer
end
