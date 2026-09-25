# frozen_string_literal: true

class ApiDocsController < ApplicationController
  before_action :authenticate_user!
  before_action :no_store
  layout false

  def index
  end

  def openapi
    render json: YAML.safe_load_file(Rails.root.join("docs/openapi.yml"))
  end
end
