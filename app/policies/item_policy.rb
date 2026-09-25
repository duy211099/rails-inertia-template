# frozen_string_literal: true

class ItemPolicy < ApplicationPolicy
  # Inherits all rules from ApplicationPolicy
  # Items are owned by users, so the default owner? check and relation_scope work
end
