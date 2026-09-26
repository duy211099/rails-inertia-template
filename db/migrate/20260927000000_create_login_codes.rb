# frozen_string_literal: true

class CreateLoginCodes < ActiveRecord::Migration[8.1]
  def change
    create_table :login_codes do |t|
      t.string :code, null: false
      t.references :user, null: false, foreign_key: true
      t.datetime :expires_at, null: false

      t.timestamps
    end

    add_index :login_codes, :code, unique: true
  end
end
