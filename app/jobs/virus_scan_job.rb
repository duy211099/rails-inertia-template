# frozen_string_literal: true

class VirusScanJob < ApplicationJob
  queue_as :default

  # after_create_commit fires before the file itself finishes uploading
  # (create_and_upload!'s post-create upload step, has_one_attached's
  # after_commit upload, and direct uploads all leave a window where the
  # blob row exists but the file doesn't yet) — retry rather than lose the
  # scan.
  retry_on ActiveStorage::FileNotFoundError, wait: :polynomially_longer, attempts: 5
  retry_on Clamby::ClamscanClientError, wait: :polynomially_longer, attempts: 5

  def perform(blob_id)
    blob = ActiveStorage::Blob.find_by(id: blob_id)
    return unless blob

    blob.open do |file|
      if Clamby.virus?(file.path)
        # Blob#purge no-ops (via before_destroy raising InvalidForeignKey,
        # rescued silently) while an attachment still references it, so an
        # infected file attached to a record would otherwise survive.
        blob.attachments.destroy_all
        blob.purge
      else
        blob.update!(metadata: blob.metadata.merge("virus_scan" => "clean"))
      end
    end
  end
end
