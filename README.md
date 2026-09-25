# Rails + Inertia template

Rails 8.1, SQLite, Inertia, React, TypeScript, Vite, and Tailwind CSS.

## Setup

Use [mise](https://mise.jdx.dev/) to install the project runtimes:

```sh
mise trust
mise install
mise exec -- bin/setup
```

`mise.toml` pins Ruby 4.0.7 and Node 24.21.0 (LTS). If mise is activated in
your shell, you can omit `mise exec --`. Keep `.ruby-version` and the Dockerfile
runtime arguments in sync with these pins. CI reads Ruby from `.ruby-version`
and the supported Node 24 range from `package.json`.

Ruby and Rails do not label these releases LTS; this template uses their current
stable, maintained releases. Dependency versions are locked in `Gemfile.lock`
and `package-lock.json`.

## Development

```sh
mise exec -- bin/dev
```

The app uses SQLite, so no separate database server is required. `bin/setup`
installs dependencies and prepares the development database.

## Jobs, cache, and realtime without Redis

Production already uses Solid Queue, Solid Cache, and Solid Cable. Redis and
Sidekiq are not dependencies. Each Solid adapter has a separate SQLite database
under `storage/`, configured in `config/database.yml`; their schemas are checked
in under `db/`. Solid Cache has a 256 MiB entry-size budget (not a hard limit on
the SQLite file size).

Prepare all databases with `RAILS_ENV=production bin/rails db:prepare` using the
deployment environment. The Docker entrypoint does this when starting the Rails
server. Kamal sets `SOLID_QUEUE_IN_PUMA=true`, so Puma starts the job supervisor.
For a separate worker process on the same host/storage, omit that variable from
the web process and run `RAILS_ENV=production bin/jobs`. Prepare databases before
starting standalone workers; their command does not trigger the server entrypoint
preparation. Do not set the Puma variable to the string `false`: the current
configuration checks whether it is present.

Development uses Rails' in-process async job adapter, memory cache, and async
Action Cable; these do not need Redis either. Development jobs do not survive
process restarts, and separate processes do not share the memory cache or cable
broadcasts. Tests retain their lightweight test adapters. To exercise durable
development jobs, follow the [Solid Queue development setup](https://github.com/rails/solid_queue#usage-in-development-and-other-non-production-environments)
and add a development queue database, adapter configuration, and worker process.

The SQLite deployment is designed around one host with persistent storage. Back
up the primary and queue databases and test recovery. Separate machines with
independent SQLite files do not share jobs or application data; use a shared
database server when moving to multiple hosts. Monitor failed jobs, disk usage,
and queue delay. Jobs need explicit retry/idempotency decisions, and enqueueing
against a separate queue database needs transaction-boundary tests.

The `/jobs` dashboard currently requires login, **not an admin role**. Restrict
`config/initializers/mission_control.rb` before allowing untrusted users to sign
up. The commented admin example is not an enforced policy.

## Example JSON API

The `/api/v1/items` endpoints reuse the existing Devise sessions, Alba serializers,
Action Policy ownership rules, Pagy pagination, Discard soft deletes, and Paper
Trail attribution. Inertia pages remain at `/items`. API controllers return JSON
errors and do not apply the web controller's modern-browser restriction.

| Method | Endpoint | Result |
| --- | --- | --- |
| GET | `/api/v1/items?page=1&limit=12` | Owned, kept items and `pagy` metadata |
| GET | `/api/v1/items/:id` | One owned item |
| POST | `/api/v1/items` | Create an item; 201 with a Location header |
| PATCH / PUT | `/api/v1/items/:id` | Update supplied fields |
| DELETE | `/api/v1/items/:id` | Soft-delete; 204 with no body |

Lists sort by creation time then ID, descending. Page size defaults to 12 and is
capped at 100; invalid pagination returns 400 and out-of-range pages are empty.
Request attributes are `name`, `description`, and `phone_number`, nested under
`item`. Responses use camelCase keys. Client-supplied ownership is ignored.

Run `mise exec -- bin/dev`, register or sign in through the web app, then load
`/items`. Open the browser developer console and paste this helper:

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

Reload the page after signing in to get the current CSRF token. Requests require
an authenticated session; writes also require the token. This example has no
bearer-token login or cross-origin browser access. Native/mobile token lifecycles
and third-party OAuth should be designed when those clients are added.

Errors use `{ "error": { "code": "...", "message": "...", "details": {} } }`.
Unauthenticated requests return 401; inaccessible/deleted records return 404;
malformed parameters return 400; validation or CSRF failures return 422. Validation
`details` maps attribute names to message arrays. Policy denials return 403.

[OpenAPI 3.1 contract](docs/openapi.yml) documents all six operations, inputs,
authentication, pagination, and responses. [Skooma](https://github.com/evilmartians/skooma)
is a test-only dependency checking the document and actual request/response
contracts. The specs also exercise real Devise login and CSRF enforcement.

```sh
mise exec -- bin/test spec/requests/api
```

No extra serializer or API framework is needed. Add `rack-cors` only for browser
clients on other origins, or Doorkeeper when third-party OAuth is required.
Rate limiting, bearer-token auth, and retry/idempotency policies are not part of
this session-authenticated example. Configure those for the intended clients
before exposing a public API.

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

Backend tests use RSpec and [parallel_tests](https://github.com/grosser/parallel_tests).
Run the full suite with two workers:

```sh
mise exec -- bin/test
PARALLEL_TEST_PROCESSORS=4 mise exec -- bin/test
```

`bin/test` prepares a separate SQLite database for each
worker (`storage/test.sqlite3`, `storage/test2.sqlite3`, etc.), checks generated types,
builds test assets once, and runs the specs.
It reloads the test schemas on every run; it does not touch development data.
Each example rolls back its database changes using transactional fixtures.

Specs live in `spec/models`, `spec/policies`, `spec/serializers`, and
`spec/requests`; reusable fixture data lives in `spec/fixtures`. The former
Minitest checks have been migrated to RSpec. Rails generators now create RSpec
specs. There are currently no browser/system tests.

Run just the backend unit specs, or one spec while developing:

```sh
mise exec -- bin/test spec/models spec/policies spec/serializers
mise exec -- bundle exec rspec spec/models/user_spec.rb
mise exec -- bundle exec rspec spec/requests/items_spec.rb:28
```

Frontend unit and component tests use [Vitest](https://vitest.dev/guide/) with
React Testing Library and jsdom. Tests sit beside their source files as
`*.test.ts` / `*.test.tsx`. They do not require a running Rails server.

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

The build stage installs Node and builds Vite assets. The final image contains
Ruby, production gems, and compiled assets; Node and `node_modules` stay out of
the runtime image. Supply `RAILS_MASTER_KEY` when running the container.
Production storage uses Cloudflare R2 and requires `R2_ENDPOINT`,
`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET`.

## Serialization and Inertia props

Alba serializers define the JSON contract and Typelizer generates TypeScript
from those definitions. Extend `BaseSerializer`, use `typelize_from Model` for
model-backed fields, and add `typelize` annotations for computed fields.
Serializer keys are camelCase; audit snapshot contents keep their original keys.
Nullable database values generate `T | null`, and JSON timestamps are strings.

Page resources extend `ApplicationResource`. Collection pages pass
`Resource.new({ ... }).to_inertia` to `render inertia: ..., props: ...` so partial
reloads evaluate only requested props. Authorize and scope records in the
controller before passing them to a resource. Other responses use
`Serializer.new(record).serializable_hash`. Deferred loading is opt-in; the
existing pages load as before.

```sh
mise exec -- npm run generate:types
RAILS_ENV=test mise exec -- bin/check-types
```

Prepare the selected environment's database before generating types. Commit the
output under `app/frontend/types/serializers`; import types through `@/types`.
`bin/check-types` generates into a temporary directory and fails for changed,
missing, or extra files without rewriting checked-in output. `bin/test` runs it
once before parallel workers start. Typelizer's DSL is explicitly enabled in
the generator subprocess and disabled in test workers; production boots do not
generate files. JS Routes continues to own URL helpers. Generated files are
excluded from Biome transformations to keep generation deterministic.

## Email and request logs

Development mail is delivered locally by Letter Opener Web. Browse sent messages
at `/letter_opener`; delivery does not open a browser or need an SMTP server.
The inbox route exists only in development. Tests keep Action Mailer's `:test`
delivery method; production SMTP remains an application deployment setting.

Production request summaries use Lograge JSON on stdout, including method,
path, status, duration, and request ID. Query strings and request parameters are
not included. `/up` remains silent. Other Rails/application log messages retain
the existing logger.

## Test and database tooling

WebMock blocks external HTTP from backend specs; localhost remains available
for browser tests. Stub integrations explicitly with `stub_request`. Fixtures
and parallel workers remain the default; no factory library is required.

N+1 regression specs exercise item and audit listings at multiple collection
sizes. They warm up authentication before measuring reads. Bullet still detects
N+1 queries during development. RSpec lint runs with the existing Ruby lint
command; related assertions use failure aggregation.

TestProf profiling is opt-in. For a single-process profile:

```sh
EVENT_PROF=sql.active_record mise exec -- bundle exec rspec spec/requests
RAILS_ENV=test mise exec -- bundle exec database_consistency
```

CI runs database consistency against a prepared test database. The configuration
has narrow exceptions for Devise's conditional email validation and its
collision-checked reset-token index. OAuth identity uniqueness is validated in
the model and enforced by the existing database index.

## Gemfile of dreams comparison

This template adopts relevant parts of the
[Evil Martians article](https://evilmartians.com/chronicles/gemfile-of-dreams-libraries-we-use-to-build-rails-apps).
The article lists alternatives and application-specific tools, so absence alone
does not mean a missing capability.

| Area | Template decision |
| --- | --- |
| Inertia serialization | Alba, alba-inertia, Typelizer; retain JS Routes |
| Jobs | Existing Solid Queue and Mission Control Jobs |
| Auth and data | Existing Devise, Action Policy, Pagy, Discard, store_attribute, store_model |
| Development and security | Existing Vite, Bootsnap, Bullet, rack-mini-profiler, Brakeman, bundler-audit |
| New tooling | Lograge, Letter Opener Web, WebMock, TestProf, rubocop-rspec, n_plus_one_control |
| Database checks | Existing database_consistency now enforced in CI |
| Database and assets | Keep SQLite and Node/npm; PostgreSQL tools and Bundlebun are alternatives |
| Health checks and strings | Rails already silences `/up`; source files already freeze string literals |
| Add when needed | AI, GraphQL, payment, feature-flag, metrics, image-proxy, factory, and HTTP-recording tools |
