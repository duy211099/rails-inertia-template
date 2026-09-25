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
mise exec -- bin/rails test
mise exec -- bin/rails zeitwerk:check
mise exec -- bin/rubocop
mise exec -- npm run check
mise exec -- npm run lint
mise exec -- npm run build
mise exec -- bin/brakeman --no-pager
mise exec -- bin/bundler-audit
mise exec -- npm audit
```

The system-test scaffold currently has no active browser tests.

## Production image

```sh
docker build -t rails_inertia_template .
```

The build stage installs Node and builds Vite assets. The final image contains
Ruby, production gems, and compiled assets; Node and `node_modules` stay out of
the runtime image. Supply `RAILS_MASTER_KEY` when running the container.
Production storage uses Cloudflare R2 and requires `R2_ENDPOINT`,
`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET`.
