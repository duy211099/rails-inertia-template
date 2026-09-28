# frozen_string_literal: true

class NullifyAuthEventsUserFkOnDelete < ActiveRecord::Migration[8.1]
  def change
    remove_foreign_key :auth_events, :users
    add_foreign_key :auth_events, :users, on_delete: :nullify, validate: false
  end
end
