# frozen_string_literal: true

class UserSerializer < BaseSerializer
  object_as :user, model: "User"

  attributes :id, :name, :email, :avatar_url
end
