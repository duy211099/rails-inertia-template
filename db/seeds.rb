# frozen_string_literal: true

# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

admin_role = Role.find_or_create_by!(name: "admin")
Role.find_or_create_by!(name: "dev")
Role.find_or_create_by!(name: "member")

manage_items = Permission.find_or_create_by!(name: "manage_items")
manage_users = Permission.find_or_create_by!(name: "manage_users")

[ manage_items, manage_users ].each do |permission|
  RolePermission.find_or_create_by!(role: admin_role, permission: permission)
end
