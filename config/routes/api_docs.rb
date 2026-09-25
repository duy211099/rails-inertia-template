# frozen_string_literal: true

get "api/docs", to: "api_docs#index", as: :api_docs
get "api/openapi", to: "api_docs#openapi", defaults: { format: :json }, as: :api_openapi
