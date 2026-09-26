# frozen_string_literal: true

class ApplicationPolicy < ActionPolicy::Base
  # Configure authorization context
  authorize :user

  # Define common predicates
  def owner?
    record.user_id == user.id
  end

  def admin?
    user.admin?
  end

  # Default rules - deny everything by default
  def index?
    true
  end

  def show?
    owner? || admin?
  end

  def create?
    true
  end

  def new?
    create?
  end

  def update?
    owner? || admin?
  end

  def edit?
    update?
  end

  def destroy?
    owner? || admin?
  end

  # Define scopes for collections
  relation_scope do |relation|
    admin? ? relation : relation.where(user: user)
  end
end
