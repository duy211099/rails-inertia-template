# Audit log

The PaperTrail history of the signed-in user's changes, rendered at `/versions` ("Audit Log").

## Sub-features

- A list of changes with event badges (Created / Updated / Deleted) and from → to values, shown as "(empty)" for nil
- Count line ("N changes recorded") and pagination (Previous / Next, "Page X of Y")
- Empty state: "No audit history yet."

## How to get to it (user POV)

Sign in, then use the sidebar's audit log entry, or go to `/versions` directly.

## Driving it with Playwright MCP

1. Sign in a fresh user and create one item (see `items.md`).
2. `browser_navigate` to `http://localhost:3100/versions`

End state: heading `Audit Log`, the text `1 change recorded`, and one entry with the `Created` badge naming the item's fields. Edit the item and reload, and you should see `2 changes recorded` with an `Updated` entry showing the old → new name.

A fresh user with no changes should see `No audit history yet.`

## Gotchas

- Not yet proven live. The first run should confirm the sidebar label and update this file.
- Soft delete is recorded as an update to `discarded_at`, not as a `destroy` event.
