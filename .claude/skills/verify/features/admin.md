# Admin dashboard and users

Admin-only area: a dashboard of all items (`/admin`) and a user directory (`/admin/users`, `/admin/users/:id`). Access requires the admin role (`ApplicationPolicy#admin?` → `user.at_least?(:admin)`).

## Sub-features

- Dashboard (`admin/dashboard#index`): every user's items, unscoped
- Users index: search ("Search by name or email"), with columns Name / Email / Roles / Joined
- User detail (`/admin/users/:id`)

## How to get to it (user POV)

Sign in as an admin, then use the admin entry in the sidebar, or go to `/admin`.

## Driving it with Playwright MCP

1. `verify user --admin` and sign in with those credentials.
2. `browser_navigate` to `http://localhost:3100/admin/users`. End state: heading `Users`, plus a row whose email matches the throwaway admin.
3. Search: type the throwaway email into the search box. The table narrows to that row, and the URL carries the query param.
4. Gate check: sign in a plain `verify user` (member) in a fresh browser context and open `/admin/users`. The member must not see the users table. Record what actually happens (redirect or error page) in this file the first time you run it.

## Gotchas

- Not yet proven live, and the member-denied behaviour is unrecorded. See step 4.
- The dashboard lists items from every user in the shared development DB, including the user's own data. Do not screenshot it into evidence you share without checking.
