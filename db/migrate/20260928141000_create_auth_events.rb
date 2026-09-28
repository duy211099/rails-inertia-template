# frozen_string_literal: true

class CreateAuthEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :auth_events, id: :uuid do |t|
      t.references :user, foreign_key: true, type: :uuid
      t.string :email
      t.integer :event_type, null: false
      t.string :ip_address
      t.string :user_agent
      t.datetime :created_at, null: false
    end
    add_index :auth_events, :event_type
    add_index :auth_events, :created_at
  end
end
