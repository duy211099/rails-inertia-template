# frozen_string_literal: true

class AuthEvent < ApplicationRecord
  belongs_to :user, optional: true

  enum :event_type, { success: 0, failure: 1 }

  # A failed login's email is whatever the client submitted in that field —
  # sometimes a password mistakenly typed into it. Only persist values
  # shaped like an email, so a plaintext secret never lands in the audit
  # trail.
  before_validation :discard_unless_email_shaped

  private

  def discard_unless_email_shaped
    self.email = nil if email.present? && !email.match?(URI::MailTo::EMAIL_REGEXP)
  end
end
