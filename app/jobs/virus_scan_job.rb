# frozen_string_literal: true

class VirusScanJob < ApplicationJob
  queue_as :default

  def perform(blob_id)
    blob = ActiveStorage::Blob.find_by(id: blob_id)
    return unless blob

    blob.open do |file|
      if Clamby.virus?(file.path)
        blob.update!(metadata: blob.metadata.merge("virus_scan" => "infected"))
        blob.purge
      else
        blob.update!(metadata: blob.metadata.merge("virus_scan" => "clean"))
      end
    end
  end
end
