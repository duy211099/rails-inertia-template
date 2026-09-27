# frozen_string_literal: true

# == Schema Information
#
# Table name: users
# Database name: primary
#
#  id                     :uuid             not null, primary key
#  avatar_url             :string
#  email                  :string           default(""), not null
#  encrypted_password     :string           default(""), not null
#  jti                    :string           not null
#  name                   :string
#  provider               :string
#  remember_created_at    :datetime
#  reset_password_sent_at :datetime
#  reset_password_token   :string
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
class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher

  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :omniauthable, :jwt_authenticatable,
         omniauth_providers: [ :google_oauth2 ], jwt_revocation_strategy: self

  has_many :items, dependent: :destroy
  has_many :login_codes, dependent: :destroy
  has_many :user_roles, dependent: :destroy
  has_many :roles, through: :user_roles

  before_validation :ensure_jti, on: :create
  after_create :assign_default_role

  validates :uid, uniqueness: { scope: :provider }, allow_nil: true
  validates :jti, presence: true, uniqueness: true

  def versions
    PaperTrail::Version.where(whodunnit: id.to_s).order(created_at: :desc)
  end

  def role?(name)
    roles.any? { |r| r.name == name.to_s }
  end

  def at_least?(role_name)
    roles.map(&:level).max.to_i >= Role::LEVELS.fetch(role_name.to_s, 0)
  end

  def self.from_omniauth(provider:, uid:, email:, name:, avatar_url:)
    where(provider: provider, uid: uid).first_or_create do |user|
      user.email = email
      user.password = Devise.friendly_token[0, 20]
      user.name = name
      user.avatar_url = avatar_url
    end
  end

  private

  def ensure_jti
    self.jti ||= SecureRandom.uuid
  end

  def assign_default_role
    user_roles.create!(role: Role.find_or_create_by!(name: "member"))
  end
end
