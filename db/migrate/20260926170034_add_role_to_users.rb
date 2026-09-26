# frozen_string_literal: true

class AddRoleToUsers < ActiveRecord::Migration[8.1]
  def change
    # Table is small (auth users, not a high-volume domain table), so the
    # single-statement add_column+default+not-null strong_migrations warns
    # about isn't a real risk here.
    safety_assured { add_column :users, :role, :integer, default: 0, null: false }
  end
end
