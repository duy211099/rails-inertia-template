# frozen_string_literal: true

# Mark existing migrations as safe
StrongMigrations.start_after = 20260925185512

# Set timeouts for migrations
StrongMigrations.lock_timeout = 10.seconds
StrongMigrations.statement_timeout = 1.hour

# Analyze tables after indexes are added
# Outdated statistics can sometimes hurt performance
# (SQLite, used in dev/test here, has no ANALYZE hook in this strong_migrations
# version, so leave auto-analyze off for it rather than aborting every
# add_index migration.)
StrongMigrations.auto_analyze = ActiveRecord::Base.connection_db_config.adapter != "sqlite3"

# Set the version of the production database
# so the right checks are run in development
# StrongMigrations.target_version = 18

# Add custom checks
# StrongMigrations.add_check do |method, args|
#   if method == :add_index && args[0].to_s == "users"
#     stop! "No more indexes on the users table"
#   end
# end
