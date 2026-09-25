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

`bin/test` builds test assets once, prepares a separate SQLite database for each
worker (`storage/test.sqlite3`, `storage/test2.sqlite3`, etc.), and runs the specs.
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
