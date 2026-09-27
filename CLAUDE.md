# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repo.

## Common Commands

### Development
```bash
bin/dev                          # Start Rails + Vite dev servers (via Procfile.dev)
bin/rails db:setup               # Create and seed database
```

### Testing
```bash
bin/test                        # Build assets, prepare test DBs, run RSpec with 2 workers
PARALLEL_TEST_PROCESSORS=4 bin/test  # Run RSpec with 4 isolated workers
bundle exec rspec spec/models/user_spec.rb  # Run a single spec file
bundle exec rspec spec/requests/items_spec.rb:28  # Run one example at a line
npm test                        # Run frontend unit/component tests
npm run test:watch               # Watch frontend tests
```

### Linting & Formatting
```bash
bin/rubocop                      # Lint Ruby (Rails Omakase style)
bin/rubocop -a                   # Auto-fix Ruby offenses
npm run lint                     # Lint TypeScript with Biome
npm run lint:fix                 # Auto-fix TypeScript
npm run format                   # Format frontend code
npm run check                    # TypeScript type checking
```

### Security
```bash
bin/brakeman                     # Rails security scan
bin/bundler-audit                # Gem vulnerability audit
```

### Type Generation
```bash
npm run generate:types          # Regenerate TypeScript types from serializers
RAILS_ENV=test bin/check-types   # Verify generated files without rewriting them
```

## Architecture Overview

### Backend → Frontend Data Flow

App use **Inertia.js** bridge Rails+React — no API. Controllers render Inertia responses (not JSON/HTML), pass serialized data as props to React components.

1. Rails controller call `render inertia: 'ComponentName', props: { data: serializer.new(record).serializable_hash }`
2. `InertiaController` (base) shares `flash` + `user` props every request
3. Serializers (`app/serializers/`) use **Alba**, transform keys **camelCase** for React
4. `typelizer` gem gen TS types from serializers — run `npm run generate:types` after serializer changes
5. React pages get typed props, render, no extra API calls

### Page Components

React pages live `app/frontend/pages/`, resolved by name in `app/frontend/entrypoints/inertia.tsx`. File name matches component name passed to `render inertia:`.

### Routing

Routes split into modular files under `config/routes/`:
- `public.rb` — unauthenticated pages
- `devise.rb` — auth routes
- `demo.rb` — demo/example routes
- `items.rb` — CRUD resource routes

JS route helpers gen by `js-routes` gem, live in `app/frontend/lib/`.

### Authentication & Authorization

- **Devise** handles auth (email/password + Google OAuth2)
- **ActionPolicy** handles authorization via policy classes `app/policies/`
- Controllers call `authorize!` before actions; `authorized_scope` for collections
- `ItemPolicy` restricts all CRUD to record owner via `owner?` predicate

### Key Patterns

**Soft deletes**: `Item` uses `Discard` gem. `default_scope` filters to `kept` records — use `Item.with_discarded` for soft-deleted records too.

**Audit trail**: `Item` has `has_paper_trail` — all changes stored in `versions` table with `whodunnit` (user ID).

**Serialization**: Extend `BaseSerializer`, auto-converts keys camelCase. Add new serializers here when exposing new models to frontend. `BaseSerializer` at `app/serializers/base_serializer.rb`.

**Pagination**: Use `Pagy` for collections. Pass `@pagy` metadata via `PagySerializer` to frontend.

**Frontend imports**: Use `@/` or `~/` path aliases (both resolve `app/frontend/`).

### Tech Stack

| Layer | Technology |
|---|---|
| Backend | Rails 8.1, Ruby 4.0 |
| Frontend | React 19, TypeScript 7, Vite 8 |
| Styling | Tailwind CSS v4 |
| UI components | Radix UI + shadcn/ui pattern |
| DB (all envs) | PostgreSQL (separate DBs for cache/queue/cable) |
| Auth | Devise + OmniAuth Google |
| Authorization | ActionPolicy |
| Background jobs | Solid Queue + Mission Control Jobs |
| Linting (Ruby) | RuboCop (Rails Omakase) |
| Linting (JS) | Biome (single quotes, no semicolons, 100 char width) |
| Git hooks | Lefthook (auto-format on commit, test on push) |

### Environment Variables

See `.env.example` for PostgreSQL vars (`DB_HOST`, `DB_PORT`, optional `DB_USERNAME`/`DB_PASSWORD`), Google OAuth creds (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`), prod Cloudflare R2 settings. Needs local PostgreSQL reachable via peer/trust auth for current OS user; dev email inbox needs no external service creds.

### Collection props and type safety

`ApplicationResource` includes Alba's Inertia helper. Collection controllers use explicit page resources + `.to_inertia` for lazy prop eval on partial reloads. Keep authorization + query scoping in controllers. Page prop names stay as declared; model serializers use camelCase, don't transform nested audit JSON. `typelize_from` infers model fields, `typelize` declares computed fields. Don't hand-edit generated types or duplicate Pagy types in frontend.

### Development tooling

- Dev email inbox: `/letter_opener` (never mounted in production).
- Prod request summaries: Lograge JSON, no request params.
- Backend HTTP: WebMock blocks external calls; stub requests explicitly.
- Test profiling: `EVENT_PROF=sql.active_record bundle exec rspec spec/requests`.
- DB checks: `RAILS_ENV=test bundle exec database_consistency`.
- `bin/test` checks generated types once before starting parallel workers.

## Keel design system: instructions for UI work

App UI is **Keel**, SaaS/admin design system on **shadcn/ui** (Radix primitives, Base UI for Combobox), **React 19**, **Tailwind CSS v4**, **Rails + Inertia**. Keel = shadcn w/ own tokens, extra variants, product patterns on top. Read this before writing any UI.

**Naming follows shadcn exactly.** Use shadcn component names, parts, props, token names: `Dialog`, `AlertDialog`, `Sheet`, `Separator`, `Progress`, `Field`, `Empty`, `Toaster` + `toast()`, `bg-primary`, `text-muted-foreground`. shadcn has it → Keel uses shadcn's name.

### Where things are

| Path | What |
| --- | --- |
| `components.json` | shadcn CLI config: new-york, `@/components`, `@/components/ui`, `@/lib/utils`, `@/hooks`, lucide |
| `app/frontend/components/ui/` | shadcn/ui components (Keel-edited, marked `// Keel:`) + Keel additions: `number-input`, `autocomplete`, `date-picker`, `description-list` |
| `app/frontend/components/layout/` | Keel primitives: `stack.tsx` (`Stack`, `Inline`), `grid.tsx`, `container.tsx`, `text.tsx` |
| `app/frontend/components/patterns/` | Keel blocks: `app-shell`, `app-sidebar`, `page-header`, `detail-layout`, `resource-index`, `data-table/`, `save-bar`, `settings`, `dashboard` |
| `app/frontend/components/app-link.tsx` | `AppLink` = Inertia `Link`. Only file importing Inertia |
| `app/frontend/styles/globals.css` | **Generated** from `design/tokens.json`. Never hand-edit |
| `design/tokens.json`, `design/tools/` | Token source; `build-tokens.mjs` (tokens → globals.css); `keelify.mjs` (codemod for new shadcn files) |
| `app/frontend/layouts/AppLayout.tsx` | Persistent layout wrapping `AppShell`, fed from Inertia shared props |
| `app/frontend/layouts/PublicLayout.tsx` | Bare layout (Toaster only) for pages outside app shell (marketing, auth) |

Import from each file, shadcn-style: `import { Button } from "@/components/ui/button"`.

### Before building a screen

1. ID its template: Dashboard, Resource index, Resource detail, Create, Edit, Settings, Auth, Onboarding, Empty account, Error.
2. Compose order: patterns (`Page`, `PageHeader`, `ResourceIndex`, `DataTable`, `DataTableToolbar`, `DetailLayout`, `SettingsLayout`, `SettingsSection`, `SaveBar`, `MetricStrip`), then shadcn components, then layout primitives.
3. `app/frontend/pages/items/index.tsx` and `show.tsx` = reference impl of Resource index / Resource detail templates in this app — follow structure for new resources.

### Adding a shadcn component that isn't here yet

```bash
npx shadcn@latest add accordion
node design/tools/keelify.mjs app/frontend/components/ui/accordion.tsx
```

Always run keelify after `shadcn add`. Rewrites import aliases, focus ring, `dark:` utilities, shadows, outline controls to Keel rules. Never `shadcn add --overwrite` file w/ `// Keel:` edits without re-applying them.

### Hard rules (PR breaking one = wrong)

- **Colours only via shadcn/Keel token utilities**: `bg-background`, `bg-card`, `bg-muted`, `bg-surface`, `text-foreground`, `text-muted-foreground`, `border-border`, `border-input`, `text-destructive`, `bg-success-muted text-success`, `bg-selected`… Never `bg-gray-*`, `text-red-*`, hex, `bg-[#…]` or inline style colours. Raw Tailwind palette removed on purpose.
- **No `dark:` variants.** Dark mode = `.dark` class on `<html>` + tokens.
- **Spacing**: `Stack` / `Inline` / `Grid` w/ `gap` (`2xs` 4 · `xs` 8 · `sm` 12 · `md` 16 · `lg` 24 · `xl` 32), or shadcn's own containers (`CardContent`, `FieldGroup`). No margins on children, no off-scale values like `mt-[13px]`.
- **Typography**: `Text variant` or Tailwind's scale (body `text-sm`). Weights 400/500/600 only. Sentence case.
- **Buttons**: one `variant="default"` (filled) button per context: page header, card, dialog or form end. Others `outline`, `ghost` or `link`. Icon-only buttons = `size="icon"` w/ `aria-label` + `Tooltip`. Labels = verb+noun ("Create customer"), never "Submit", "OK" or "Yes". Loading = `disabled` + `<Spinner />`.
- **Status**: `Badge variant="success|warning|destructive|info|secondary|outline"`. Word always carries meaning, not just colour.
- **Not everything a card.** Cards hold one object or one field group. Page headers, alerts, metrics sit on background. Never nest cards. No shadows on resting surfaces.
- **Destructive actions**: `variant="destructive-outline"` (or destructive `DropdownMenuItem`) → `AlertDialog` whose `AlertDialogAction variant="destructive"` repeats action ("Delete 3 orders"). Reversible actions (archive) happen immediately w/ Undo `toast()`, no confirmation.
- **Forms**: every control sits in `Field` w/ `FieldLabel`, optional `FieldDescription`, `FieldError`. Errors say what's wrong + how to fix. Mark optional fields "(optional)", not required ones.
- **Overlays**: `Dialog` for short focused tasks, `AlertDialog` for confirmations, `Sheet` for side panels, `Popover` for small anchored editors, `DropdownMenu` for action lists.
- **Feedback**: `Alert` for page/section condition, `toast()` for completed actions, `Skeleton` for loading regions. No full-page spinners.
- **Every data region designs its states**: loading, empty (`Empty`), no results, error, partial.
- **Accessibility**: real `<button>`/`<a>`; never remove focus rings; keep Radix's keyboard+ARIA behaviour; check both themes vs WCAG AA.
- **Don't fork components for one screen.** Add generic variant to shadcn file w/ `// Keel:` comment, or ask.

### Inertia / Rails conventions

- `AppShell` lives in `AppLayout`, mounted as default Inertia persistent layout in `app/frontend/entrypoints/inertia.tsx`; `currentPath = usePage().url`. Shell data (user, workspace, nav) from shared props (`InertiaController`).
- Wrap root in `<TooltipProvider>`; `AppShell` already renders `<Toaster />`.
- Links: `AppLink` w/ `asChild` (`<Button asChild>`, `<SidebarMenuButton asChild>`, `<BreadcrumbLink asChild>`).
- Index pages: filters, search, sort, view, page = **URL query params**. Changes call `router.get(url, params, { preserveState: true, preserveScroll: true, replace: true })`. `DataTable` = TanStack Table w/ `manualSorting`/`manualPagination`.
- Forms: `useForm`. Rails 422 errors map to `FieldError` by attribute, `Alert` at top summarises them. Edit pages use `SaveBar open={form.isDirty}`; create pages end w/ `Cancel` · **Create …**. Guard unsaved changes w/ `useUnsavedChangesGuard` (`app/frontend/hooks/use-unsaved-changes-guard.ts`).
- Flash messages go to `toast()` (wired globally in `inertia.tsx` via `router.on('flash', …)`).
- Components never fetch page data or import Inertia (except `app-link.tsx`). Pages translate component events into visits.

### Definition of done for UI work

- `npm run check` passes; no raw colours, `dark:` or arbitrary values added.
- Works light + `.dark`, at 375px and 1440px, keyboard-only too.
- Loading, empty, error states exist for every data region.