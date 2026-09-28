# frozen_string_literal: true

require "rails_helper"

RSpec.describe Observability::SentryConfig do
  describe ".enabled?" do
    it "is false when the DSN is blank" do
      expect(described_class.enabled?(nil)).to be(false)
      expect(described_class.enabled?("")).to be(false)
    end

    it "is true when a DSN is present" do
      expect(described_class.enabled?("https://key@sentry.io/123")).to be(true)
    end
  end
end
