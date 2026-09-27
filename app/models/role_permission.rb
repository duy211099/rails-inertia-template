# frozen_string_literal: true

# == Schema Information
#
# Table name: role_permissions
# Database name: primary
#
#  id            :uuid             not null, primary key
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  permission_id :uuid             not null
#  role_id       :uuid             not null
#
# Indexes
#
#  index_role_permissions_on_permission_id              (permission_id)
#  index_role_permissions_on_role_id_and_permission_id  (role_id,permission_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (permission_id => permissions.id)
#  fk_rails_...  (role_id => roles.id)
#
class RolePermission < ApplicationRecord
  belongs_to :role, touch: true
  belongs_to :permission

  validates :permission_id, uniqueness: { scope: :role_id }
end
