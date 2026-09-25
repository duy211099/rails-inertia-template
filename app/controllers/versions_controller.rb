# frozen_string_literal: true

class VersionsController < InertiaController
  before_action :authenticate_user!

  def index
    pagy, paginated_versions = pagy(current_user.versions)

    render inertia: "versions/index", props: VersionsIndexResource.new(
      { versions: paginated_versions, pagy: pagy }
    ).to_inertia
  end
end
