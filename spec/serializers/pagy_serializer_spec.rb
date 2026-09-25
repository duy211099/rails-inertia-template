# frozen_string_literal: true

require "rails_helper"

RSpec.describe PagySerializer do
  it "preserves the frontend prev key for a middle page" do
    result = described_class.new(Pagy::Offset.new(count: 50, page: 2, limit: 10)).serializable_hash.stringify_keys
    expect(result).to include("count" => 50, "page" => 2, "pages" => 5, "prev" => 1, "next" => 3, "from" => 11, "to" => 20)
    expect(result).not_to have_key("previous")
  end

  it "returns null at pagination boundaries" do
    result = described_class.new(Pagy::Offset.new(count: 1, page: 1, limit: 10)).serializable_hash.stringify_keys
    expect(result).to include("prev" => nil, "next" => nil)
  end
end
