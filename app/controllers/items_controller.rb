# frozen_string_literal: true

class ItemsController < InertiaController
  before_action :authenticate_user!
  before_action :set_item, only: %i[show edit update destroy]

  def index
    items = current_user.items.order(created_at: :desc)
    render inertia: "items/index", props: {
      items: ItemSerializer.many(items)
    }
  end

  def show
    render inertia: "items/show", props: {
      item: ItemSerializer.one(@item)
    }
  end

  def new
    render inertia: "items/new"
  end

  def create
    @item = current_user.items.build(item_params)

    if @item.save
      redirect_to items_path, notice: "Item was successfully created."
    else
      redirect_to new_item_path, inertia: { errors: @item.errors.to_hash }
    end
  end

  def edit
    render inertia: "items/edit", props: {
      item: ItemSerializer.one(@item)
    }
  end

  def update
    if @item.update(item_params)
      redirect_to items_path, notice: "Item was successfully updated."
    else
      redirect_to edit_item_path(@item), inertia: { errors: @item.errors.to_hash }
    end
  end

  def destroy
    @item.destroy
    redirect_to items_path, notice: "Item was successfully deleted."
  end

  private

  def set_item
    @item = current_user.items.find(params[:id])
  end

  def item_params
    params.require(:item).permit(:name, :description)
  end
end
