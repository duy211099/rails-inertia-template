# frozen_string_literal: true

# == Schema Information
#
# Table name: role_permissions
#
#  id            :integer          not null, primary key
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  permission_id :integer          not null
#  role_id       :integer          not null
#
# Indexes
#
#  index_role_permissions_on_permission_id              (permission_id)
#  index_role_permissions_on_role_id                    (role_id)
#  index_role_permissions_on_role_id_and_permission_id  (role_id,permission_id) UNIQUE
#
# Foreign Keys
#
#  permission_id  (permission_id => permissions.id)
#  role_id        (role_id => roles.id)
#
class RolePermission < ApplicationRecord
  belongs_to :role, touch: true
  belongs_to :permission
end
