# frozen_string_literal: true

Rails.application.configure do
  config.lograge.enabled = Rails.env.production?
  config.lograge.formatter = Lograge::Formatters::Json.new
  # A separate untagged logger keeps each request summary valid JSON.
  config.lograge.logger = ActiveSupport::Logger.new($stdout, level: config.log_level)
  config.lograge.custom_payload do |controller|
    { request_id: controller.request.request_id }
  end
  config.lograge.ignore_custom = ->(event) { event.payload[:path].to_s.split("?").first == "/up" }
end
