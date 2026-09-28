Compress this markdown into caveman format.

# Rails + Inertia template

Rails 8.1, SQLite, Inertia, React, TypeScript, Vite, Tailwind CSS.

## Setup

Need Ruby 4.0.7, Node 24.21.0 (see `.ruby-version` / `mise.toml`; [mise](https://mise.jdx.dev/) install + pin both auto via `mise trust && mise install`).

```sh
bin/setup
```

- Keep `.ruby-version` + Dockerfile runtime args synced. CI read Ruby from `.ruby-version`, Node range from `package.json`.
- Versions locked in `Gemfile.lock` / `package-lock.json`.

## Development

```sh
bin/dev
```

SQLite, no separate DB server. `bin/setup` install deps + prep dev DB.

## Jobs, cache, realtime without Redis

Prod use Solid Queue, Solid Cache, Solid Cable — no Redis/Sidekiq. Each adapter own SQLite DB under `storage/` (see `config/database.yml`); schemas checked in under `db/`. Solid Cache 256 MiB entry-size budget, not file-size limit.

- Prep DBs: `RAILS_ENV=production bin/rails db:prepare` (Docker entrypoint do this).
- Kamal set `SOLID_QUEUE_IN_PUMA=true` so Puma run job supervisor. Separate worker same host → omit var, run `RAILS_ENV=production bin/jobs` — prep DBs first, worker command don't do it for you. Don't set var to string `false`; checked for presence, not value.
- Dev use Rails async job adapter / memory cache / async Action Cable — no Redis, but jobs don't survive restart, processes don't share cache/cable. Want durable dev jobs → follow [Solid Queue's dev setup](https://github.com/rails/solid_queue#usage-in-development-and-other-non-production-environments).
- SQLite deploy assume one host + persistent storage. Back up primary + queue DBs. Multi-host need shared DB server instead.
- `/jobs` dashboard need login only, **not admin**. Lock down `config/initializers/mission_control.rb` before open signups to untrusted users.

## Example JSON API

Open **`/api/docs`** after sign in for Swagger UI (session cookie + CSRF auto-supplied — requests hit real data). Contract at **`/api/openapi.json`** (login required), served from `docs/openapi.yml`. Swagger UI assets bundled local, no CDN needed.

`/api/v1/items` reuse existing Devise sessions, Alba serializers, Action Policy, Pagy, Discard, Paper Trail. Inertia pages stay at `/items`; API return JSON errors, skip web controller's modern-browser check.

| Method | Endpoint | Result |
| --- | --- | --- |
| GET | `/api/v1/items?page=1&limit=12` | Owned, kept items + `pagy` metadata |
| GET | `/api/v1/items/:id` | One owned item |
| POST | `/api/v1/items` | Create; 201 + Location header |
| PATCH / PUT | `/api/v1/items/:id` | Update supplied fields |
| DELETE | `/api/v1/items/:id` | Soft-delete; 204 |

Sorted creation time then ID, descending. Page size default 12, capped 100. Fields: `name`, `description`, `phone_number` nested under `item`. camelCase responses. Client-supplied ownership ignored.

Console helper (after sign in, on `/items`):

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

Session + CSRF only — no bearer tokens, no cross-origin yet. Design those when mobile/third-party clients show up.

Errors: `{ "error": { "code": "...", "message": "...", "details": {} } }`. 401 unauthenticated, 404 inaccessible/deleted, 400 malformed params, 422 validation/CSRF (details map attribute → messages), 403 policy denial.

[OpenAPI 3.1 contract](docs/openapi.yml) cover all six ops. [Skooma](https://github.com/evilmartians/skooma) (test-only) check doc against real request/response contracts; specs also exercise real Devise login + CSRF.

```sh
bin/test spec/requests/api
```

No extra API framework needed. Add `rack-cors` for cross-origin browser clients, or Doorkeeper for third-party OAuth. Rate limiting / bearer auth / retry-idempotency out of scope this session-authenticated example.

## Checks

Biome check handwritten JS/TS repo-wide, incl UI, layout, pattern components, design tools, root configs. Generated routes + serializer types excluded. `npm run biome:check` check lint, formatting, imports; `npm run lint:tailwind` check Tailwind classes. CI + Git hooks run both.

```sh
bin/test
npm test
bin/rails zeitwerk:check
bin/rubocop
npm run check
npm run lint
npm run build
bin/brakeman --no-pager
bin/bundler-audit
npm audit
```

## Tests

Backend: RSpec + [parallel_tests](https://github.com/grosser/parallel_tests).

```sh
bin/test
PARALLEL_TEST_PROCESSORS=4 bin/test
```

`bin/test` prep separate SQLite DB per worker (`storage/test.sqlite3`, `test2.sqlite3`, ...), check generated types, build test assets once, run specs. Reload test schemas every run; dev data untouched. Transactional fixtures roll back each example.

Specs: `spec/models`, `spec/policies`, `spec/serializers`, `spec/requests`. Fixtures in `spec/fixtures`, factories in `spec/factories`. No browser/system tests yet.

```sh
bin/test spec/models spec/policies spec/serializers
bundle exec rspec spec/models/user_spec.rb
bundle exec rspec spec/requests/items_spec.rb:28
```

Frontend: [Vitest](https://vitest.dev/guide/) + React Testing Library + jsdom, `*.test.ts(x)` beside source, no Rails server needed.

```sh
npm test
npm run test:watch
npm test -- app/frontend/components/auth-nav.test.tsx
```

GitHub Actions, `bin/ci`, pre-push hook run both suites.

## Production image

```sh
docker build -t rails_inertia_template .
```

Build stage install Node + build Vite assets; final image Ruby + prod gems + compiled assets only. Supply `RAILS_MASTER_KEY`. Storage Cloudflare R2 — need `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`.

## Serialization and Inertia props

Alba serializers define JSON contract; Typelizer generate matching TypeScript. Extend `BaseSerializer`, use `typelize_from Model` for model fields, `typelize` for computed ones. camelCase keys (audit snapshots keep original keys); nullable DB values → `T | null`; timestamps strings.

Page resources extend `ApplicationResource`. Collections pass `Resource.new({ ... }).to_inertia` so partial reloads only eval requested props — authorize/scope in controller first. Other responses use `Serializer.new(record).serializable_hash`.

```sh
npm run generate:types
RAILS_ENV=test bin/check-types
```

Prep target env's DB before generating. Commit output under `app/frontend/types/serializers`, import via `@/types`. `bin/check-types` fail on drift, don't rewrite checked-in output; `bin/test` run it once before parallel workers start.

## Email and request logs

Dev mail via Letter Opener Web at `/letter_opener` (dev-only route, no SMTP needed). Tests keep Action Mailer `:test` delivery; prod SMTP deployment concern.

Prod request logs: Lograge JSON on stdout (method, path, status, duration, request ID — no query strings/params). `/up` stays silent.

## Test and database tooling

- WebMock block external HTTP in backend specs (localhost open for browser tests). Stub with `stub_request`, or record real cassettes with VCR under `spec/fixtures/vcr_cassettes` for things like Google OAuth.
- FactoryBot factories in `spec/factories`; fixtures/parallel workers still available for existing specs.
- N+1 regression specs cover item/audit listings, multiple sizes. Bullet still runs dev.
- `strong_migrations` flag unsafe migrations (non-null column no default, renaming column in use, etc.) before hit real DB.
- `anyway_config` available for typed, validated config classes under `app/configs` once plain `ENV[]` reads outgrow themselves.

```sh
EVENT_PROF=sql.active_record bundle exec rspec spec/requests   # TestProf, opt-in
RAILS_ENV=test bundle exec database_consistency
```

CI run `database_consistency` against prepared test DB, narrow exceptions for Devise's conditional email validation + reset-token index.

## Gemfile of dreams comparison

Tracks [Evil Martians article](https://evilmartians.com/chronicles/gemfile-of-dreams-libraries-we-use-to-build-rails-apps). List alternatives + app-specific tools, absence ≠ missing capability.

| Area | Template decision |
| --- | --- |
| Inertia serialization | Alba, alba-inertia, Typelizer; JS Routes |
| Jobs | Solid Queue + Mission Control Jobs |
| Auth and data | Devise, Action Policy, Pagy, Discard, store_attribute, store_model |
| Dev and security | Vite, Bootsnap, Bullet, rack-mini-profiler, Brakeman, bundler-audit |
| Testing and safety | Lograge, Letter Opener Web, WebMock, VCR, FactoryBot, strong_migrations, anyway_config, TestProf, rubocop-rspec, n_plus_one_control |
| Database checks | database_consistency enforced in CI |
| Database and assets | SQLite + Node/npm for now; Postgres tools (e.g. pghero) and Bundlebun swap in once app moves to Postgres |
| Add when needed | AI, GraphQL, payment, feature-flag, metrics tools |