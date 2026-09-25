# frozen_string_literal: true

class ItemsController < InertiaController
  before_action :authenticate_user!
  before_action :set_item, only: %i[show edit update destroy]

  def index
    authorize! Item
    items = authorized_scope(Item.all).order(created_at: :desc)
    pagy, paginated_items = pagy(items)

    render inertia: "items/index", props: ItemsIndexResource.new(
      { items: paginated_items, pagy: pagy }
    ).to_inertia
  end

  def show
    authorize! @item
    render inertia: "items/show", props: {
      item: ItemSerializer.new(@item).serializable_hash
    }
  end

  def new
    authorize! Item, to: :create?
    render inertia: "items/new"
  end

  def create
    @item = current_user.items.build(item_params)
    authorize! @item

    if @item.save
      redirect_to items_path, notice: I18n.t("items.notices.created")
    else
      redirect_to new_item_path, inertia: { errors: @item.errors.to_hash }
    end
  end

  def edit
    authorize! @item
    render inertia: "items/edit", props: {
      item: ItemSerializer.new(@item).serializable_hash
    }
  end

  def update
    authorize! @item
    if @item.update(item_params)
      redirect_to items_path, notice: I18n.t("items.notices.updated")
    else
      redirect_to edit_item_path(@item), inertia: { errors: @item.errors.to_hash }
    end
  end

  def destroy
    authorize! @item
    @item.discard
    redirect_to items_path, notice: I18n.t("items.notices.destroyed")
  end

  private

  def set_item
    @item = current_user.items.find(params[:id])
  end

  def item_params
    params.require(:item).permit(:name, :description, :phone_number)
  end
end
