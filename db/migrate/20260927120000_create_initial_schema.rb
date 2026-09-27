# frozen_string_literal: true

# Squashed schema: users/devise, RBAC (roles/permissions), items, login_codes,
# and paper_trail versions. UUID primary keys throughout (see
# config.generators.orm primary_key_type in config/application.rb).
class CreateInitialSchema < ActiveRecord::Migration[8.1]
  # The largest text column available in all supported RDBMS is
  # 1024^3 - 1 bytes, roughly one gibibyte.
  VERSION_OBJECT_TEXT_BYTES = 1_073_741_823

  def change
    create_table :users, id: :uuid do |t|
      t.string :email, null: false, default: ""
      t.string :encrypted_password, null: false, default: ""
      t.string :reset_password_token
      t.datetime :reset_password_sent_at
      t.datetime :remember_created_at
      t.string :provider
      t.string :uid
      t.string :name
      t.string :avatar_url
      t.string :jti, null: false

      t.timestamps null: false
    end
    add_index :users, :email, unique: true
    add_index :users, :reset_password_token, unique: true
    add_index :users, [ :provider, :uid ], unique: true
    add_index :users, :jti, unique: true

    create_table :roles, id: :uuid do |t|
      t.string :name, null: false
      t.timestamps
    end
    add_index :roles, :name, unique: true

    create_table :permissions, id: :uuid do |t|
      t.string :name, null: false
      t.timestamps
    end
    add_index :permissions, :name, unique: true

    create_table :user_roles, id: :uuid do |t|
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.references :role, null: false, foreign_key: true, type: :uuid
      t.timestamps
    end
    add_index :user_roles, [ :user_id, :role_id ], unique: true

    create_table :role_permissions, id: :uuid do |t|
      t.references :role, null: false, foreign_key: true, type: :uuid
      t.references :permission, null: false, foreign_key: true, type: :uuid
      t.timestamps
    end
    add_index :role_permissions, [ :role_id, :permission_id ], unique: true

    create_table :items, id: :uuid do |t|
      t.string :name, null: false
      t.text :description
      t.string :phone_number
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.datetime :discarded_at

      t.timestamps
    end
    add_index :items, :discarded_at

    create_table :login_codes, id: :uuid do |t|
      t.string :code, null: false
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.datetime :expires_at, null: false

      t.timestamps
    end
    add_index :login_codes, :code, unique: true

    create_table :versions, id: :uuid do |t|
      t.string :whodunnit
      t.datetime :created_at
      t.uuid :item_id, null: false
      t.string :item_type, null: false
      t.string :event, null: false
      t.text :object, limit: VERSION_OBJECT_TEXT_BYTES
      t.text :object_changes
    end
    add_index :versions, %i[item_type item_id]
  end
end
