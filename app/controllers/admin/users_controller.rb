# frozen_string_literal: true

class Admin::UsersController < AdminController
  def index
    authorize! User, with: UserPolicy

    scope = User.order(created_at: :desc)
    if params[:q].present?
      scope = scope.where("name ILIKE :q OR email ILIKE :q", q: "%#{params[:q]}%")
    end

    pagy, users = pagy(scope)

    render inertia: "admin/users/index", props: UsersIndexResource.new(
      { users: users, pagy: pagy }
    ).to_inertia.merge(q: params[:q])
  end

  def show
    user = User.find(params[:id])
    authorize! user, with: UserPolicy

    render inertia: "admin/users/show", props: { user: UserSerializer.new(user) }
  end
end
