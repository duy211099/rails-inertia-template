# frozen_string_literal: true

class BaseSerializer < Oj::Serializer
  # Transform keys to camelCase for JavaScript consumption
  transform_keys :camelize
end
