# frozen_string_literal: true

class AddJtiToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :jti, :string

    reversible do |dir|
      dir.up do
        User.reset_column_information
        User.find_each { |user| user.update_column(:jti, SecureRandom.uuid) }
      end
    end

    change_column_null :users, :jti, false
    add_index :users, :jti, unique: true
  end
end
