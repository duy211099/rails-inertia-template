# frozen_string_literal: true

require "spec_helper"
require "open3"
require "tmpdir"
require "fileutils"

RSpec.describe "Generated type verification" do
  it "accepts the checked-in generated types" do
    output, status = Open3.capture2e({ "RAILS_ENV" => "test" }, "bin/check-types")
    expect(status.success?).to be(true), output
  end

  it "rejects changed, missing and extra files without rewriting them" do
    Dir.mktmpdir("stale-types-") do |directory|
      FileUtils.cp_r("app/frontend/types/serializers/.", directory)
      File.write(File.join(directory, "Item.ts"), "stale")
      File.unlink(File.join(directory, "User.ts"))
      File.write(File.join(directory, "Unexpected.ts"), "obsolete")
      output, status = Open3.capture2e({ "RAILS_ENV" => "test" }, "bin/check-types", directory)
      expect(status.exitstatus).to eq(1)
      expect(output).to include("Item.ts", "User.ts", "Unexpected.ts", "npm run generate:types")
      expect(File.read(File.join(directory, "Item.ts"))).to eq("stale")
      expect(File.exist?(File.join(directory, "User.ts"))).to be(false)
    end
  end
end
