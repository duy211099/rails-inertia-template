# frozen_string_literal: true

class AdminController < ApplicationController
  before_action :authenticate_admin!

  private

  def authenticate_admin!
    authenticate_user!
    # Add your admin check here, for example:
    # redirect_to root_path, alert: "Access denied" unless current_user.admin?
  end
end
