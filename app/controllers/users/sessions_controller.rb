# frozen_string_literal: true

class Users::SessionsController < Devise::SessionsController
  def new
    render inertia: "auth/login"
  end

  def destroy
    signed_out = (Devise.sign_out_all_scopes ? sign_out : sign_out(resource_name))
    flash[:notice] = I18n.t("devise.sessions.signed_out") if signed_out
    redirect_to root_path
  end
end
