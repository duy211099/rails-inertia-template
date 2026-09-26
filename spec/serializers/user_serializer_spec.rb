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
RSpec.describe UserSerializer do
  fixtures :users

  it "exposes the public profile with camelCase keys and no authentication secrets" do
    user = users(:one)
    user.avatar_url = "https://example.com/avatar.png"
    result = described_class.new(user).serializable_hash.stringify_keys
    expect(result).to eq("id" => user.id, "name" => "User One", "email" => "user_one@example.com", "avatarUrl" => "https://example.com/avatar.png")
  end
end
