# frozen_string_literal: true

require "spec_helper"
require "open3"
require "json"

RSpec.describe "Runtime integrations" do
  def expect_run_in(environment, script)
    output, status = Open3.capture2e(
      { "RAILS_ENV" => environment, "TYPELIZER" => "false", "SECRET_KEY_BASE_DUMMY" => "1",
        "R2_ENDPOINT" => "https://storage.example.test", "R2_ACCESS_KEY_ID" => "test",
        "R2_SECRET_ACCESS_KEY" => "test", "R2_BUCKET" => "test", "AWS_EC2_METADATA_DISABLED" => "true" },
      "bundle", "exec", "rails", "runner", "-", stdin_data: script
    )
    expect(status.success?).to be(true), output
    output
  end

  it "writes production request summaries as JSON without query secrets or health checks" do
    output = expect_run_in("production", <<~RUBY)
      require "rack/mock"
      request = Rack::MockRequest.new(Rails.application)
      request.get("/up", "HTTP_HOST" => "example.com")
      request.post("/demo/fetch?password=secret-marker", "HTTP_HOST" => "example.com",
        "HTTP_X_REQUEST_ID" => "logging-check")
      raise "development inbox leaked" if Rails.application.routes.routes.any? { |route| route.path.spec.to_s.include?("letter_opener") }
    RUBY
    logs = output.lines.filter_map do |line|
      JSON.parse(line)
    rescue JSON::ParserError
      nil
    end
    expect(logs).to include(hash_including("method" => "POST", "path" => "/demo/fetch", "request_id" => "logging-check"))
    expect(logs).not_to include(hash_including("path" => "/up"))
    expect(output).not_to include("secret-marker")
  end

  it "delivers development mail to a local inbox without launching a browser" do
    expect_run_in("development", <<~RUBY)
      require "tmpdir"
      raise "wrong delivery method" unless ActionMailer::Base.delivery_method == :letter_opener_web
      raise "missing inbox route" unless Rails.application.routes.routes.any? { |route| route.path.spec.to_s.include?("letter_opener") }
      Dir.mktmpdir("mail-check") do |directory|
        ActionMailer::Base.letter_opener_web_settings = { location: directory }
        ActionMailer::Base.mail(from: "sender@example.test", to: "receiver@example.test",
          subject: "Local delivery", body: "mail-check-marker").deliver_now
        raise "missing local mail" unless Dir.glob(File.join(directory, "**", "*.html")).any? { |path| File.read(path).include?("mail-check-marker") }
      end
    RUBY
  end
end
