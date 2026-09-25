# frozen_string_literal: true

source "https://rubygems.org"

ruby file: ".ruby-version"

# --- Rails core -------------------------------------------------------------

# Bundle edge Rails instead: gem "rails", github: "rails/rails", branch: "main"
gem "rails", "~> 8.1.4"
# The modern asset pipeline for Rails [https://github.com/rails/propshaft]
gem "propshaft", "~> 1.3"
# Use sqlite3 as the database for Active Record
gem "sqlite3", ">= 2.1"
# Use the Puma web server [https://github.com/puma/puma]
gem "puma", ">= 5.0"
# Build JSON APIs with ease [https://github.com/rails/jbuilder]
gem "jbuilder", "~> 2.14"

# Use Active Model has_secure_password [https://guides.rubyonrails.org/active_model_basics.html#securepassword]
# gem "bcrypt", "~> 3.1.7"

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem "tzinfo-data", platforms: %i[ windows jruby ]

# Use the database-backed adapters for Rails.cache, Active Job, and Action Cable
gem "solid_cache", "~> 1.0"
gem "solid_queue", "~> 1.4"
gem "solid_cable", "~> 4.0"
# Solid Queue web UI
gem "mission_control-jobs", "~> 1.1"

# Reduces boot times through caching; required in config/boot.rb
gem "bootsnap", "~> 1.23", require: false

# Add HTTP asset caching/compression and X-Sendfile acceleration to Puma [https://github.com/basecamp/thruster/]
gem "thruster", "~> 0.1", require: false

# Use Active Storage variants [https://guides.rubyonrails.org/active_storage_overview.html#transforming-images]
gem "image_processing", "~> 2.0"
# S3-compatible storage (for Cloudflare R2)
gem "aws-sdk-s3", "~> 1.180", require: false

# --- Inertia / frontend ------------------------------------------------------

gem "inertia_rails", "~> 3.16"
gem "vite_rails", "~> 3.0"

# Serialization
gem "oj", "~> 3.17"
gem "alba", "~> 4.0"
gem "alba-inertia", "~> 0.1.4"
gem "typelizer", "~> 0.13.1"

# Frontend routes
gem "js-routes", "2.4.1"

# --- Auth & authorization ----------------------------------------------------

gem "devise", "~> 5.0"
gem "omniauth-google-oauth2", "~> 1.2"
gem "omniauth-rails_csrf_protection", "~> 2.0"
gem "action_policy", "~> 0.7"

# --- Data & persistence -------------------------------------------------------

# Audit trail / versioning
gem "paper_trail", "~> 17.0"
# Pagination
gem "pagy", "~> 43.5"
# Soft deletes
gem "discard", "~> 2.0"
# JSON store enhancements
gem "store_attribute", "~> 2.0"
gem "store_model", "~> 4.4"
# Flags unsafe migrations before they run
gem "strong_migrations", "~> 2.4"

# --- Ops / config -------------------------------------------------------------

# Structured production request logs
gem "lograge", "~> 0.15"
# Typed, validated application configuration
gem "anyway_config", "~> 2.7"
# Parses Accept-Language headers for locale resolution
gem "http_accept_language", "~> 2.1"

# --- Development & test -------------------------------------------------------

group :development, :test do
  gem "rspec-rails", "~> 8.0"
  gem "parallel_tests", "~> 5.0"

  # See https://guides.rubyonrails.org/debugging_rails_applications.html#debugging-with-the-debug-gem
  gem "debug", platforms: %i[ mri windows ], require: "debug/prelude"

  # Audits gems for known security defects (use config/bundler-audit.yml to ignore issues)
  gem "bundler-audit", require: false

  # Static analysis for security vulnerabilities [https://brakemanscanner.org/]
  gem "brakeman", require: false

  # Omakase Ruby styling [https://github.com/rails/rubocop-rails-omakase/]
  gem "rubocop-rails-omakase", require: false
  gem "rubocop-rspec", "~> 3.10", require: false

  # Environment variables
  gem "dotenv-rails", "~> 3.1"

  # Model annotations
  gem "annotaterb", "~> 4.20"

  # i18n management
  gem "i18n-tasks", "~> 1.0"

  # Database validations
  gem "database_validations", "~> 2.1"

  # Database consistency checks
  gem "database_consistency", "~> 3.0", require: false

  # Test data factories
  gem "factory_bot_rails", "~> 6.4"
end

group :development do
  # Use console on exceptions pages [https://github.com/rails/web-console]
  gem "web-console"

  # Git hooks manager
  gem "lefthook", require: false

  # Better error pages
  gem "better_errors", "~> 2.10"
  gem "binding_of_caller", "~> 2.0"

  # Performance profiling
  gem "rack-mini-profiler", "~> 5.0"

  # N+1 query detection
  gem "bullet", "~> 8.1"

  gem "letter_opener_web", "~> 3.0"
end

group :test do
  # Use system testing [https://guides.rubyonrails.org/testing.html#system-testing]
  gem "capybara"
  gem "selenium-webdriver"
  gem "webmock", "~> 3.26"
  gem "vcr", "~> 6.3"
  gem "test-prof", "~> 1.6"
  gem "n_plus_one_control", "~> 0.8"
  gem "skooma", "~> 0.4.0"
end
