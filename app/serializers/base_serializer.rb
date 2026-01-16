# frozen_string_literal: true

class BaseSerializer < Oj::Serializer
  include TypesFromSerializers::DSL

  # Transform keys to camelCase for JavaScript consumption
  transform_keys :camelize
end
