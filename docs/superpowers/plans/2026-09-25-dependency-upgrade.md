# Supported dependency upgrade implementation plan

> Implement inline using superpowers:executing-plans. The user authorized the repository update and specified mise for runtime management.

**Goal:** Update the template to current stable dependencies and the latest Node LTS.

**Architecture:** Pin Ruby 4.0.7 and Node 24.21.0 in mise. Keep local setup, CI, and Docker aligned, regenerate both lockfiles, and validate existing behavior.

**Tech Stack:** Ruby, Rails 8.1, SQLite, Inertia, React, TypeScript, Vite, Tailwind, npm.

**Spec:** User request: "update this repo to latest lts dependencies, framework, language or anything"; runtime management must use mise.

## Constraints and review focus

- Stable releases only; Node 24 is LTS, while Ruby and Rails use maintenance policies.
- Preserve application behavior and existing data; no production migration or deployment.
- Stay on the existing `chore/update-deps` branch; leave changes reviewable and uncommitted.
- Ensure Node types match Node 24, native gems support Ruby 4, and Docker can build Vite assets.
- Check TypeScript 7 compatibility, dependency audits, and CI/runtime version consistency.

## Tasks

- [x] Record baseline: 23 Rails tests / 41 assertions pass; TypeScript checks and Biome lint pass.
- [x] Pin and install runtimes with mise; synchronize Ruby requirement, CI, Docker, and README.
- [x] Update stable Ruby and npm dependencies and lockfiles; adjust configuration only where required.
- [x] Run Rails tests, Zeitwerk, Ruby/frontend lint, TypeScript, production/test asset builds, and security audits.
- [x] Review the diff and report verified results and any limitations.

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

System tests currently contain no active cases; do not treat a zero-test run as browser coverage. Attempt a Docker build if the local Docker engine is available.

## Results and release sources

- Ruby 4.0.7 and Node 24.21.0 installed with mise; Bundler pinned to stable 4.0.21.
- Rails 8.1.4; all direct gems current according to `bundle outdated --only-explicit`.
- All direct npm packages current; `@types/node` intentionally follows Node 24 rather than Node 26.
- Clean `npm ci`, TypeScript 7 checks, Biome lint, RuboCop (66 files), Zeitwerk, and production/test Vite builds pass.
- Rails: 23 tests, 41 assertions, no failures, errors, or skips. System tests: zero active tests.
- Brakeman: zero warnings. Bundler and npm audits: zero vulnerabilities.
- Independent review found no important issues. Solid Queue's new optional batch schema is not needed for existing job behavior.
- Existing build warnings remain for generated js-routes CommonJS compatibility code and a standalone CSS partial containing `@theme`. Production boot also notes the existing missing optional `ruby-vips` adapter; this app currently defines no attachments or variants.
- npm is the version bundled with Node LTS (11.19.0); no global npm upgrade is required.

Release information verified on 2026-09-25:

- [Ruby downloads and maintenance](https://www.ruby-lang.org/en/downloads/)
- [Node release index](https://nodejs.org/dist/index.json)
- [Rails 8.1.4](https://rubygems.org/gems/rails/versions/8.1.4)
- [TypeScript 7 release](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
- npm and RubyGems registry queries determined the remaining stable package versions.

- Final Docker build passed with Bundler 4.0.21 and no prebuilt local assets in its context.
- Final production-container eager-load smoke test passed with dummy R2 settings and networking disabled: Ruby 4.0.7 / Rails 8.1.4 / Bundler 4.0.21. Verified compiled Vite manifest exists and Node/node_modules are absent. Real R2 connectivity was not tested.
