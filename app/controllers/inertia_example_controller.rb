# frozen_string_literal: true

class InertiaExampleController < InertiaController
  def index
    recent_items = if user_signed_in?
      current_user.items.order(created_at: :desc).limit(5)
    else
      []
    end

    render inertia: {
      rails_version: Rails.version,
      ruby_version: RUBY_DESCRIPTION,
      rack_version: Rack.release,
      inertia_rails_version: InertiaRails::VERSION,
      recent_items: ItemSerializer.many(recent_items)
    }
  end

  def demo
    render inertia: {}
  end

  def create
    flash[:notice] = "POST request successful! Toast triggered from backend."
    redirect_to controller: "inertia_example", action: "demo"
  end
end
