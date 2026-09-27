# frozen_string_literal: true

class RemoveRoleFromUsers < ActiveRecord::Migration[8.1]
  def change
    safety_assured { remove_column :users, :role, :integer, default: 0, null: false }
  end
end
