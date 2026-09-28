# Supported dependency upgrade implementation plan

> Implement inline via superpowers:executing-plans. User authorize repo update, specify mise for runtime mgmt.

**Goal:** Update template to current stable deps + latest Node LTS.

**Architecture:** Pin Ruby 4.0.7, Node 24.21.0 in mise. Keep local setup, CI, Docker aligned, regen both lockfiles, validate existing behavior.

**Tech Stack:** Ruby, Rails 8.1, SQLite, Inertia, React, TypeScript, Vite, Tailwind, npm.

**Spec:** User request: "update this repo to latest lts dependencies, framework, language or anything"; runtime mgmt must use mise.

## Constraints and review focus

- Stable releases only; Node 24 LTS, Ruby/Rails use maintenance policies.
- Preserve app behavior + existing data; no prod migration or deploy.
- Stay on existing `chore/update-deps` branch; leave changes reviewable, uncommitted.
- Ensure Node types match Node 24, native gems support Ruby 4, Docker can build Vite assets.
- Check TypeScript 7 compat, dep audits, CI/runtime version consistency.

## Tasks

- [x] Record baseline: 23 Rails tests / 41 assertions pass; TypeScript checks + Biome lint pass.
- [x] Pin + install runtimes with mise; sync Ruby requirement, CI, Docker, README.
- [x] Update stable Ruby + npm deps + lockfiles; adjust config only where required.
- [x] Run Rails tests, Zeitwerk, Ruby/frontend lint, TypeScript, prod/test asset builds, security audits.
- [x] Review diff, report verified results + limitations.

## Verification commands

Run under `mise exec --`:

```sh
bundle check
bin/rails test
bin/rails zeitwerk:check
bin/rubocop
npm ci
npm run check
npm run lint
npm run build
npm run build -- --mode=test
bin/brakeman --no-pager
bin/bundler-audit
npm audit
```

System tests currently no active cases; don't treat zero-test run as browser coverage. Attempt Docker build if local Docker engine available.

## Results and release sources

- Ruby 4.0.7 + Node 24.21.0 installed via mise; Bundler pinned to stable 4.0.21.
- Rails 8.1.4; all direct gems current per `bundle outdated --only-explicit`.
- All direct npm packages current; `@types/node` intentionally follows Node 24, not Node 26.
- Clean `npm ci`, TypeScript 7 checks, Biome lint, RuboCop (66 files), Zeitwerk, prod/test Vite builds all pass.
- Rails: 23 tests, 41 assertions, no failures/errors/skips. System tests: zero active.
- Brakeman: zero warnings. Bundler + npm audits: zero vulnerabilities.
- Independent review found no important issues. Solid Queue's new optional batch schema not needed for existing job behavior.
- Existing build warnings remain for generated js-routes CommonJS compat code + standalone CSS partial with `@theme`. Prod boot also notes existing missing optional `ruby-vips` adapter; app currently defines no attachments/variants.
- npm is version bundled with Node LTS (11.19.0); no global npm upgrade needed.

Release info verified 2026-09-25:

- [Ruby downloads and maintenance](https://www.ruby-lang.org/en/downloads/)
- [Node release index](https://nodejs.org/dist/index.json)
- [Rails 8.1.4](https://rubygems.org/gems/rails/versions/8.1.4)
- [TypeScript 7 release](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
- npm + RubyGems registry queries determined remaining stable package versions.

- Final Docker build passed with Bundler 4.0.21, no prebuilt local assets in its context.
- Final prod-container eager-load smoke test passed with dummy R2 settings, networking disabled: Ruby 4.0.7 / Rails 8.1.4 / Bundler 4.0.21. Verified compiled Vite manifest exists, Node/node_modules absent. Real R2 connectivity not tested.