# frozen_string_literal: true

# Extends ActiveStorage::Blob after Rails has fully loaded it. Reopening
# this class from app/models/active_storage/blob.rb would race Zeitwerk:
# the app file would be treated as the constant's defining source and
# shadow the engine's own class body (no ActiveRecord::Base superclass).
Rails.application.config.to_prepare do
  ActiveStorage::Blob.class_eval do
    after_create_commit :enqueue_virus_scan

    def clean?
      metadata["virus_scan"] == "clean"
    end

    def infected?
      metadata["virus_scan"] == "infected"
    end

    private

    def enqueue_virus_scan
      VirusScanJob.perform_later(id)
    end
  end
end
