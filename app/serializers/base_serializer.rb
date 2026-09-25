# frozen_string_literal: true

class BaseSerializer
  include Alba::Resource
  include Typelizer::DSL

  # Do not change keys inside audit snapshot hashes.
  transform_keys :lower_camel, cascade: false
end
