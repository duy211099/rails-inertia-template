# frozen_string_literal: true

# Pagy configuration
# See https://ddnexus.github.io/pagy/docs/api/pagy

Pagy::DEFAULT[:limit] = 12

# Enable overflow handling
Pagy::DEFAULT[:overflow] = :last_page
