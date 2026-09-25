# frozen_string_literal: true

# Use the same JSON time formatting as Rails responses.
Alba.encoder = ->(value) { ActiveSupport::JSON.encode(value) }
Alba::Inertia.configure do |config|
  config.lazy_by_default = true
  config.default_render = false
end
