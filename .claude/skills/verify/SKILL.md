---
name: verify
description: Drive the real Rails + Inertia + React app (WithDui template) in a browser or over its JSON API to prove a change works the way a user sees it. Launches an isolated Rails server on port 3100, signs in a throwaway user without Google, drives pages with the Playwright MCP, and captures screenshots, accessibility snapshots and DB state. Use after any UI, controller, policy, serializer or API change, or when asked to verify, demo, or screenshot the app.
---

# Verify the app

The primary surface is the web UI (Inertia pages under `app/frontend/pages/`). The JSON API at `/api/v1` is the second surface. Mission Control Jobs (`/jobs`) and the dev inbox (`/letter_opener`) are tools, not features.

All lifecycle steps go through one helper. Run it from the repo root:

```bash
.claude/skills/verify/bin/verify up            # start + wait until a page renders
.claude/skills/verify/bin/verify doctor        # is this instance worth driving?
.claude/skills/verify/bin/verify user          # throwaway member; prints EMAIL= / PASSWORD=
.claude/skills/verify/bin/verify user --admin  # same, with the admin role
.claude/skills/verify/bin/verify evidence-dir  # prints a fresh tmp/verify/evidence/<stamp>/
.claude/skills/verify/bin/verify down          # stop the server this helper started
.claude/skills/verify/bin/verify purge         # delete throwaway users + their items
```

`VERIFY_PORT=3200` runs a second instance side by side; every subcommand honours it.

## Launch

`verify up` checks PostgreSQL (`pg_isready`), runs `bin/rails db:prepare` (creates, migrates and seeds roles from an empty DB), then starts `bin/rails server -p 3100 -b 127.0.0.1` in the background, with its pid in `tmp/pids/verify-3100.pid` and its log in `tmp/verify/server-3100.log`.

Ready means a page renders, not just that a process answers. `up` waits for `/up` to return 200, then for `GET /` to return HTML containing `data-page` (the Inertia payload). A cold start can take a minute, because vite_ruby builds assets into `public/vite-dev` on the first request when no Vite dev server is running. If the user's `bin/dev` is running, Rails uses its Vite dev server on 3036 instead. Both paths work, and neither touches the user's Rails on 3000.

Isolation limits: the instance has its own port and pid, but it **shares the development database** (`rails_inertia_template_development`) with the user's `bin/dev`. Only create data through throwaway users (`verify-*@example.test`), never edit records you did not create, and run `verify purge` when you are done.

## Doctor

Run `verify doctor` first, and again whenever anything looks off. It is read-only and exits non-zero if any line fails:

- `process`: the pid in our pid file is alive
- `port`: the listener on the port is that pid, not someone else's server
- `health`: `/up` returns 200
- `render`: the home page contains an Inertia `data-page` payload
- `git`: the commit the server is running, plus `+dirty` if the tree has changes. Rails reloads code in development, so a dirty tree is expected while you verify a change.

If `port` says NOT OURS, do not drive that instance. Pick another `VERIFY_PORT`.

## Drive

**Browser: Playwright MCP** (`mcp__plugin_playwright_playwright__*`). Load the tools in one ToolSearch call: `browser_navigate, browser_evaluate, browser_snapshot, browser_click, browser_fill_form, browser_type, browser_take_screenshot, browser_close`.

Always use `http://localhost:<port>`, never `127.0.0.1`. `config/routes/public.rb` redirects `127.0.0.1` to `localhost`, which drops cookies across the hop.

**Sign in.** The login page (`/users/sign_in`) only shows "Continue with Google", and OAuth cannot be driven here. Devise's password endpoint still works, so create a user with `verify user`, navigate to `http://localhost:3100/users/sign_in`, then run `browser_evaluate`:

```js
async () => {
  const token = document.querySelector('meta[name="csrf-token"]').content
  const body = new URLSearchParams({
    authenticity_token: token,
    'user[email]': '<EMAIL>',
    'user[password]': '<PASSWORD>',
  })
  const r = await fetch('/users/sign_in', { method: 'POST', body, credentials: 'same-origin' })
  return { status: r.status, url: r.url }
}
```

Success returns `{ status: 200, url: "http://localhost:3100/" }`. A `url` still ending in `/users/sign_in` means the credentials were rejected. After 5 failures Devise `:lockable` locks the account, so create a fresh user instead of retrying.

**Selectors.** Use roles and accessible names from `browser_snapshot`, or the form ids, rather than refs or coordinates. Snapshot refs change between pages. Verified handles:

- `role=main >> role=link[name="New item"] >> nth=0`: the header button on `/items`. The sidebar and the empty state also have one, so scope to `main`.
- `#name`, `#description`, `#phoneNumber`: item form fields on `/items/new` and `/items/:id/edit`
- `role=button[name="Create Item"]`: item create submit
- Flash toasts render as text in the snapshot, e.g. `Item was successfully created.`

UI strings come from `app/frontend/locales/<page>/en.json`. If a selector misses, read the locale file for the current label rather than guessing.

**API.** Use curl against `/api/v1`. `POST /api/v1/session` with JSON `{"email","password"}` returns the JWT in the `Authorization` response header. Send that header back on later requests. See `features/api.md`.

**DB side effects.** `bin/rails runner '<ruby>'` reads the same development DB. Remember that `Item` has a `default_scope` of kept records, so use `Item.with_discarded` to see soft-deleted ones.

## Evidence

Run `verify evidence-dir` once per run and save everything there. It lives under `tmp/verify/evidence/<stamp>/`, which is gitignored and survives `verify down` and `verify purge`.

- Screenshot after each meaningful action: `browser_take_screenshot` with `filename: "<evidence-dir>/<step>.png"` (relative to the repo root), plus `fullPage: true`.
- Accessibility snapshot of the end state: copy the `.playwright-mcp/page-*.yml` file the tool just reported into the evidence dir. `.playwright-mcp/` is gitignored and holds every snapshot, so copy only the one you need.
- DB state: a `bin/rails runner` that prints JSON, piped through `tee <evidence-dir>/db-state.json`.
- API: save `curl -D` headers and the body, with the bearer token redacted.

Proof standards:

- Drive the real user path: click the button the user clicks, and submit the form the user submits. Do not call controllers or models directly as the action.
- Capture both the action and the resulting state, e.g. the form before submit and the index after it with the toast.
- Verify side effects alongside the screen. For items that means the row, the owner, and the PaperTrail `versions` row with `whodunnit` equal to the user id.
- Sign-in is the one sanctioned shortcut. It uses the same Devise endpoint a password form would post to, because Google OAuth cannot be driven.
- WebMock only exists in specs, so the running server makes real outbound calls. Do not drive flows that call Google, Resend or R2 and report them as verified.

## Cleanup

```bash
.claude/skills/verify/bin/verify down    # kills only the pid in tmp/pids/verify-<port>.pid
.claude/skills/verify/bin/verify purge   # removes verify-*@example.test users and their items
```

Then call `browser_close`. Never `pkill ruby`/`puma`. The user's `bin/dev` may be running. Evidence in `tmp/verify/evidence/` is never deleted by cleanup.

## Feature map

`features/README.md` indexes one file per user-facing feature: how to reach it, how to drive it, and the end state that proves it works. A proof that covers one entry point is incomplete when the map lists others. Keep the map current with `/maintain-verification-skill`.
