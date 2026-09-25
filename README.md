# Rails + Inertia template

Rails 8.1, SQLite, Inertia, React, TypeScript, Vite, and Tailwind CSS.

## Setup

```sh
mise trust
mise install
mise exec -- bin/setup
```

- `mise.toml` pins Ruby 4.0.7 and Node 24.21.0. Omit `mise exec --` if mise is activated in your shell.
- Keep `.ruby-version` and the Dockerfile runtime args in sync with the pins. CI reads Ruby from `.ruby-version`, Node range from `package.json`.
- Versions are locked in `Gemfile.lock` / `package-lock.json`.

## Development

```sh
mise exec -- bin/dev
```

SQLite, so no separate database server. `bin/setup` installs deps and preps the dev database.

## Jobs, cache, and realtime without Redis

Production uses Solid Queue, Solid Cache, Solid Cable — no Redis/Sidekiq. Each adapter has its own SQLite database under `storage/` (see `config/database.yml`); schemas are checked in under `db/`. Solid Cache has a 256 MiB entry-size budget, not a file-size limit.

- Prepare DBs: `RAILS_ENV=production bin/rails db:prepare` (Docker entrypoint does this).
- Kamal sets `SOLID_QUEUE_IN_PUMA=true` so Puma runs the job supervisor. For a separate worker on the same host, omit that var and run `RAILS_ENV=production bin/jobs` — prepare the DBs first, the worker command doesn't do it for you. Don't set the var to the string `false`; it's checked for presence, not value.
- Dev uses Rails' async job adapter / memory cache / async Action Cable — no Redis, but jobs don't survive restarts and processes don't share cache/cable. For durable dev jobs, follow [Solid Queue's dev setup](https://github.com/rails/solid_queue#usage-in-development-and-other-non-production-environments).
- SQLite deployment assumes one host with persistent storage. Back up primary + queue DBs. Multiple hosts need a shared database server instead.
- `/jobs` dashboard requires login only, **not admin**. Lock down `config/initializers/mission_control.rb` before opening signups to untrusted users.

## Example JSON API

Open **`/api/docs`** after signing in for Swagger UI (session cookie + CSRF supplied automatically — requests act on real data). Contract lives at **`/api/openapi.json`** (login required), served from `docs/openapi.yml`. Swagger UI assets are bundled locally, no CDN needed.

`/api/v1/items` reuses existing Devise sessions, Alba serializers, Action Policy, Pagy, Discard, Paper Trail. Inertia pages stay at `/items`; API returns JSON errors and skips the web controller's modern-browser check.

| Method | Endpoint | Result |
| --- | --- | --- |
| GET | `/api/v1/items?page=1&limit=12` | Owned, kept items + `pagy` metadata |
| GET | `/api/v1/items/:id` | One owned item |
| POST | `/api/v1/items` | Create; 201 + Location header |
| PATCH / PUT | `/api/v1/items/:id` | Update supplied fields |
| DELETE | `/api/v1/items/:id` | Soft-delete; 204 |

Sorted by creation time then ID, descending. Page size defaults 12, capped 100. Fields: `name`, `description`, `phone_number` nested under `item`. camelCase responses. Client-supplied ownership ignored.

Console helper (after signing in, on `/items`):

```js
async function itemsApi(path = '', method = 'GET', item) {
  const response = await fetch(`/api/v1/items${path}`, {
    method,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content,
    },
    ...(item === undefined ? {} : { body: JSON.stringify({ item }) }),
  })
  const body = response.status === 204 ? null : await response.json()
  if (!response.ok) throw new Error(JSON.stringify(body))
  return body
}

await itemsApi('?page=1&limit=2')
const created = await itemsApi('', 'POST', { name: 'API test', phone_number: '123' })
await itemsApi(`/${created.item.id}`)
await itemsApi(`/${created.item.id}`, 'PATCH', { name: 'Updated through API' })
await itemsApi(`/${created.item.id}`, 'DELETE')
```

Session + CSRF only — no bearer tokens or cross-origin access yet; design those when mobile/third-party clients show up.

Errors: `{ "error": { "code": "...", "message": "...", "details": {} } }`. 401 unauthenticated, 404 inaccessible/deleted, 400 malformed params, 422 validation/CSRF (details map attribute → messages), 403 policy denial.

[OpenAPI 3.1 contract](docs/openapi.yml) covers all six operations. [Skooma](https://github.com/evilmartians/skooma) (test-only) checks the doc against real request/response contracts; specs also exercise real Devise login + CSRF.

```sh
mise exec -- bin/test spec/requests/api
```

No extra API framework needed. Add `rack-cors` for cross-origin browser clients, or Doorkeeper for third-party OAuth. Rate limiting / bearer auth / retry-idempotency are out of scope for this session-authenticated example.

## Checks

```sh
mise exec -- bin/test
mise exec -- npm test
mise exec -- bin/rails zeitwerk:check
mise exec -- bin/rubocop
mise exec -- npm run check
mise exec -- npm run lint
mise exec -- npm run build
mise exec -- bin/brakeman --no-pager
mise exec -- bin/bundler-audit
mise exec -- npm audit
```

## Tests

Backend: RSpec + [parallel_tests](https://github.com/grosser/parallel_tests).

```sh
mise exec -- bin/test
PARALLEL_TEST_PROCESSORS=4 mise exec -- bin/test
```

`bin/test` preps a separate SQLite DB per worker (`storage/test.sqlite3`, `test2.sqlite3`, ...), checks generated types, builds test assets once, runs specs. Reloads test schemas every run; doesn't touch dev data. Transactional fixtures roll back each example.

Specs: `spec/models`, `spec/policies`, `spec/serializers`, `spec/requests`. Fixtures in `spec/fixtures`, factories in `spec/factories`. No browser/system tests currently.

```sh
mise exec -- bin/test spec/models spec/policies spec/serializers
mise exec -- bundle exec rspec spec/models/user_spec.rb
mise exec -- bundle exec rspec spec/requests/items_spec.rb:28
```

Frontend: [Vitest](https://vitest.dev/guide/) + React Testing Library + jsdom, `*.test.ts(x)` beside source, no Rails server needed.

```sh
mise exec -- npm test
mise exec -- npm run test:watch
mise exec -- npm test -- app/frontend/components/auth-nav.test.tsx
```

GitHub Actions, `bin/ci`, and the pre-push hook run both suites.

## Production image

```sh
docker build -t rails_inertia_template .
```

Build stage installs Node + builds Vite assets; final image is Ruby + prod gems + compiled assets only. Supply `RAILS_MASTER_KEY`. Storage is Cloudflare R2 — needs `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`.

## Serialization and Inertia props

Alba serializers define the JSON contract; Typelizer generates matching TypeScript. Extend `BaseSerializer`, use `typelize_from Model` for model fields, `typelize` for computed ones. camelCase keys (audit snapshots keep original keys); nullable DB values → `T | null`; timestamps are strings.

Page resources extend `ApplicationResource`. Collections pass `Resource.new({ ... }).to_inertia` so partial reloads only evaluate requested props — authorize/scope in the controller first. Other responses use `Serializer.new(record).serializable_hash`.

```sh
mise exec -- npm run generate:types
RAILS_ENV=test mise exec -- bin/check-types
```

Prep the target env's DB before generating. Commit output under `app/frontend/types/serializers`, import via `@/types`. `bin/check-types` fails on drift without rewriting checked-in output; `bin/test` runs it once before parallel workers start.

## Email and request logs

Dev mail via Letter Opener Web at `/letter_opener` (dev-only route, no SMTP needed). Tests keep Action Mailer `:test` delivery; production SMTP is a deployment concern.

Production request logs: Lograge JSON on stdout (method, path, status, duration, request ID — no query strings/params). `/up` stays silent.

## Test and database tooling

- WebMock blocks external HTTP in backend specs (localhost open for browser tests). Stub with `stub_request`, or record real cassettes with VCR under `spec/fixtures/vcr_cassettes` for things like Google OAuth.
- FactoryBot factories in `spec/factories`; fixtures/parallel workers still available for existing specs.
- N+1 regression specs cover item/audit listings at multiple sizes. Bullet still runs in dev.
- `strong_migrations` flags unsafe migrations (non-null column with no default, renaming a column in use, etc.) before they hit a real DB.
- `anyway_config` is available for typed, validated config classes under `app/configs` once plain `ENV[]` reads outgrow themselves.

```sh
EVENT_PROF=sql.active_record mise exec -- bundle exec rspec spec/requests   # TestProf, opt-in
RAILS_ENV=test mise exec -- bundle exec database_consistency
```

CI runs `database_consistency` against a prepared test DB, with narrow exceptions for Devise's conditional email validation and its reset-token index.

## Gemfile of dreams comparison

Tracks the [Evil Martians article](https://evilmartians.com/chronicles/gemfile-of-dreams-libraries-we-use-to-build-rails-apps). It lists alternatives and app-specific tools, so absence ≠ missing capability.

| Area | Template decision |
| --- | --- |
| Inertia serialization | Alba, alba-inertia, Typelizer; JS Routes |
| Jobs | Solid Queue + Mission Control Jobs |
| Auth and data | Devise, Action Policy, Pagy, Discard, store_attribute, store_model |
| Dev and security | Vite, Bootsnap, Bullet, rack-mini-profiler, Brakeman, bundler-audit |
| Testing and safety | Lograge, Letter Opener Web, WebMock, VCR, FactoryBot, strong_migrations, anyway_config, TestProf, rubocop-rspec, n_plus_one_control |
| Database checks | database_consistency enforced in CI |
| Database and assets | SQLite + Node/npm for now; Postgres tools (e.g. pghero) and Bundlebun are the swap-in once the app moves to Postgres |
| Add when needed | AI, GraphQL, payment, feature-flag, and metrics tools |
