# frozen_string_literal: true

# Squashed schema: users/devise (incl. lockable), RBAC (roles/permissions),
# items, login_codes, paper_trail versions, auth_events, and Active Storage.
# UUID primary keys throughout (see config.generators.orm primary_key_type
# in config/application.rb).
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
      t.integer :failed_attempts, default: 0, null: false
      t.string :unlock_token
      t.datetime :locked_at

      t.timestamps null: false
    end
    add_index :users, :email, unique: true
    add_index :users, :reset_password_token, unique: true
    add_index :users, [ :provider, :uid ], unique: true
    add_index :users, :jti, unique: true
    add_index :users, :unlock_token, unique: true

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
      t.references :user, null: false, foreign_key: true, type: :uuid, index: false
      t.references :role, null: false, foreign_key: true, type: :uuid
      t.timestamps
    end
    add_index :user_roles, [ :user_id, :role_id ], unique: true

    create_table :role_permissions, id: :uuid do |t|
      t.references :role, null: false, foreign_key: true, type: :uuid, index: false
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

    create_table :auth_events, id: :uuid do |t|
      t.references :user, foreign_key: { on_delete: :nullify }, type: :uuid
      t.string :email
      t.integer :event_type, null: false
      t.string :ip_address
      t.string :user_agent
      t.datetime :created_at, null: false
    end
    add_index :auth_events, :event_type
    add_index :auth_events, :created_at

    # This migration comes from active_storage (originally 20170806125915)
    create_table :active_storage_blobs, id: :uuid do |t|
      t.string   :key,          null: false
      t.string   :filename,     null: false
      t.string   :content_type
      t.text     :metadata
      t.string   :service_name, null: false
      t.bigint   :byte_size,    null: false
      t.string   :checksum
      t.datetime :created_at, precision: 6, null: false

      t.index [ :key ], unique: true
    end

    create_table :active_storage_attachments, id: :uuid do |t|
      t.string     :name,     null: false
      t.references :record,   null: false, polymorphic: true, index: false, type: :uuid
      t.references :blob,     null: false, type: :uuid

      t.datetime :created_at, precision: 6, null: false

      t.index [ :record_type, :record_id, :name, :blob_id ], name: :index_active_storage_attachments_uniqueness, unique: true
      t.foreign_key :active_storage_blobs, column: :blob_id
    end

    create_table :active_storage_variant_records, id: :uuid do |t|
      t.belongs_to :blob, null: false, index: false, type: :uuid
      t.string :variation_digest, null: false

      t.index [ :blob_id, :variation_digest ], name: :index_active_storage_variant_records_uniqueness, unique: true
      t.foreign_key :active_storage_blobs, column: :blob_id
    end
  end
end
