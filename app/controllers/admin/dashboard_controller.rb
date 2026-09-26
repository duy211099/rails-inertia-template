# frozen_string_literal: true

class Admin::DashboardController < AdminController
  def index
    authorize! Item
    items = authorized_scope(Item.all).order(created_at: :desc)
    pagy, paginated_items = pagy(items)

    render inertia: "admin/dashboard", props: ItemsIndexResource.new(
      { items: paginated_items, pagy: pagy }
    ).to_inertia
  end
end
