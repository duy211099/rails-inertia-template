# frozen_string_literal: true

class CreateItems < ActiveRecord::Migration[8.1]
  def change
    create_table :items do |t|
      t.string :name, null: false
      t.text :description
      t.string :phone_number
      t.references :user, null: false, foreign_key: true
      t.datetime :discarded_at

      t.timestamps
    end

    add_index :items, :discarded_at
  end
end
