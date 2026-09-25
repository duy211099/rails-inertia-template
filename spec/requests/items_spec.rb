# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Items", type: :request do
  fixtures :users, :items

  context "without authentication" do
    it "redirects the index to sign in" do
      get items_path
      expect(response).to redirect_to(new_user_session_path)
    end

    it "redirects the new form to sign in" do
      get new_item_path
      expect(response).to redirect_to(new_user_session_path)
    end

    it "rejects item creation" do
      expect { post items_path, params: { item: { name: "New" } } }.not_to change(Item, :count)
      expect(response).to redirect_to(new_user_session_path)
    end
  end

  context "when signed in" do
    before { sign_in users(:one) }

    it "renders only the current user's kept items" do
      items(:two).discard!
      get items_path, headers: { "X-Inertia" => "true", "X-Inertia-Version" => ViteRuby.digest }
      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["component"]).to eq("items/index")
      expect(body.dig("props", "items").map { |item| item["id"] }).to eq([ items(:one).id ])
    end

    it "renders the new form" do
      get new_item_path
      expect(response).to have_http_status(:ok)
    end

    it "creates an item owned by the signed-in user" do
      expect do
        post items_path, params: { item: { name: "New Item", description: "Details", phone_number: "123", user_id: users(:two).id } }
      end.to change(Item, :count).by(1)
      expect(Item.order(:id).last).to have_attributes(name: "New Item", description: "Details", phone_number: "123", user_id: users(:one).id)
      expect(response).to redirect_to(items_path)
    end

    it "rejects creation with a blank name" do
      expect { post items_path, params: { item: { name: "" } } }.not_to change(Item, :count)
      expect(response).to redirect_to(new_item_path)
    end

    it "shows an owned item" do
      get item_path(items(:one))
      expect(response).to have_http_status(:ok)
    end

    it "renders the edit form for an owned item" do
      get edit_item_path(items(:one))
      expect(response).to have_http_status(:ok)
    end

    it "updates an owned item" do
      patch item_path(items(:one)), params: { item: { name: "Updated" } }
      expect(response).to redirect_to(items_path)
      expect(items(:one).reload.name).to eq("Updated")
    end

    it "keeps the original data when an update is invalid" do
      original = items(:one).name
      patch item_path(items(:one)), params: { item: { name: "" } }
      expect(response).to redirect_to(edit_item_path(items(:one)))
      expect(items(:one).reload.name).to eq(original)
    end

    it "soft-deletes an owned item" do
      expect { delete item_path(items(:one)) }.to change(Item, :count).by(-1)
      expect(response).to redirect_to(items_path)
      expect(Item.unscoped.find(items(:one).id)).to be_discarded
    end

    it "cannot show another user's item" do
      get item_path(items(:three))
      expect(response).to have_http_status(:not_found)
    end

    it "cannot edit another user's item" do
      get edit_item_path(items(:three))
      expect(response).to have_http_status(:not_found)
    end

    it "cannot update another user's item" do
      original = items(:three).name
      patch item_path(items(:three)), params: { item: { name: "Hacked" } }
      expect(response).to have_http_status(:not_found)
      expect(items(:three).reload.name).to eq(original)
    end

    it "cannot delete another user's item" do
      expect { delete item_path(items(:three)) }.not_to change(Item, :count)
      expect(response).to have_http_status(:not_found)
      expect(items(:three).reload).to be_kept
    end

    it "cannot show a discarded item" do
      items(:one).discard!
      get item_path(items(:one))
      expect(response).to have_http_status(:not_found)
    end
  end
end
