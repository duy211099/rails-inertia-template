# frozen_string_literal: true

class Admin::UsersController < AdminController
  SORTABLE_COLUMNS = %w[name email created_at].freeze

  def index
    authorize! User, with: UserPolicy

    scope = User.order(sort_column => sort_direction)
    if params[:q].present?
      scope = scope.where("name ILIKE :q OR email ILIKE :q", q: "%#{params[:q]}%")
    end
    if params[:role].present?
      scope = scope.joins(:roles).where(roles: { name: Array(params[:role]) }).distinct
    end

    pagy, users = pagy(scope)

    render inertia: "admin/users/index", props: UsersIndexResource.new(
      { users: users, pagy: pagy }
    ).to_inertia.merge(
      q: params[:q],
      role: Array(params[:role]),
      sort: SORTABLE_COLUMNS.include?(params[:sort]) ? params[:sort] : nil,
      direction: params[:direction] == "desc" ? "desc" : "asc"
    )
  end

  def show
    user = User.find(params[:id])
    authorize! user, with: UserPolicy

    render inertia: "admin/users/show", props: { user: UserSerializer.new(user) }
  end

  private

  def sort_column
    SORTABLE_COLUMNS.include?(params[:sort]) ? params[:sort] : "created_at"
  end

  def sort_direction
    params[:direction] == "asc" ? :asc : :desc
  end
end
