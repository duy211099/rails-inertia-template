# frozen_string_literal: true

# Page props retain their declared names; nested serializers own key conversion.
class ApplicationResource
  include Alba::Resource
  include Typelizer::DSL

  helper Alba::Inertia::Resource
end
