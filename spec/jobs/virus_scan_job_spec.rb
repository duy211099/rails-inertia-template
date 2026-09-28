# frozen_string_literal: true

require "rails_helper"

RSpec.describe VirusScanJob, type: :job do
  fixtures :users

  def create_blob
    ActiveStorage::Blob.create_and_upload!(
      io: StringIO.new("hello world"),
      filename: "test.txt",
      content_type: "text/plain"
    )
  end

  it "marks a clean file as scanned and clean" do
    allow(Clamby).to receive(:virus?).and_return(false)
    blob = create_blob

    described_class.new.perform(blob.id)

    expect(blob.reload.metadata["virus_scan"]).to eq("clean")
    expect(blob).to be_clean
  end

  it "purges an infected file instead of leaving it downloadable" do
    allow(Clamby).to receive(:virus?).and_return(true)
    blob = create_blob

    described_class.new.perform(blob.id)

    expect(ActiveStorage::Blob.exists?(blob.id)).to be(false)
  end

  it "does nothing if the blob was already deleted before the job ran" do
    expect { described_class.new.perform(SecureRandom.uuid) }.not_to raise_error
  end

  it "retries when the underlying file hasn't finished uploading yet (e.g. direct uploads)" do
    handler = described_class.rescue_handlers.find { |klass, _| klass == "ActiveStorage::FileNotFoundError" }
    expect(handler).not_to be_nil
  end

  it "retries on a scanner client error instead of treating it as an infection" do
    handler = described_class.rescue_handlers.find { |klass, _| klass == "Clamby::ClamscanClientError" }
    expect(handler).not_to be_nil
  end

  it "does not lose metadata written concurrently by ActiveStorage's own analyze job" do
    blob = create_blob
    allow(Clamby).to receive(:virus?) do
      # Simulates AnalyzeJob (or anything else) committing a metadata
      # change between this job's initial load and its own write.
      concurrent = ActiveStorage::Blob.find(blob.id)
      concurrent.update_columns(metadata: concurrent.metadata.merge("analyzed" => true))
      false
    end

    described_class.new.perform(blob.id)

    reloaded = blob.reload.metadata
    expect(reloaded["virus_scan"]).to eq("clean")
    expect(reloaded["analyzed"]).to be(true)
  end

  it "destroys attachments so an infected file already attached to a record can't be served" do
    allow(Clamby).to receive(:virus?).and_return(true)
    blob = create_blob
    ActiveStorage::Attachment.create!(name: "test", record: users(:one), blob: blob)

    described_class.new.perform(blob.id)

    expect(ActiveStorage::Blob.exists?(blob.id)).to be(false)
    expect(ActiveStorage::Attachment.where(record: users(:one)).exists?).to be(false)
  end
end
