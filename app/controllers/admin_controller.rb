# frozen_string_literal: true

class AdminController < InertiaController
  before_action :authenticate_admin!

  private

  def authenticate_admin!
    authenticate_user!
    redirect_to root_path, alert: I18n.t("admin.access_denied") unless current_user.admin?
  end
end
