# frozen_string_literal: true

# == Schema Information
#
# Table name: login_codes
#
#  id         :integer          not null, primary key
#  code       :string           not null
#  expires_at :datetime         not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  user_id    :integer          not null
#
# Indexes
#
#  index_login_codes_on_code     (code) UNIQUE
#  index_login_codes_on_user_id  (user_id)
#
# Foreign Keys
#
#  user_id  (user_id => users.id)
#
class LoginCode < ApplicationRecord
  belongs_to :user

  validates :code, presence: true, uniqueness: true
  validates :expires_at, presence: true

  scope :active, -> { where("expires_at > ?", Time.current) }

  # Atomically finds and consumes a code, returning the associated user
  # (or nil if the code is missing/expired/already used). The lock + destroy
  # inside a single transaction is what closes the read-then-delete race a
  # naive cache-based implementation would have: two concurrent redemptions
  # can't both win.
  def self.redeem(code)
    return nil if code.blank?

    transaction do
      login_code = active.lock.find_by(code: code)
      next nil unless login_code

      login_code.destroy!
      login_code.user
    end
  end
end
