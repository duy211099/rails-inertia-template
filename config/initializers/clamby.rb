# frozen_string_literal: true

# Clamby's default config treats any scanner client error (missing
# signature DB, clamd down, exit status 2) the same as a detected virus
# ("return true to maintain legacy behavior") — daemonize + explicit
# client-error handling makes those raise instead, so VirusScanJob can
# retry them rather than purging a legitimate file. Production must run a
# clamd daemon for daemonize mode to work (see Dockerfile).
Clamby.configure(
  daemonize: true,
  error_clamscan_client_error: true,
  error_clamscan_missing: true
)
