# frozen_string_literal: true

Typelizer.configure do |config|
  config.output_dir = ENV.fetch("TYPELIZER_OUTPUT_DIR") { Rails.root.join("app/frontend/types/serializers") }
  config.serializer_name_mapper = ->(serializer) { serializer.name.delete_suffix("Serializer").delete_suffix("Resource") }
  config.null_strategy = :nullable
  config.routes.enabled = false # JS Routes owns frontend route helpers.
end
