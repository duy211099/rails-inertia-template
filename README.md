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
