# frozen_string_literal: true

module Api
  module V1
    class ItemsController < BaseController
      before_action :set_item, only: %i[show update destroy]

      def index
        authorize! Item
        page = positive_integer_parameter(:page, 1)
        limit = [ positive_integer_parameter(:limit, 12), 100 ].min
        pagination, items = pagy(authorized_scope(Item.all).order(created_at: :desc, id: :desc), page: page, limit: limit)
        render json: {
          items: ItemSerializer.new(items).serializable_hash,
          pagy: PagySerializer.new(pagination).serializable_hash
        }
      end

      def show
        authorize! @item
        render json: { item: ItemSerializer.new(@item).serializable_hash }
      end

      def create
        @item = current_user.items.build(item_params)
        authorize! @item
        if @item.save
          render json: { item: ItemSerializer.new(@item).serializable_hash },
            status: :created, location: api_v1_item_url(@item)
        else
          render_validation_errors
        end
      end

      def update
        authorize! @item
        if @item.update(item_params)
          render json: { item: ItemSerializer.new(@item).serializable_hash }
        else
          render_validation_errors
        end
      end

      def destroy
        authorize! @item
        @item.discard!
        head :no_content
      end

      private

      def set_item
        @item = authorized_scope(Item.all).find(params[:id])
      end

      def item_params
        params.expect(item: [ :name, :description, :phone_number ])
      end

      def positive_integer_parameter(key, default)
        value = params.fetch(key, default).to_s
        raise ActionController::ParameterMissing, key unless value.match?(/\A[1-9]\d{0,8}\z/)

        value.to_i
      end

      def render_validation_errors
        render_error :validation_failed, "api.v1.errors.validation_failed", :unprocessable_content, details: @item.errors.to_hash
      end
    end
  end
end
