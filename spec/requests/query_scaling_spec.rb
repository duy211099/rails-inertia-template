# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Listing query growth", type: :request do
  fixtures :users, :items

  before do
    Item.unscoped.delete_all
    PaperTrail::Version.delete_all
    sign_in users(:one)
  end

  context "with more items", :n_plus_one do
    # Consume Devise's sign-in shortcut before measuring ordinary requests.
    warmup { get items_path, headers: { "X-Inertia" => "true", "X-Inertia-Version" => ViteRuby.digest } }

    populate do |count|
      count.times { |number| users(:one).items.create!(name: "Item #{number}") }
    end

    it "keeps database reads constant as the returned collection grows" do
      expect do
        get items_path, headers: { "X-Inertia" => "true", "X-Inertia-Version" => ViteRuby.digest }
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body.dig("props", "items").length).to eq(current_scale)
      end.to perform_constant_number_of_queries.with_scale_factors(2, 5)
    end
  end

  context "with more audit records", :n_plus_one do
    warmup { get versions_path, headers: { "X-Inertia" => "true", "X-Inertia-Version" => ViteRuby.digest } }

    populate do |count|
      count.times do |number|
        PaperTrail::Version.create!(item_type: "Item", item_id: number + 1,
          event: "create", whodunnit: users(:one).id.to_s)
      end
    end

    it "keeps database reads constant as the returned collection grows" do
      expect do
        get versions_path, headers: { "X-Inertia" => "true", "X-Inertia-Version" => ViteRuby.digest }
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body.dig("props", "versions").length).to eq(current_scale)
      end.to perform_constant_number_of_queries.with_scale_factors(2, 5)
    end
  end
end
