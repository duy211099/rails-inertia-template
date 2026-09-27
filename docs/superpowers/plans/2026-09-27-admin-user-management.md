# Admin User Management (Sub-project #1: User Index/Detail) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give admins a paginated, searchable list of all users and a per-user detail page, as the read-only foundation later sub-projects (role/permission management, ban+revoke, presence/devices) will extend.

**Architecture:** Follow the existing `Admin::DashboardController` / `ItemsIndexResource` / `items/index.tsx` pattern exactly: a namespaced `Admin::UsersController` with `index`/`show`, a new `UserPolicy` (admin-only, no owner concept), an extended `UserSerializer`, a new `UsersIndexResource`, and two React pages using `DataTable`/`DataTableToolbar` for search and `DetailLayout`/`DescriptionList` for the detail view.

**Tech Stack:** Rails 8.1 + Inertia + Alba/Typelizer serializers + ActionPolicy + Pagy (backend); React 19 + TanStack Table (`DataTable`) + react-i18next (frontend).

**Spec:** `docs/superpowers/specs/2026-09-27-admin-user-management-design.md`

## Global Constraints

- Admin-only access: `index?`/`show?` on `UserPolicy` return `admin?` (from `ApplicationPolicy`), not `owner?` — `User` has no `user_id` column.
- No new database columns or migrations in this sub-project.
- Frontend colors: Keel/shadcn token utilities only, no raw Tailwind palette, no `dark:` variants.
- Search is a simple `ILIKE` on `name`/`email` via `params[:q]`, no search gem.
- After changing `UserSerializer`, run `npm run generate:types` to regenerate `User.ts`/`UsersIndex.ts` — do not hand-edit generated files.
- Index page state lives in the URL: search changes call `router.get(url, params, { preserveState: true, preserveScroll: true, replace: true })`.
- Follow `items/index.tsx` and `items/show.tsx` structurally: `Page` → `PageHeader` → `ResourceIndex`/`DetailLayout`.

## Review Focus

- Non-admin (including no role at all, and a `dev`-role user) hitting `/admin/users` or `/admin/users/:id` directly must be redirected with the access-denied alert — same as `AdminController#authenticate_admin!` already does for the dashboard root.
- `GET /admin/users/:id` with an id that doesn't exist must 404, not 500 (`ActiveRecord::RecordNotFound`).
- Search with a query that matches nothing must render the empty state, not error.
- A user with zero items must show `items_count: 0` (not `nil`) on both index and show.
- A user with `name: nil` (omniauth users can have blank name) must still render sensibly in the `DataTable` primary column and page heading (fall back to email).

---

### Task 1: Extend `UserSerializer` with `created_at` and `items_count`

**Files:**
- Modify: `app/serializers/user_serializer.rb`
- Test: `spec/serializers/user_serializer_spec.rb` (new)

**Interfaces:**
- Consumes: `User#items` (existing `has_many :items`).
- Produces: `UserSerializer.new(user).serializable_hash` includes `created_at` (ISO8601 string, via existing `typelize_from User`) and `items_count` (integer).

- [ ] **Step 1: Write the failing test**

```ruby
# spec/serializers/user_serializer_spec.rb
# frozen_string_literal: true

require "rails_helper"

RSpec.describe UserSerializer, type: :serializer do
  fixtures :users, :items

  it "includes created_at and items_count" do
    hash = described_class.new(users(:one)).serializable_hash

    expect(hash[:created_at]).to eq(users(:one).created_at.iso8601(3))
    expect(hash[:items_count]).to eq(1)
  end

  it "returns zero items_count for a user with no items" do
    user = User.create!(email: "no-items@example.com", password: "password123", name: nil)

    hash = described_class.new(user).serializable_hash

    expect(hash[:items_count]).to eq(0)
    expect(hash[:name]).to be_nil
  end
end
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bundle exec rspec spec/serializers/user_serializer_spec.rb -v`
Expected: FAIL — `created_at`/`items_count` keys absent from `serializable_hash`.

- [ ] **Step 3: Write minimal implementation**

```ruby
# app/serializers/user_serializer.rb
# frozen_string_literal: true

class UserSerializer < BaseSerializer
  typelize_from User

  attributes :id, :name, :email, :avatar_url, :created_at

  typelize roles: "string[]"
  attribute(:roles) { |user| user.roles.pluck(:name) }

  typelize items_count: "integer"
  attribute(:items_count) { |user| user.items.size }
end
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bundle exec rspec spec/serializers/user_serializer_spec.rb -v`
Expected: PASS

- [ ] **Step 5: Regenerate TypeScript types**

Run: `npm run generate:types`
This rewrites `app/frontend/types/serializers/User.ts` to include `createdAt: string` and `itemsCount: number`. Verify with `RAILS_ENV=test bin/check-types` (should report no diff after regenerating).

- [ ] **Step 6: Commit**

```bash
git add app/serializers/user_serializer.rb spec/serializers/user_serializer_spec.rb app/frontend/types/serializers/User.ts
git commit -m "feat: add created_at and items_count to UserSerializer"
```

---

### Task 2: `UserPolicy`

**Files:**
- Create: `app/policies/user_policy.rb`
- Test: `spec/policies/user_policy_spec.rb`

**Interfaces:**
- Consumes: `ApplicationPolicy#admin?` (existing, `user.at_least?(:admin)`).
- Produces: `UserPolicy.new(User, user: current_user).apply(:index?)` / `UserPolicy.new(some_user, user: current_user).apply(:show?)` — both `true` only when `current_user` is admin.

- [ ] **Step 1: Write the failing test**

```ruby
# frozen_string_literal: true

require "rails_helper"

RSpec.describe UserPolicy, type: :policy do
  fixtures :users

  %i[index? show?].each do |rule|
    it "denies a non-admin for #{rule}" do
      expect(described_class.new(users(:one), user: users(:one)).apply(rule)).to be(false)
    end

    it "allows an admin for #{rule}" do
      UserRole.create!(user: users(:two), role: Role.create!(name: "admin"))
      admin = User.find(users(:two).id)

      expect(described_class.new(users(:one), user: admin).apply(rule)).to be(true)
    end
  end
end
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bundle exec rspec spec/policies/user_policy_spec.rb -v`
Expected: FAIL — `uninitialized constant UserPolicy`.

- [ ] **Step 3: Write minimal implementation**

```ruby
# frozen_string_literal: true

class UserPolicy < ApplicationPolicy
  def index?
    admin?
  end

  def show?
    admin?
  end
end
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bundle exec rspec spec/policies/user_policy_spec.rb -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/policies/user_policy.rb spec/policies/user_policy_spec.rb
git commit -m "feat: add admin-only UserPolicy"
```

---

### Task 3: `UsersIndexResource`

**Files:**
- Create: `app/resources/users_index_resource.rb`

**Interfaces:**
- Consumes: `UserSerializer` (Task 1), `PagySerializer` (existing).
- Produces: `UsersIndexResource.new({ users:, pagy: }).to_inertia` — an Inertia-ready props hash with keys `users` (array) and `pagy`.

This resource is a thin declarative bundle with no branching logic, so it's covered by the controller request spec in Task 4 rather than its own unit test (mirrors `ItemsIndexResource`, which also has no dedicated spec).

- [ ] **Step 1: Write the implementation directly**

```ruby
# frozen_string_literal: true

class UsersIndexResource < ApplicationResource
  many :users, resource: UserSerializer
  one :pagy, resource: PagySerializer
end
```

- [ ] **Step 2: Commit**

```bash
git add app/resources/users_index_resource.rb
git commit -m "feat: add UsersIndexResource"
```

---

### Task 4: `Admin::UsersController` (index + show) and route

**Files:**
- Modify: `config/routes/admin.rb`
- Create: `app/controllers/admin/users_controller.rb`
- Test: `spec/requests/admin/users_spec.rb`

**Interfaces:**
- Consumes: `AdminController#authenticate_admin!` (existing before_action), `UserPolicy` (Task 2), `UsersIndexResource` (Task 3), `UserSerializer` (Task 1).
- Produces: `GET /admin/users` renders Inertia component `admin/users/index` with props `{ users:, pagy: }`; `GET /admin/users/:id` renders `admin/users/show` with props `{ user: }`.

- [ ] **Step 1: Add the route**

```ruby
# config/routes/admin.rb
# frozen_string_literal: true

namespace :admin do
  root to: "dashboard#index"
  resources :users, only: %i[index show]
end
```

- [ ] **Step 2: Write the failing request spec**

```ruby
# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Admin::Users", type: :request do
  fixtures :users, :items

  def sign_in_admin
    UserRole.create!(user: users(:one), role: Role.create!(name: "admin"))
    sign_in User.find(users(:one).id)
  end

  def inertia_get(path, params = {})
    get path, params: params, headers: { "X-Inertia" => "true", "X-Inertia-Version" => ViteRuby.digest }
  end

  describe "GET /admin/users" do
    it "redirects anonymous visitors to sign-in" do
      get admin_users_path
      expect(response).to redirect_to(new_user_session_path)
    end

    it "redirects signed-in non-admins with an access-denied alert" do
      sign_in users(:one)
      get admin_users_path
      expect(response).to redirect_to(root_path)
      follow_redirect!
      expect(response.body).to include(I18n.t("admin.access_denied"))
    end

    it "redirects a signed-in dev-role user (below admin level)" do
      UserRole.create!(user: users(:one), role: Role.create!(name: "dev"))
      sign_in User.find(users(:one).id)
      get admin_users_path
      expect(response).to redirect_to(root_path)
    end

    it "lists every user for an admin" do
      sign_in_admin
      inertia_get admin_users_path
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to include("component" => "admin/users/index")
      emails = response.parsed_body.dig("props", "users").map { |u| u["email"] }
      expect(emails).to contain_exactly(users(:one).email, users(:two).email)
    end

    it "searches by name or email" do
      sign_in_admin
      inertia_get admin_users_path, q: users(:two).email
      emails = response.parsed_body.dig("props", "users").map { |u| u["email"] }
      expect(emails).to contain_exactly(users(:two).email)
    end

    it "returns an empty list when the search matches nothing" do
      sign_in_admin
      inertia_get admin_users_path, q: "no-such-user"
      expect(response.parsed_body.dig("props", "users")).to eq([])
    end
  end

  describe "GET /admin/users/:id" do
    it "shows a user's detail with items_count to an admin" do
      sign_in_admin
      inertia_get admin_user_path(users(:two))
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to include("component" => "admin/users/show")
      expect(response.parsed_body.dig("props", "user", "email")).to eq(users(:two).email)
      expect(response.parsed_body.dig("props", "user", "items_count")).to eq(1)
    end

    it "404s for an unknown id" do
      sign_in_admin
      inertia_get admin_user_path("00000000-0000-0000-0000-000000000000")
      expect(response).to have_http_status(:not_found)
    end

    it "redirects non-admins" do
      sign_in users(:one)
      get admin_user_path(users(:two))
      expect(response).to redirect_to(root_path)
    end
  end
end
```

- [ ] **Step 3: Run test to verify it fails**

Run: `bundle exec rspec spec/requests/admin/users_spec.rb -v`
Expected: FAIL — `uninitialized constant Admin::UsersController` / routing error.

- [ ] **Step 4: Write minimal implementation**

```ruby
# frozen_string_literal: true

class Admin::UsersController < AdminController
  def index
    authorize! User, with: UserPolicy

    scope = User.order(created_at: :desc)
    if params[:q].present?
      scope = scope.where("name ILIKE :q OR email ILIKE :q", q: "%#{params[:q]}%")
    end

    pagy, users = pagy(scope)

    render inertia: "admin/users/index", props: UsersIndexResource.new(
      { users: users, pagy: pagy }
    ).to_inertia
  end

  def show
    user = User.find(params[:id])
    authorize! user, with: UserPolicy

    render inertia: "admin/users/show", props: { user: UserSerializer.new(user) }
  end
end
```

- [ ] **Step 5: Run test to verify it passes**

Run: `bundle exec rspec spec/requests/admin/users_spec.rb -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add config/routes/admin.rb app/controllers/admin/users_controller.rb spec/requests/admin/users_spec.rb
git commit -m "feat: add Admin::UsersController index/show with search"
```

---

### Task 5: `admin/users/index.tsx` page

**Files:**
- Create: `app/frontend/pages/admin/users/index.tsx`
- Create: `app/frontend/locales/admin/users/index/en.json`

**Interfaces:**
- Consumes: `UsersIndex` type (regenerated in Task 1's `npm run generate:types`, shape `{ users: User[]; pagy: Pagy }`), `adminUsersPath`/`adminUserPath` (js-routes, auto-generated from the route added in Task 4 — run `npm run generate:types` again if `app/frontend/lib/routes.d.ts` doesn't yet list them), `DataTable`, `DataTableToolbar`, `DataTablePagination`, `ResourceIndex` (all existing, `app/frontend/components/patterns/`), `Badge` (existing).
- Produces: default-exported `AdminUsersIndex` component registered under Inertia component name `admin/users/index`.

- [ ] **Step 1: Add the locale file**

```json
{
  "pageTitle": "Users",
  "heading": "Users",
  "searchPlaceholder": "Search by name or email",
  "columnName": "Name",
  "columnEmail": "Email",
  "columnRoles": "Roles",
  "columnCreated": "Joined",
  "userNoun": "user",
  "userNounPlural": "users",
  "showingRange": "{{from}}–{{to}} of {{count}}",
  "empty": "No users found",
  "emptyDescription": "Try a different search."
}
```

- [ ] **Step 2: Write the page component**

```tsx
import { Head, router } from '@inertiajs/react'
import type { ColumnDef } from '@tanstack/react-table'
import { UsersIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  DataTablePagination,
  DataTableToolbar,
} from '@/components/patterns/data-table'
import {
  Page,
  PageHeader,
  PageHeaderContent,
  PageHeaderHeading,
} from '@/components/patterns/page-header'
import { ResourceIndex } from '@/components/patterns/resource-index'
import { Badge } from '@/components/ui/badge'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { adminUserPath, adminUsersPath } from '@/lib/routes'
import type { Pagy, User } from '@/types'

type Props = {
  users: User[]
  pagy: Pagy
  q?: string
}

export default function AdminUsersIndex({ users, pagy, q }: Props) {
  const { t } = useTranslation('admin/users/index')
  const [rowSelection, setRowSelection] = useState({})
  const [query, setQuery] = useState(q ?? '')

  const handleQueryChange = (value: string) => {
    setQuery(value)
    router.get(
      adminUsersPath(),
      { q: value || undefined },
      { preserveState: true, preserveScroll: true, replace: true }
    )
  }

  const columns: ColumnDef<User, any>[] = [
    {
      accessorKey: 'name',
      header: t('columnName'),
      meta: { primary: true },
      cell: ({ row }) => row.original.name || row.original.email,
    },
    { accessorKey: 'email', header: t('columnEmail'), meta: { hideBelow: 'md' } },
    {
      accessorKey: 'roles',
      header: t('columnRoles'),
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.roles.map((role) => (
            <Badge key={role} variant="secondary">
              {role}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: t('columnCreated'),
      meta: { hideBelow: 'md' },
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
  ]

  return (
    <Page width="wide">
      <Head title={t('pageTitle')} />
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderHeading>{t('heading')}</PageHeaderHeading>
        </PageHeaderContent>
      </PageHeader>

      <ResourceIndex
        label={t('heading')}
        state={pagy.count === 0 && !query ? 'empty' : 'ready'}
        empty={
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersIcon />
              </EmptyMedia>
              <EmptyTitle>{t('empty')}</EmptyTitle>
            </EmptyHeader>
          </Empty>
        }
        toolbar={
          <DataTableToolbar
            query={query}
            onQueryChange={handleQueryChange}
            searchPlaceholder={t('searchPlaceholder')}
          />
        }
        pagination={
          pagy.pages > 1 ? (
            <DataTablePagination
              label={t('showingRange', { from: pagy.from, to: pagy.to, count: pagy.count })}
              previousHref={pagy.prev ? adminUsersPath({ page: pagy.prev, q: query }) : null}
              nextHref={pagy.next ? adminUsersPath({ page: pagy.next, q: query }) : null}
            />
          ) : undefined
        }
      >
        <DataTable<User>
          label={t('heading')}
          noun={{ one: t('userNoun'), other: t('userNounPlural') }}
          columns={columns}
          data={users}
          getRowId={(user) => user.id}
          rowHref={(user) => adminUserPath(user.id)}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          emptyState={
            <Empty>
              <EmptyHeader>
                <EmptyTitle>{t('empty')}</EmptyTitle>
                <EmptyDescription>{t('emptyDescription')}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent />
            </Empty>
          }
        />
      </ResourceIndex>
    </Page>
  )
}
```

- [ ] **Step 3: Pass `q` through from the controller**

Go back to `app/controllers/admin/users_controller.rb` (Task 4) and add `q: params[:q]` to the index props hash so the page can preselect the search box on reload:

```ruby
render inertia: "admin/users/index", props: UsersIndexResource.new(
  { users: users, pagy: pagy }
).to_inertia.merge(q: params[:q])
```

- [ ] **Step 4: Type-check**

Run: `npm run check`
Expected: no errors. If `adminUsersPath`/`adminUserPath` are missing from `@/lib/routes`, run `bin/rails app:js_routes:generate` (or restart `bin/dev`, which regenerates on boot) — these are generated by the `js-routes` gem from the route added in Task 4, not by `npm run generate:types`.

- [ ] **Step 5: Commit**

```bash
git add app/frontend/pages/admin/users/index.tsx app/frontend/locales/admin/users/index/en.json app/controllers/admin/users_controller.rb
git commit -m "feat: add admin users index page with search"
```

---

### Task 6: `admin/users/show.tsx` page

**Files:**
- Create: `app/frontend/pages/admin/users/show.tsx`
- Create: `app/frontend/locales/admin/users/show/en.json`

**Interfaces:**
- Consumes: `User` type (`{ id, name, email, avatarUrl, roles, createdAt, itemsCount }` after Task 1's regeneration), `adminUsersPath` (js-routes).
- Produces: default-exported `AdminUserShow` component registered under Inertia component name `admin/users/show`.

- [ ] **Step 1: Add the locale file**

```json
{
  "heading": "User details",
  "emailLabel": "Email",
  "rolesLabel": "Roles",
  "itemsLabel": "Items",
  "joinedLabel": "Joined"
}
```

- [ ] **Step 2: Write the page component**

```tsx
import { Head } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import { DetailLayout } from '@/components/patterns/detail-layout'
import {
  Page,
  PageHeader,
  PageHeaderBack,
  PageHeaderContent,
  PageHeaderHeading,
} from '@/components/patterns/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DescriptionDetails,
  DescriptionItem,
  DescriptionList,
  DescriptionTerm,
} from '@/components/ui/description-list'
import { adminUsersPath } from '@/lib/routes'
import type { User } from '@/types'

type Props = {
  user: User
}

export default function AdminUserShow({ user }: Props) {
  const { t } = useTranslation('admin/users/show')
  const displayName = user.name || user.email

  return (
    <Page>
      <Head title={displayName} />
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderBack href={adminUsersPath()} label={t('heading')} />
          <PageHeaderHeading>{displayName}</PageHeaderHeading>
        </PageHeaderContent>
      </PageHeader>

      <DetailLayout>
        <Card>
          <CardHeader>
            <CardTitle>{t('heading')}</CardTitle>
          </CardHeader>
          <CardContent>
            <DescriptionList>
              <DescriptionItem>
                <DescriptionTerm>{t('emailLabel')}</DescriptionTerm>
                <DescriptionDetails>{user.email}</DescriptionDetails>
              </DescriptionItem>
              <DescriptionItem>
                <DescriptionTerm>{t('rolesLabel')}</DescriptionTerm>
                <DescriptionDetails>
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <Badge key={role} variant="secondary">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </DescriptionDetails>
              </DescriptionItem>
              <DescriptionItem>
                <DescriptionTerm>{t('itemsLabel')}</DescriptionTerm>
                <DescriptionDetails>{user.itemsCount}</DescriptionDetails>
              </DescriptionItem>
              <DescriptionItem>
                <DescriptionTerm>{t('joinedLabel')}</DescriptionTerm>
                <DescriptionDetails>
                  {new Date(user.createdAt).toLocaleString()}
                </DescriptionDetails>
              </DescriptionItem>
            </DescriptionList>
          </CardContent>
        </Card>
      </DetailLayout>
    </Page>
  )
}
```

- [ ] **Step 3: Type-check**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/frontend/pages/admin/users/show.tsx app/frontend/locales/admin/users/show/en.json
git commit -m "feat: add admin user detail page"
```

---

### Task 7: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full backend suite**

Run: `bin/test`
Expected: all specs pass, including the new `spec/serializers/user_serializer_spec.rb`, `spec/policies/user_policy_spec.rb`, `spec/requests/admin/users_spec.rb`.

- [ ] **Step 2: Run frontend checks**

Run: `npm run check && npm run lint`
Expected: no type errors, no lint errors.

- [ ] **Step 3: Manual smoke test**

Run: `bin/dev`, sign in as a user with the `admin` role (create one via `rails console`: `UserRole.create!(user: User.first, role: Role.find_or_create_by!(name: "admin"))`), visit `/admin/users`, confirm the list renders, search narrows results, and clicking a row opens `/admin/users/:id` with correct roles/item count/joined date. Confirm both light and dark themes render without raw-color regressions.

- [ ] **Step 4: Commit (if any fixups were needed)**

```bash
git add -A
git commit -m "fix: address smoke-test findings in admin user management"
```
