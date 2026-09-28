# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Active Record encryption", type: :model do
  it "encrypts and decrypts a message using the configured keys" do
    message = ActiveRecord::Encryption.encryptor.encrypt("sensitive value")

    expect(message).not_to eq("sensitive value")
    expect(ActiveRecord::Encryption.encryptor.decrypt(message)).to eq("sensitive value")
  end
end
