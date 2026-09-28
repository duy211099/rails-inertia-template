# frozen_string_literal: true

module Observability
  module SentryConfig
    def self.enabled?(dsn)
      dsn.present?
    end
  end
end
