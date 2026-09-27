# frozen_string_literal: true

class ApplicationRecord < ActiveRecord::Base
  primary_abstract_class

  # UUID primary keys aren't sortable, so .first/.last need an explicit
  # tiebreaker to stay deterministic.
  self.implicit_order_column = "created_at"
end
