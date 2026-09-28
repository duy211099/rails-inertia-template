# frozen_string_literal: true

class ValidateNullifyAuthEventsUserFk < ActiveRecord::Migration[8.1]
  def change
    validate_foreign_key :auth_events, :users
  end
end
