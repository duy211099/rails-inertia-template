# Admin User Management — Sub-project #1: User Index/Detail (read-only)

## Context

Admin site now got one page: `admin/dashboard` (all items, cross-user). Product want bigger admin user-management area: browse/inspect users, assign roles/permissions, ban/suspend users w/ session revocation, track presence/device sessions. Full scope too big for one spec — split into independent sub-projects, build order:

1. **User index/detail pages (this spec)** — read-only foundation everything else link from.
2. Role & permission CRUD (need `roles.level` column; dynamic roles beyond fixed `Role::LEVELS`).
3. Ban/suspend + immediate session revocation (`banned_at` on users, bump `jti`).
4. Presence (`last_active_at`) + per-device `Session` model w/ revoke.

RBAC tables exist already, unused by any UI: `Role`, `Permission`, `UserRole`, `RolePermission`, w/ `User#role?`/`User#at_least?` helpers and fixed levels (`member: 0, dev: 10, admin: 20`).

## Goals

- Admin (role `admin` only) view paginated, searchable list of all users.
- Admin open user's detail page: roles, join date, item count.
- Establish routing/controller/policy/serializer pattern sub-projects #2–#4 build on (role assignment, ban action, session list added to show page later).

## Non-goals

- No role/permission editing, no ban/suspend action, no presence or device-session display — separate specs.
- No new DB columns or migrations this sub-project.

## Design

### Routes

`config/routes/admin.rb`, inside `namespace :admin`:

```ruby
resources :users, only: [ :index, :show ]
```

### Backend

- `Admin::UsersController < AdminController`
  - `index`: `authorize! User`; search by `name`/`email` (`ILIKE`) via `params[:q]`, ordered `created_at: :desc`, paginated w/ `pagy`. Renders `admin/users/index` w/ `UsersIndexResource.new({ users:, pagy: }).to_inertia`.
  - `show`: `authorize! find(params[:id]), with: UserPolicy`; renders `admin/users/show` w/ `{ user: UserSerializer.new(user) }`.
- `UserPolicy < ApplicationPolicy`
  - Override `index?` and `show?` to `admin?` (base class's `owner?` assume `user_id` column, `User` don't have).
  - No `relation_scope` override needed — index scoping admin-only, done in controller.
- `UserSerializer` (existing, extend):
  - Add `created_at` (via `typelize_from`, already cover all columns — just add to `attributes`).
  - Add computed `items_count` attribute (`typelize items_count: "integer"`, `attribute(:items_count) { |user| user.items.size }`).
- `UsersIndexResource` (new, `app/serializers/resources/users_index_resource.rb`, mirror `ItemsIndexResource`): bundle `{ users: UserSerializer.new(users, params: {...}), pagy: PagySerializer.new(pagy) }`.

### Frontend

- `app/frontend/pages/admin/users/index.tsx`
  - `Page width="wide"` + `PageHeader` ("Users").
  - Search `Field`/`Input` bound to `q` query param, `router.get(adminUsersPath(), { q }, { preserveState: true, preserveScroll: true, replace: true })`.
  - `DataTable<User>` columns: avatar+name (primary), email, roles (as `Badge variant="secondary"` per role), created date (`hideBelow: 'md'`).
  - Row click (`rowHref`) → `adminUserPath(user.id)`. No row actions yet (no edit/delete this sub-project).
  - `ResourceIndex` wraps for empty/ready states; `DataTablePagination` from `pagy`.
- `app/frontend/pages/admin/users/show.tsx`
  - `Page` + `PageHeaderBack` to users index, heading = user name.
  - `DetailLayout` > `Card` w/ `DescriptionList`: email, roles (badges), item count, joined date (`created_at`).
  - No actions/buttons yet — placeholders for role assignment (#2) and ban (#3) land later.
- i18n: `admin/users/index` and `admin/users/show` namespaces, follow existing `items/*` locale file convention (`config/locales/` or wherever `items/index` live — mirror exact).

### Testing

- Request spec: `spec/requests/admin/users_spec.rb` — non-admin get redirected (403/redirect per existing `AdminController` behavior), admin can list/search/paginate, admin can view user's show page, 404 for unknown id.
- Policy spec: `spec/policies/user_policy_spec.rb` — admin allowed, non-admin denied both `index?` and `show?`.

## Open questions / risks

- None blocking. Search simple `ILIKE` on two columns; no need search gem at this scale.