# frozen_string_literal: true

RSpec.configure do |config|
  config.expect_with(:rspec) { |expectations| expectations.syntax = :expect }
  config.mock_with(:rspec) { |mocks| mocks.verify_partial_doubles = true }
  config.define_derived_metadata { |metadata| metadata[:aggregate_failures] = true }
  config.disable_monkey_patching!
  config.order = :random
  Kernel.srand config.seed
end
