# frozen_string_literal: true

class PagySerializer < BaseSerializer
  attributes :count, :page, :limit, :pages, :last, :in, :from, :to, :next

  typelize count: :number, page: :number, limit: :number, pages: :number,
    last: :number, in: :number, from: :number, to: :number,
    next: "number | null", prev: "number | null"

  # Preserve the frontend contract across Pagy's reader rename.
  attribute(:prev) { |pagy| pagy.previous }
end
