# frozen_string_literal: true

class PagySerializer < Oj::Serializer
  attributes :count, :page, :limit, :pages, :last, :in, :from, :to, :prev, :next
end
