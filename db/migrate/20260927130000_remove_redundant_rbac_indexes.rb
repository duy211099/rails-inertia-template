# frozen_string_literal: true

# index_user_roles_on_user_id_and_role_id and
# index_role_permissions_on_role_id_and_permission_id already serve lookups
# on their leftmost column, making these single-column indexes redundant.
class RemoveRedundantRbacIndexes < ActiveRecord::Migration[8.1]
  def change
    remove_index :user_roles, :user_id
    remove_index :role_permissions, :role_id
  end
end
