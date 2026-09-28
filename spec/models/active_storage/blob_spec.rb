# frozen_string_literal: true

require "rails_helper"

RSpec.describe ActiveStorage::Blob, type: :model do
  it "enqueues a virus scan job after being created" do
    expect {
      described_class.create_and_upload!(io: StringIO.new("x"), filename: "x.txt")
    }.to have_enqueued_job(VirusScanJob)
  end
end
