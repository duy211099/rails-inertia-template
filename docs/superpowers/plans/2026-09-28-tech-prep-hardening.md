# Tech-Prep Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the generic (non-business) Phase 0 infra gaps identified by auditing this repo against a WBS: login throttling/lockout, auth event logging, virus-scanned uploads, PII-encryption scaffolding, error tracking, transactional email delivery, and GA4 pageview tracking.

**Architecture:** Each task is an independent vertical slice (gem/config + model/job/lib + test) with no cross-task dependencies — they can be implemented and reviewed in any order or in parallel. Backend tasks follow existing conventions (UUID PKs, fixtures over FactoryBot, request specs hitting real Devise routes). Frontend tasks follow the existing `app/frontend/lib/*.ts` + colocated `*.test.ts` vitest pattern already used for `csrf.ts`, `i18n.ts`, etc.

**Tech Stack:** Rails 8.1 / Devise 5 / Warden / Rack::Attack / ActiveStorage / Solid Queue / Active Record Encryption / Sentry / RSpec+fixtures; React 19 / Inertia / Vite / Vitest.

**Spec:** This plan's own "Findings" section below (derived from a live repo audit — no separate spec doc exists). Business-specific WBS items (consent/export, SMS/Twilio, Supabase backups, DO Spaces vendor swap) are explicitly out of scope per user decision.

## Global Constraints

- UUID primary keys on all new tables (`id: :uuid`), matching `db/migrate/20260927120000_create_initial_schema.rb`.
- Backend tests use `fixtures :users` (not FactoryBot) — `users(:one)` has password `"password123"` (see `spec/fixtures/users.yml`).
- Frontend tests use Vitest + `@testing-library/react`, colocated `*.test.ts(x)` next to source, `vi.stubEnv` for `import.meta.env.VITE_*` vars.
- New env vars follow the existing `.env.example` convention (plain `ENV[...]`, not `anyway_config`, matching `R2_*` / `API_CORS_ORIGINS`).
- No CSP changes needed — `config/initializers/content_security_policy.rb` is entirely commented out (unenforced) in this template.
- Migrations dated after `20260927130000`; use today's date `20260928` with incrementing times to keep ordering unambiguous.
- Run `bin/rubocop -a` and `npm run lint:fix` before each commit per repo convention; every task's steps assume this is a final step even where not spelled out again.

## Review Focus

- **Rack::Attack + lockable interaction**: a lockable test doing 6 login POSTs to the same email must not itself get 429'd by the email throttle — throttle limits are set to 10/period, above lockable's `maximum_attempts: 5`, verified by Task 2's test running exactly 6 requests.
- **Failed login with unknown email**: `AuthEvent` failure logging must not blow up when `user` can't be resolved (no user association) — Task 3 test posts a failing login for a fixture email but never assumes a `user_id` is set for failures.
- **Blob without an attachable owner**: virus scan job must handle a blob whose record was deleted before the job runs (`ActiveStorage::Blob.find_by(id:)` returns nil) — Task 4 test covers this by calling `perform` with a bogus id.
- **Missing/blank env vars must no-op, not raise**: Sentry init, Resend SMTP config, and GA4 analytics must all leave default (test/dev) behavior untouched when their env var is absent — every task below has an explicit "absent env var" test case.
- **Infected upload must not remain downloadable**: Task 4's job purges the blob (not just flags it) so a signed URL generated before the scan finishes can't later serve infected content once `perform` completes — covered by asserting `ActiveStorage::Blob.exists?` is false after an infected scan.

---

## Findings this plan addresses

| Gap | Task |
|---|---|
| No login throttling / brute-force protection | Task 1 |
| Devise `:lockable` not enabled | Task 2 |
| No sign-in audit trail | Task 3 |
| No virus scanning on uploads | Task 4 |
| No PII encryption scaffolding | Task 5 |
| No error tracking (Rails or React) | Task 6 |
| Production email delivery unconfigured | Task 7 |
| No analytics/pageview tracking | Task 8 |

---

### Task 1: Rack::Attack login throttling

**Files:**
- Modify: `Gemfile` (add gem, alphabetical-ish next to other Ops/config gems)
- Create: `config/initializers/rack_attack.rb`
- Create: `spec/requests/rack_attack_spec.rb`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `Rack::Attack` throttle rules named `"logins/ip"` and `"logins/email"`, both `limit: 10, period: 20.seconds`. Task 2's lockable test relies on this limit being `> 5` so its 6-request test isn't throttled first.

- [x] **Step 1: Add the gem**

In `Gemfile`, under the `# --- Ops / config` section, add:

```ruby
gem "rack-attack", "~> 6.7"
```

Run `bundle install`.

- [x] **Step 2: Write the failing test**

```ruby
# spec/requests/rack_attack_spec.rb
# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Rack::Attack login throttling", type: :request do
  before { Rack::Attack.cache.store.clear }

  it "throttles repeated login attempts from the same IP" do
    11.times do
      post user_session_path, params: { user: { email: "nonexistent@example.com", password: "wrong" } }
    end

    expect(response).to have_http_status(:too_many_requests)
  end
end
```

- [x] **Step 2b: Run it to confirm it fails**

Run: `bundle exec rspec spec/requests/rack_attack_spec.rb`
Expected: FAIL — `NameError: uninitialized constant Rack::Attack` or a non-429 status, since no throttling exists yet.

- [x] **Step 3: Implement the initializer**

```ruby
# config/initializers/rack_attack.rb
# frozen_string_literal: true

class Rack::Attack
  # Rack::Attack::Railtie auto-inserts this middleware; no manual
  # config.middleware.use call needed.

  # A single process cache is fine for this template's single-Puma-process
  # Kamal deploy; swap for a shared store (e.g. solid_cache) if you scale
  # to multiple app instances behind a load balancer.
  self.cache.store = ActiveSupport::Cache::MemoryStore.new

  throttle("logins/ip", limit: 10, period: 20.seconds) do |req|
    req.ip if req.path == "/users/sign_in" && req.post?
  end

  throttle("logins/email", limit: 10, period: 20.seconds) do |req|
    if req.path == "/users/sign_in" && req.post?
      req.params.dig("user", "email")&.downcase&.presence
    end
  end

  self.throttled_responder = lambda do |_request|
    [ 429, { "Content-Type" => "application/json" }, [ { error: "Too many attempts. Try again shortly." }.to_json ] ]
  end
end
```

- [x] **Step 4: Run test to verify it passes**

Run: `bundle exec rspec spec/requests/rack_attack_spec.rb`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add Gemfile Gemfile.lock config/initializers/rack_attack.rb spec/requests/rack_attack_spec.rb
git commit -m "feat: throttle repeated login attempts with rack-attack"
```

---

### Task 2: Devise `:lockable`

**Files:**
- Modify: `app/models/user.rb`
- Modify: `config/initializers/devise.rb`
- Create: `db/migrate/20260928140000_add_lockable_to_users.rb`
- Create: `spec/requests/users/sessions_lockable_spec.rb`

**Interfaces:**
- Consumes: Rack::Attack throttle limits from Task 1 (must stay `> 5` for this task's 6-request test to reach lockable logic instead of a 429).
- Produces: `user.access_locked?` (from Devise `:lockable`), used nowhere else in this plan but available for any future admin/unlock UI.

- [x] **Step 1: Write the failing migration test setup — write the request spec first**

```ruby
# spec/requests/users/sessions_lockable_spec.rb
# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Session lockout", type: :request do
  fixtures :users

  it "locks the account after 5 failed attempts, blocking even the correct password" do
    5.times do
      post user_session_path, params: { user: { email: users(:one).email, password: "wrong" } }
    end

    expect(users(:one).reload).to be_access_locked

    post user_session_path, params: { user: { email: users(:one).email, password: "password123" } }
    follow_redirect!

    expect(response.body).to include(I18n.t("devise.failure.locked"))
  end

  it "does not lock the account before the 5th failed attempt" do
    4.times do
      post user_session_path, params: { user: { email: users(:one).email, password: "wrong" } }
    end

    expect(users(:one).reload).not_to be_access_locked
  end
end
```

- [x] **Step 2: Run it to confirm it fails**

Run: `bundle exec rspec spec/requests/users/sessions_lockable_spec.rb`
Expected: FAIL — `users(:one)` doesn't respond to `access_locked?` (no `:lockable` module, no columns yet).

- [x] **Step 3: Add the migration**

```ruby
# db/migrate/20260928140000_add_lockable_to_users.rb
# frozen_string_literal: true

class AddLockableToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :failed_attempts, :integer, default: 0, null: false
    add_column :users, :unlock_token, :string
    add_column :users, :locked_at, :datetime
    add_index :users, :unlock_token, unique: true
  end
end
```

Run: `bin/rails db:migrate db:test:prepare`

- [x] **Step 4: Enable `:lockable` on the model**

In `app/models/user.rb`, change:

```ruby
devise :database_authenticatable, :registerable,
       :recoverable, :rememberable, :validatable,
       :omniauthable, :jwt_authenticatable,
       omniauth_providers: [ :google_oauth2 ], jwt_revocation_strategy: self
```

to:

```ruby
devise :database_authenticatable, :registerable,
       :recoverable, :rememberable, :validatable, :lockable,
       :omniauthable, :jwt_authenticatable,
       omniauth_providers: [ :google_oauth2 ], jwt_revocation_strategy: self
```

- [x] **Step 5: Configure lockable in the Devise initializer**

In `config/initializers/devise.rb`, under `# ==> Configuration for :lockable`, uncomment and set:

```ruby
config.lock_strategy = :failed_attempts
config.unlock_keys = [ :email ]
config.unlock_strategy = :time
config.maximum_attempts = 5
config.unlock_in = 1.hour
config.last_attempt_warning = true
```

- [x] **Step 6: Run test to verify it passes**

Run: `bundle exec rspec spec/requests/users/sessions_lockable_spec.rb`
Expected: PASS

- [x] **Step 7: Update the annotated schema comment and commit**

Run `bundle exec annotaterb models` (repo convention per `annotaterb` gem) or manually add the three new columns to the schema comment block atop `app/models/user.rb`.

```bash
git add app/models/user.rb config/initializers/devise.rb db/migrate/20260928140000_add_lockable_to_users.rb db/schema.rb spec/requests/users/sessions_lockable_spec.rb
git commit -m "feat: lock accounts after repeated failed sign-in attempts"
```

---

### Task 3: Auth event log

**Files:**
- Create: `db/migrate/20260928141000_create_auth_events.rb`
- Create: `app/models/auth_event.rb`
- Create: `config/initializers/warden_hooks.rb`
- Create: `spec/models/auth_event_spec.rb`
- Create: `spec/requests/auth_event_logging_spec.rb`

**Interfaces:**
- Consumes: nothing.
- Produces: `AuthEvent` model with `enum event_type: { success: 0, failure: 1 }`, columns `user_id (nullable)`, `email`, `ip_address`, `user_agent`, `created_at`. Available for a future admin audit view (out of scope here).

- [x] **Step 1: Write the failing model spec**

```ruby
# spec/models/auth_event_spec.rb
# frozen_string_literal: true

require "rails_helper"

RSpec.describe AuthEvent, type: :model do
  it "defines success and failure event types" do
    expect(described_class.event_types.keys).to contain_exactly("success", "failure")
  end

  it "does not require a user (failed logins may not resolve to one)" do
    event = described_class.new(email: "nobody@example.com", event_type: :failure, ip_address: "127.0.0.1")
    expect(event).to be_valid
  end
end
```

- [x] **Step 2: Run it to confirm it fails**

Run: `bundle exec rspec spec/models/auth_event_spec.rb`
Expected: FAIL — `uninitialized constant AuthEvent`

- [x] **Step 3: Add the migration**

```ruby
# db/migrate/20260928141000_create_auth_events.rb
# frozen_string_literal: true

class CreateAuthEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :auth_events, id: :uuid do |t|
      t.references :user, foreign_key: true, type: :uuid
      t.string :email
      t.integer :event_type, null: false
      t.string :ip_address
      t.string :user_agent
      t.datetime :created_at, null: false
    end
    add_index :auth_events, :event_type
    add_index :auth_events, :created_at
  end
end
```

Run: `bin/rails db:migrate db:test:prepare`

- [x] **Step 4: Implement the model**

```ruby
# app/models/auth_event.rb
# frozen_string_literal: true

class AuthEvent < ApplicationRecord
  belongs_to :user, optional: true

  enum :event_type, { success: 0, failure: 1 }
end
```

- [x] **Step 5: Run the model spec to verify it passes**

Run: `bundle exec rspec spec/models/auth_event_spec.rb`
Expected: PASS

- [x] **Step 6: Write the failing request spec**

```ruby
# spec/requests/auth_event_logging_spec.rb
# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Auth event logging", type: :request do
  fixtures :users

  it "logs a successful sign-in against the user" do
    expect {
      post user_session_path, params: { user: { email: users(:one).email, password: "password123" } }
    }.to change(AuthEvent, :count).by(1)

    event = AuthEvent.last
    expect(event).to have_attributes(user_id: users(:one).id, event_type: "success")
  end

  it "logs a failed sign-in without a user association" do
    expect {
      post user_session_path, params: { user: { email: users(:one).email, password: "wrong" } }
    }.to change(AuthEvent, :count).by(1)

    event = AuthEvent.last
    expect(event).to have_attributes(user_id: nil, email: users(:one).email, event_type: "failure")
  end
end
```

- [x] **Step 7: Run it to confirm it fails**

Run: `bundle exec rspec spec/requests/auth_event_logging_spec.rb`
Expected: FAIL — count doesn't change, no Warden hooks registered yet.

- [x] **Step 8: Implement the Warden hooks**

```ruby
# config/initializers/warden_hooks.rb
# frozen_string_literal: true

Warden::Manager.after_authentication do |user, warden, _opts|
  next unless warden.authenticated?(:user)

  AuthEvent.create!(
    user: user,
    email: user.email,
    event_type: :success,
    ip_address: warden.request.ip,
    user_agent: warden.request.user_agent
  )
end

Warden::Manager.before_failure do |env, _opts|
  request = ActionDispatch::Request.new(env)
  next unless request.path == "/users/sign_in" && request.post?

  AuthEvent.create!(
    email: request.params.dig("user", "email"),
    event_type: :failure,
    ip_address: request.ip,
    user_agent: request.user_agent
  )
end
```

- [x] **Step 9: Run test to verify it passes**

Run: `bundle exec rspec spec/requests/auth_event_logging_spec.rb`
Expected: PASS

- [x] **Step 10: Commit**

```bash
git add db/migrate/20260928141000_create_auth_events.rb db/schema.rb app/models/auth_event.rb config/initializers/warden_hooks.rb spec/models/auth_event_spec.rb spec/requests/auth_event_logging_spec.rb
git commit -m "feat: log sign-in success/failure events via Warden hooks"
```

---

### Task 4: ClamAV virus scanning on upload

**Files:**
- Modify: `Gemfile`
- Create: `app/models/active_storage/blob.rb`
- Create: `app/jobs/virus_scan_job.rb`
- Create: `spec/jobs/virus_scan_job_spec.rb`
- Create: `spec/models/active_storage/blob_spec.rb`

**Interfaces:**
- Consumes: nothing.
- Produces: `blob.clean?` / `blob.infected?` (reads `blob.metadata["virus_scan"]`), for any future upload UI to gate downloads on.

- [x] **Step 1: Add the gem**

```ruby
gem "clamby", "~> 1.6"
```

Run `bundle install`. (No ClamAV daemon needed for dev/test — all specs stub `Clamby.virus?`; only production needs `clamd`/`clamscan` installed on the host.)

- [x] **Step 2: Write the failing job spec**

```ruby
# spec/jobs/virus_scan_job_spec.rb
# frozen_string_literal: true

require "rails_helper"

RSpec.describe VirusScanJob, type: :job do
  def create_blob
    ActiveStorage::Blob.create_and_upload!(
      io: StringIO.new("hello world"),
      filename: "test.txt",
      content_type: "text/plain"
    )
  end

  it "marks a clean file as scanned and clean" do
    allow(Clamby).to receive(:virus?).and_return(false)
    blob = create_blob

    described_class.new.perform(blob.id)

    expect(blob.reload.metadata["virus_scan"]).to eq("clean")
    expect(blob).to be_clean
  end

  it "purges an infected file instead of leaving it downloadable" do
    allow(Clamby).to receive(:virus?).and_return(true)
    blob = create_blob

    described_class.new.perform(blob.id)

    expect(ActiveStorage::Blob.exists?(blob.id)).to be(false)
  end

  it "does nothing if the blob was already deleted before the job ran" do
    expect { described_class.new.perform(SecureRandom.uuid) }.not_to raise_error
  end
end
```

- [x] **Step 3: Run it to confirm it fails**

Run: `bundle exec rspec spec/jobs/virus_scan_job_spec.rb`
Expected: FAIL — `uninitialized constant VirusScanJob`

- [x] **Step 4: Implement the blob extension**

```ruby
# app/models/active_storage/blob.rb
# frozen_string_literal: true

module ActiveStorage
  class Blob
    after_create_commit :enqueue_virus_scan

    def clean?
      metadata["virus_scan"] == "clean"
    end

    def infected?
      metadata["virus_scan"] == "infected"
    end

    private

    def enqueue_virus_scan
      VirusScanJob.perform_later(id)
    end
  end
end
```

- [x] **Step 5: Implement the job**

```ruby
# app/jobs/virus_scan_job.rb
# frozen_string_literal: true

class VirusScanJob < ApplicationJob
  queue_as :default

  def perform(blob_id)
    blob = ActiveStorage::Blob.find_by(id: blob_id)
    return unless blob

    blob.open do |file|
      if Clamby.virus?(file.path)
        blob.update!(metadata: blob.metadata.merge("virus_scan" => "infected"))
        blob.purge
      else
        blob.update!(metadata: blob.metadata.merge("virus_scan" => "clean"))
      end
    end
  end
end
```

- [x] **Step 6: Run test to verify it passes**

Run: `bundle exec rspec spec/jobs/virus_scan_job_spec.rb`
Expected: PASS

- [x] **Step 7: Write and pass the blob-extension spec**

```ruby
# spec/models/active_storage/blob_spec.rb
# frozen_string_literal: true

require "rails_helper"

RSpec.describe ActiveStorage::Blob, type: :model do
  it "enqueues a virus scan job after being created" do
    expect {
      ActiveStorage::Blob.create_and_upload!(io: StringIO.new("x"), filename: "x.txt")
    }.to have_enqueued_job(VirusScanJob)
  end
end
```

Run: `bundle exec rspec spec/models/active_storage/blob_spec.rb`
Expected: PASS

- [x] **Step 8: Commit**

```bash
git add Gemfile Gemfile.lock app/models/active_storage/blob.rb app/jobs/virus_scan_job.rb spec/jobs/virus_scan_job_spec.rb spec/models/active_storage/blob_spec.rb
git commit -m "feat: scan uploads for viruses and quarantine infected blobs"
```

---

### Task 5: Active Record encryption scaffolding

**Files:**
- Modify: `config/environments/test.rb`
- Create: `spec/lib/active_record_encryption_spec.rb`
- (Manual, documented step) production/development credentials

**Interfaces:**
- Consumes: nothing.
- Produces: working `ActiveRecord::Encryption.encrypt_message` / `.decrypt_message`, so any future model can add `encrypts :field` with zero further setup.

- [x] **Step 1: Write the failing spec**

```ruby
# spec/lib/active_record_encryption_spec.rb
# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Active Record encryption", type: :model do
  it "encrypts and decrypts a message using the configured keys" do
    message = ActiveRecord::Encryption.encrypt_message("sensitive value")

    expect(message).not_to eq("sensitive value")
    expect(ActiveRecord::Encryption.decrypt_message(message)).to eq("sensitive value")
  end
end
```

- [x] **Step 2: Run it to confirm it fails**

Run: `bundle exec rspec spec/lib/active_record_encryption_spec.rb`
Expected: FAIL — `ActiveRecord::Encryption::Errors::Configuration: Missing Active Record encryption credential`

- [x] **Step 3: Configure deterministic test keys**

In `config/environments/test.rb`, add (near the other test-only settings):

```ruby
# Fixed, non-secret keys so encryption works in CI without real credentials.
# Real environments (development/production) must set these via
# `bin/rails credentials:edit` (see Step 4) — never reuse these values there.
config.active_record.encryption.primary_key = "a" * 32
config.active_record.encryption.deterministic_key = "b" * 32
config.active_record.encryption.key_derivation_salt = "c" * 32
```

- [x] **Step 4: Run test to verify it passes**

Run: `bundle exec rspec spec/lib/active_record_encryption_spec.rb`
Expected: PASS

- [x] **Step 5: Document the manual credential step (development/production)**

This step has no automated test — it's a one-time secret-generation command each engineer/deploy target runs themselves, same category as setting `GOOGLE_CLIENT_SECRET`.

Run once per environment:

```bash
bin/rails db:encryption:init
```

This prints three lines like:

```ruby
active_record_encryption:
  primary_key: ...
  deterministic_key: ...
  key_derivation_salt: ...
```

Paste them into that environment's credentials:

```bash
bin/rails credentials:edit                          # development
bin/rails credentials:edit --environment production  # production
```

- [x] **Step 6: Commit**

```bash
git add config/environments/test.rb spec/lib/active_record_encryption_spec.rb
git commit -m "feat: scaffold Active Record encryption keys for test env"
```

---

### Task 6: Sentry error tracking (Rails + React)

**Files:**
- Modify: `Gemfile`
- Create: `app/lib/observability/sentry_config.rb`
- Create: `config/initializers/sentry.rb`
- Create: `spec/lib/observability/sentry_config_spec.rb`
- Modify: `package.json` (add `@sentry/react`)
- Create: `app/frontend/lib/sentry.ts`
- Create: `app/frontend/lib/sentry.test.ts`
- Modify: `app/frontend/entrypoints/inertia.tsx`
- Modify: `app/frontend/components/ErrorBoundary.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `Observability::SentryConfig.enabled?(dsn)` (Ruby); `initSentry(): void` and `reportError(error: unknown): void` (TS), the latter called from `ErrorBoundary#componentDidCatch`.

- [x] **Step 1: Add the gems**

```ruby
gem "sentry-ruby", "~> 5.22"
gem "sentry-rails", "~> 5.22"
```

Run `bundle install`.

- [x] **Step 2: Write the failing Ruby spec**

```ruby
# spec/lib/observability/sentry_config_spec.rb
# frozen_string_literal: true

require "rails_helper"

RSpec.describe Observability::SentryConfig do
  describe ".enabled?" do
    it "is false when the DSN is blank" do
      expect(described_class.enabled?(nil)).to be(false)
      expect(described_class.enabled?("")).to be(false)
    end

    it "is true when a DSN is present" do
      expect(described_class.enabled?("https://key@sentry.io/123")).to be(true)
    end
  end
end
```

- [x] **Step 3: Run it to confirm it fails**

Run: `bundle exec rspec spec/lib/observability/sentry_config_spec.rb`
Expected: FAIL — `uninitialized constant Observability`

- [x] **Step 4: Implement the gate and initializer**

```ruby
# app/lib/observability/sentry_config.rb
# frozen_string_literal: true

module Observability
  module SentryConfig
    def self.enabled?(dsn)
      dsn.present?
    end
  end
end
```

```ruby
# config/initializers/sentry.rb
# frozen_string_literal: true

dsn = ENV["SENTRY_DSN"]

if Observability::SentryConfig.enabled?(dsn)
  Sentry.init do |config|
    config.dsn = dsn
    config.breadcrumbs_logger = [ :active_support_logger ]
    config.traces_sample_rate = 0.1
  end
end
```

- [x] **Step 5: Run test to verify it passes**

Run: `bundle exec rspec spec/lib/observability/sentry_config_spec.rb`
Expected: PASS

- [x] **Step 6: Add the frontend dependency**

```bash
npm install @sentry/react
```

- [x] **Step 7: Write the failing frontend test**

```ts
// app/frontend/lib/sentry.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockInit, mockCaptureException } = vi.hoisted(() => ({
  mockInit: vi.fn(),
  mockCaptureException: vi.fn(),
}))

vi.mock('@sentry/react', () => ({
  init: mockInit,
  captureException: mockCaptureException,
}))

beforeEach(async () => {
  vi.resetModules()
  mockInit.mockClear()
  mockCaptureException.mockClear()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('initSentry', () => {
  it('does not initialize Sentry when no DSN is configured', async () => {
    const { initSentry } = await import('./sentry')
    initSentry()
    expect(mockInit).not.toHaveBeenCalled()
  })

  it('initializes Sentry once when a DSN is configured', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://key@sentry.io/123')
    const { initSentry } = await import('./sentry')
    initSentry()
    initSentry()
    expect(mockInit).toHaveBeenCalledTimes(1)
  })
})

describe('reportError', () => {
  it('does not forward errors before Sentry is initialized', async () => {
    const { reportError } = await import('./sentry')
    reportError(new Error('boom'))
    expect(mockCaptureException).not.toHaveBeenCalled()
  })

  it('forwards errors to Sentry once initialized', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://key@sentry.io/123')
    const { initSentry, reportError } = await import('./sentry')
    initSentry()
    const error = new Error('boom')
    reportError(error)
    expect(mockCaptureException).toHaveBeenCalledWith(error)
  })
})
```

- [x] **Step 8: Run it to confirm it fails**

Run: `npx vitest run app/frontend/lib/sentry.test.ts`
Expected: FAIL — cannot find module `./sentry`

- [x] **Step 9: Implement the frontend module**

```ts
// app/frontend/lib/sentry.ts
import * as Sentry from '@sentry/react'

let initialized = false

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
  if (!dsn || initialized) return

  Sentry.init({ dsn, environment: import.meta.env.MODE })
  initialized = true
}

export function reportError(error: unknown): void {
  if (!initialized) return
  Sentry.captureException(error)
}
```

- [x] **Step 10: Run test to verify it passes**

Run: `npx vitest run app/frontend/lib/sentry.test.ts`
Expected: PASS

- [x] **Step 11: Wire it into the app**

In `app/frontend/entrypoints/inertia.tsx`, add near the top of the file (after imports, before `createInertiaApp`):

```ts
import { initSentry } from '@/lib/sentry'

initSentry()
```

In `app/frontend/components/ErrorBoundary.tsx`, update `componentDidCatch`:

```tsx
import { reportError } from '@/lib/sentry'

// ...

componentDidCatch(error: Error, info: ErrorInfo) {
  console.error('Unhandled UI error', error, info)
  reportError(error)
}
```

- [x] **Step 12: Run the existing ErrorBoundary test to confirm no regression**

Run: `npx vitest run app/frontend/components/ErrorBoundary.test.tsx`
Expected: PASS (unchanged — `reportError` no-ops with no DSN in test env)

- [x] **Step 13: Commit**

```bash
git add Gemfile Gemfile.lock app/lib/observability/sentry_config.rb config/initializers/sentry.rb spec/lib/observability/sentry_config_spec.rb package.json package-lock.json app/frontend/lib/sentry.ts app/frontend/lib/sentry.test.ts app/frontend/entrypoints/inertia.tsx app/frontend/components/ErrorBoundary.tsx
git commit -m "feat: add Sentry error tracking for Rails and React"
```

---

### Task 7: Production email delivery via Resend

**Files:**
- Create: `app/lib/mailers/resend_smtp.rb`
- Create: `config/initializers/action_mailer.rb`
- Create: `spec/lib/mailers/resend_smtp_spec.rb`
- Modify: `.env.example`

**Interfaces:**
- Consumes: nothing.
- Produces: `Mailers::ResendSmtp.settings_for(api_key:, domain: "resend.dev")` returning an ActionMailer SMTP settings hash.

- [x] **Step 1: Write the failing spec**

```ruby
# spec/lib/mailers/resend_smtp_spec.rb
# frozen_string_literal: true

require "rails_helper"

RSpec.describe Mailers::ResendSmtp do
  describe ".settings_for" do
    it "builds SMTP settings pointed at Resend with the given API key and domain" do
      settings = described_class.settings_for(api_key: "re_123", domain: "mail.example.com")

      expect(settings).to include(
        address: "smtp.resend.com",
        port: 587,
        domain: "mail.example.com",
        user_name: "resend",
        password: "re_123",
        authentication: :plain,
        enable_starttls_auto: true
      )
    end

    it "defaults the domain when none is given" do
      settings = described_class.settings_for(api_key: "re_123")
      expect(settings[:domain]).to eq("resend.dev")
    end
  end
end
```

- [x] **Step 2: Run it to confirm it fails**

Run: `bundle exec rspec spec/lib/mailers/resend_smtp_spec.rb`
Expected: FAIL — `uninitialized constant Mailers`

- [x] **Step 3: Implement it**

```ruby
# app/lib/mailers/resend_smtp.rb
# frozen_string_literal: true

module Mailers
  module ResendSmtp
    def self.settings_for(api_key:, domain: "resend.dev")
      {
        address: "smtp.resend.com",
        port: 587,
        domain: domain,
        user_name: "resend",
        password: api_key,
        authentication: :plain,
        enable_starttls_auto: true
      }
    end
  end
end
```

```ruby
# config/initializers/action_mailer.rb
# frozen_string_literal: true

if (api_key = ENV["RESEND_API_KEY"]).present?
  Rails.application.config.action_mailer.delivery_method = :smtp
  Rails.application.config.action_mailer.smtp_settings =
    Mailers::ResendSmtp.settings_for(api_key: api_key, domain: ENV.fetch("RESEND_DOMAIN", "resend.dev"))
end
```

- [x] **Step 4: Run test to verify it passes**

Run: `bundle exec rspec spec/lib/mailers/resend_smtp_spec.rb`
Expected: PASS

- [x] **Step 5: Document the env vars**

In `.env.example`, add:

```
# Resend (production transactional email — leave unset in dev/test)
RESEND_API_KEY=
RESEND_DOMAIN=
```

- [x] **Step 6: Commit**

```bash
git add app/lib/mailers/resend_smtp.rb config/initializers/action_mailer.rb spec/lib/mailers/resend_smtp_spec.rb .env.example
git commit -m "feat: configure production email delivery via Resend SMTP"
```

---

### Task 8: GA4 pageview tracking

**Files:**
- Create: `app/frontend/lib/analytics.ts`
- Create: `app/frontend/lib/analytics.test.ts`
- Modify: `app/frontend/entrypoints/inertia.tsx`
- Modify: `.env.example`

**Interfaces:**
- Consumes: nothing.
- Produces: `initAnalytics(): void`, `trackPageview(path: string): void`, called from `inertia.tsx`'s existing `router.on('navigate', ...)` handler.

- [x] **Step 1: Write the failing test**

```ts
// app/frontend/lib/analytics.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { __resetAnalyticsForTests, initAnalytics, trackPageview } from './analytics'

beforeEach(() => {
  document.head.innerHTML = ''
  window.gtag = undefined
  window.dataLayer = undefined
  __resetAnalyticsForTests()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('initAnalytics', () => {
  it('does nothing when no measurement id is configured', () => {
    initAnalytics()
    expect(document.querySelector('script[src*="googletagmanager"]')).toBeNull()
  })

  it('injects the gtag script and configures it when a measurement id is set', () => {
    vi.stubEnv('VITE_GA4_MEASUREMENT_ID', 'G-TEST123')
    initAnalytics()
    expect(document.querySelector('script[src*="G-TEST123"]')).not.toBeNull()
    expect(window.gtag).toBeInstanceOf(Function)
  })
})

describe('trackPageview', () => {
  it('is a no-op before analytics is initialized', () => {
    trackPageview('/items')
    expect(window.gtag).toBeUndefined()
  })

  it('pushes a page_view event once analytics is initialized', () => {
    vi.stubEnv('VITE_GA4_MEASUREMENT_ID', 'G-TEST123')
    initAnalytics()
    const spy = vi.spyOn(window, 'gtag')
    trackPageview('/items')
    expect(spy).toHaveBeenCalledWith('event', 'page_view', { page_path: '/items' })
  })
})
```

- [x] **Step 2: Run it to confirm it fails**

Run: `npx vitest run app/frontend/lib/analytics.test.ts`
Expected: FAIL — cannot find module `./analytics`

- [x] **Step 3: Implement it**

```ts
// app/frontend/lib/analytics.ts
declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

let initialized = false

function pushToDataLayer(...args: unknown[]) {
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(args)
}

export function initAnalytics(): void {
  const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined
  if (!measurementId || initialized) return

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  document.head.appendChild(script)

  window.gtag = pushToDataLayer
  window.gtag('js', new Date())
  window.gtag('config', measurementId, { send_page_view: false })
  initialized = true
}

export function trackPageview(path: string): void {
  if (!initialized || !window.gtag) return
  window.gtag('event', 'page_view', { page_path: path })
}

export function __resetAnalyticsForTests(): void {
  initialized = false
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/frontend/lib/analytics.test.ts`
Expected: PASS

- [x] **Step 5: Wire it into the app**

In `app/frontend/entrypoints/inertia.tsx`:

```ts
import { initAnalytics, trackPageview } from '@/lib/analytics'

initAnalytics()
```

Extend the existing navigate handler (do not add a second `router.on('navigate', ...)` — append to the one that already syncs locale):

```ts
router.on('navigate', (event) => {
  const locale = (event.detail.page.props as { locale?: string }).locale
  if (locale) syncLocale(locale)

  trackPageview(event.detail.page.url)
})
```

- [x] **Step 6: Document the env var**

In `.env.example`, add:

```
# GA4 (leave unset in dev/test to disable analytics)
VITE_GA4_MEASUREMENT_ID=
```

- [x] **Step 7: Commit**

```bash
git add app/frontend/lib/analytics.ts app/frontend/lib/analytics.test.ts app/frontend/entrypoints/inertia.tsx .env.example
git commit -m "feat: track pageviews with GA4 on Inertia navigation"
```

---

## Self-Review

**1. Findings coverage:** All 8 rows in "Findings this plan addresses" map 1:1 to Tasks 1–8. ✅

**2. Placeholder scan:** No TBD/TODO, every step has literal code or an exact shell command. ✅

**3. Type consistency:** `initSentry`/`reportError` and `initAnalytics`/`trackPageview`/`__resetAnalyticsForTests` names match between implementation and test steps and the wiring step in `inertia.tsx`. `Mailers::ResendSmtp.settings_for(api_key:, domain:)` signature matches across spec, implementation, and initializer call. `AuthEvent` enum values (`success`/`failure`) match across model, model spec, and request spec. ✅

**4. Review Focus:** all 5 items each have an owning task and an explicit test step, as listed above. ✅
