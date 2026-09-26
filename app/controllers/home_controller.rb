# frozen_string_literal: true

class HomeController < InertiaController
  def index
    render inertia: "home/index"
  end
end
