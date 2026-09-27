# frozen_string_literal: true

class BackfillRolesAndPermissions < ActiveRecord::Migration[8.1]
  class MigrationRole < ApplicationRecord
    self.table_name = "roles"
  end

  class MigrationPermission < ApplicationRecord
    self.table_name = "permissions"
  end

  class MigrationUser < ApplicationRecord
    self.table_name = "users"
  end

  def up
    safety_assured do
      admin_role = MigrationRole.find_or_create_by!(name: "admin")
      member_role = MigrationRole.find_or_create_by!(name: "member")

      manage_items = MigrationPermission.find_or_create_by!(name: "manage_items")
      manage_users = MigrationPermission.find_or_create_by!(name: "manage_users")

      [ manage_items, manage_users ].each do |permission|
        execute <<~SQL
          INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
          VALUES (#{admin_role.id}, #{permission.id}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT DO NOTHING
        SQL
      end

      MigrationUser.find_each do |user|
        role = user.role == 1 ? admin_role : member_role
        execute <<~SQL
          INSERT INTO user_roles (user_id, role_id, created_at, updated_at)
          VALUES (#{user.id}, #{role.id}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT DO NOTHING
        SQL
      end
    end
  end

  def down
    safety_assured do
      execute "DELETE FROM user_roles"
      execute "DELETE FROM role_permissions"
    end
  end
end
