# frozen_string_literal: true

require "rails_helper"

# == Schema Information
#
# Table name: users
# Database name: primary
#
#  id                     :uuid             not null, primary key
#  avatar_url             :string
#  email                  :string           default(""), not null
#  encrypted_password     :string           default(""), not null
#  failed_attempts        :integer          default(0), not null
#  jti                    :string           not null
#  locked_at              :datetime
#  name                   :string
#  provider               :string
#  remember_created_at    :datetime
#  reset_password_sent_at :datetime
#  reset_password_token   :string
#  uid                    :string
#  unlock_token           :string
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#
# Indexes
#
#  index_users_on_email                 (email) UNIQUE
#  index_users_on_jti                   (jti) UNIQUE
#  index_users_on_provider_and_uid      (provider,uid) UNIQUE
#  index_users_on_reset_password_token  (reset_password_token) UNIQUE
#  index_users_on_unlock_token          (unlock_token) UNIQUE
#
RSpec.describe UserSerializer, type: :serializer do
  fixtures :users, :items

  it "includes createdAt" do
    hash = described_class.new(users(:one)).serializable_hash

    expect(hash["createdAt"]).to eq(users(:one).created_at)
  end

  it "serializes a nil name" do
    user = User.create!(email: "no-items@example.com", password: "password123", name: nil)

    hash = described_class.new(user).serializable_hash

    expect(hash["name"]).to be_nil
  end
end
