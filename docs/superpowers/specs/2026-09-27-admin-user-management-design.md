# Admin User Management — Sub-project #1: User Index/Detail (read-only)

## Context

Admin site currently has one page: `admin/dashboard` (all items, cross-user). Product wants a
broader admin user-management area covering: browsing/inspecting users, assigning
roles/permissions, banning/suspending users with session revocation, and tracking
presence/device sessions. That full scope is too large for one spec, so it's split into
independent sub-projects, built in this order:

1. **User index/detail pages (this spec)** — read-only foundation everything else links from.
2. Role & permission CRUD (needs `roles.level` column; dynamic roles beyond fixed `Role::LEVELS`).
3. Ban/suspend + immediate session revocation (`banned_at` on users, bump `jti`).
4. Presence (`last_active_at`) + per-device `Session` model with revoke.

RBAC tables already exist and are unused by any UI: `Role`, `Permission`, `UserRole`,
`RolePermission`, with `User#role?`/`User#at_least?` helpers and fixed levels
(`member: 0, dev: 10, admin: 20`).

## Goals

- Admin (role `admin` only) can view a paginated, searchable list of all users.
- Admin can open a user's detail page showing roles, join date, and item count.
- Establish the routing/controller/policy/serializer pattern that sub-projects #2–#4 build on
  (role assignment, ban action, and session list will be added to the show page later).

## Non-goals

- No role/permission editing, no ban/suspend action, no presence or device-session display —
  those are separate specs.
- No new database columns or migrations in this sub-project.

## Design

### Routes

`config/routes/admin.rb`, inside `namespace :admin`:

```ruby
resources :users, only: [ :index, :show ]
```

### Backend

- `Admin::UsersController < AdminController`
  - `index`: `authorize! User`; search by `name`/`email` (`ILIKE`) via `params[:q]`, ordered
    `created_at: :desc`, paginated with `pagy`. Renders `admin/users/index` with
    `UsersIndexResource.new({ users:, pagy: }).to_inertia`.
  - `show`: `authorize! find(params[:id]), with: UserPolicy`; renders `admin/users/show` with
    `{ user: UserSerializer.new(user) }`.
- `UserPolicy < ApplicationPolicy`
  - Overrides `index?` and `show?` to `admin?` (the base class's `owner?` assumes a `user_id`
    column, which `User` doesn't have).
  - No `relation_scope` override needed — index scoping is admin-only, done in the controller.
- `UserSerializer` (existing, extend):
  - Add `created_at` (via `typelize_from`, already covers all columns — just add to
    `attributes`).
  - Add computed `items_count` attribute (`typelize items_count: "integer"`,
    `attribute(:items_count) { |user| user.items.size }`).
- `UsersIndexResource` (new, `app/serializers/resources/users_index_resource.rb`, mirrors
  `ItemsIndexResource`): bundles `{ users: UserSerializer.new(users, params: {...}), pagy: PagySerializer.new(pagy) }`.

### Frontend

- `app/frontend/pages/admin/users/index.tsx`
  - `Page width="wide"` + `PageHeader` ("Users").
  - Search `Field`/`Input` bound to `q` query param, `router.get(adminUsersPath(), { q }, { preserveState: true, preserveScroll: true, replace: true })`.
  - `DataTable<User>` columns: avatar+name (primary), email, roles (as `Badge variant="secondary"` per role), created date (`hideBelow: 'md'`).
  - Row click (`rowHref`) → `adminUserPath(user.id)`. No row actions yet (no edit/delete in this sub-project).
  - `ResourceIndex` wraps for empty/ready states; `DataTablePagination` from `pagy`.
- `app/frontend/pages/admin/users/show.tsx`
  - `Page` + `PageHeaderBack` to users index, heading = user name.
  - `DetailLayout` > `Card` with `DescriptionList`: email, roles (badges), item count, joined
    date (`created_at`).
  - No actions/buttons yet — placeholders for role assignment (#2) and ban (#3) land later.
- i18n: `admin/users/index` and `admin/users/show` namespaces, following existing `items/*`
  locale file convention (`config/locales/` or wherever `items/index` lives — mirror exactly).

### Testing

- Request spec: `spec/requests/admin/users_spec.rb` — non-admin gets redirected (403/redirect
  per existing `AdminController` behavior), admin can list/search/paginate, admin can view a
  user's show page, 404 for unknown id.
- Policy spec: `spec/policies/user_policy_spec.rb` — admin allowed, non-admin denied for both
  `index?` and `show?`.

## Open questions / risks

- None blocking. Search is a simple `ILIKE` on two columns; no need for a search gem at this
  scale.
