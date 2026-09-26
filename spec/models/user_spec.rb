# frozen_string_literal: true

require "rails_helper"

# == Schema Information
#
# Table name: users
#
#  id                     :integer          not null, primary key
#  avatar_url             :string
#  email                  :string           default(""), not null
#  encrypted_password     :string           default(""), not null
#  jti                    :string           not null
#  name                   :string
#  provider               :string
#  remember_created_at    :datetime
#  reset_password_sent_at :datetime
#  reset_password_token   :string
#  role                   :integer          default(0), not null
#  uid                    :string
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#
# Indexes
#
#  index_users_on_email                 (email) UNIQUE
#  index_users_on_jti                   (jti) UNIQUE
#  index_users_on_provider_and_uid      (provider,uid) UNIQUE
#  index_users_on_reset_password_token  (reset_password_token) UNIQUE
#
RSpec.describe User, type: :model do
  fixtures :users, :items

  describe ".from_omniauth" do
    let(:auth) do
      OmniAuth::AuthHash.new(
        provider: "google_oauth2", uid: "google-123",
        info: { email: "new@example.com", name: "New User", image: "https://example.com/avatar.png" }
      )
    end

    def from_auth(auth)
      described_class.from_omniauth(
        provider: auth.provider, uid: auth.uid,
        email: auth.info.email, name: auth.info.name, avatar_url: auth.info.image
      )
    end

    it "creates an account with the provider identity and profile" do
      expect { from_auth(auth) }.to change(described_class, :count).by(1)
      user = described_class.find_by!(provider: "google_oauth2", uid: "google-123")
      expect(user).to have_attributes(email: "new@example.com", name: "New User", avatar_url: "https://example.com/avatar.png")
      expect(user.encrypted_password).to be_present
    end

    it "reuses the same provider identity without overwriting its profile" do
      existing = from_auth(auth)
      auth.info.name = "Changed upstream"
      returned = nil
      expect { returned = from_auth(auth) }.not_to change(described_class, :count)
      expect(returned).to eq(existing)
      expect(existing.reload.name).to eq("New User")
    end

    it "does not confuse identical IDs from different providers" do
      from_auth(auth)
      auth.provider = "another_provider"
      auth.info.email = "another@example.com"
      expect { from_auth(auth) }.to change(described_class, :count).by(1)
    end

    it "does not silently link an existing email to a new identity" do
      auth.info.email = users(:one).email
      result = nil
      expect { result = from_auth(auth) }.not_to change(described_class, :count)
      expect(result).not_to be_persisted
      expect(result.errors[:email]).to be_present
      expect(users(:one).reload.provider).to be_nil
    end
  end

  it "rejects a duplicate OAuth identity with validation errors" do
    users(:one).update!(provider: "google_oauth2", uid: "shared-id")
    user = users(:two)
    user.assign_attributes(provider: "google_oauth2", uid: "shared-id")
    expect(user).not_to be_valid
    expect(user.errors[:uid]).to include("has already been taken")
  end

  it "requires an email for password authentication" do
    user = users(:one)
    user.email = nil
    expect(user).not_to be_valid
    expect(user.errors[:email]).to include("can't be blank")
  end

  it "destroys owned items without affecting another user's items" do
    owned_ids = users(:one).items.ids
    users(:one).destroy!
    expect(Item.unscoped.where(id: owned_ids)).to be_empty
    expect(Item.exists?(items(:three).id)).to be(true)
  end

  describe "#role" do
    it "defaults new users to member" do
      expect(users(:one)).to be_member
      expect(users(:one)).not_to be_admin
    end

    it "promotes to admin via the enum" do
      users(:one).admin!
      expect(users(:one).reload).to be_admin
    end
  end
end
