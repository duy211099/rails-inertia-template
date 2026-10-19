# Feature map

One file per user-facing feature. Each says how a user reaches it, how to drive it with the harness in `../SKILL.md`, and what end state proves it works.

| Feature | File | Surface | Proven live |
| --- | --- | --- | --- |
| Sign in / sign out | [auth.md](auth.md) | Web | sign-in, 2026-10-19 |
| Items (create, view, edit, delete) | [items.md](items.md) | Web | create, 2026-10-19 |
| Audit log | [audit-log.md](audit-log.md) | Web | not yet |
| Admin dashboard and users | [admin.md](admin.md) | Web | not yet |
| JSON API v1 | [api.md](api.md) | HTTP | session + items index, 2026-10-19 |

Not mapped yet: locale switch (`PATCH /locale`), Google OAuth (cannot be driven locally), and `/jobs` (Mission Control, an operator tool).
