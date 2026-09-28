# frozen_string_literal: true

class AuthEvent < ApplicationRecord
  belongs_to :user, optional: true

  enum :event_type, { success: 0, failure: 1 }
end
