# frozen_string_literal: true

class VersionsController < InertiaController
  before_action :authenticate_user!

  def index
    versions = PaperTrail::Version
      .where(whodunnit: current_user.id.to_s)
      .order(created_at: :desc)

    pagy, paginated_versions = pagy(versions)

    render inertia: "versions/index", props: VersionsIndexResource.new(
      { versions: paginated_versions, pagy: pagy }
    ).to_inertia
  end
end
