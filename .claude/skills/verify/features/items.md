# Items

The reference CRUD resource. Each user sees and manages only their own items (`ItemPolicy` owner check). Admins see all items. Deletes are soft (Discard), and every change is audited (PaperTrail).

## Sub-features

- Index with pagination (Pagy, 12 per page) and an empty state ("No items yet")
- Create (`/items/new`): name required, description and phone number optional
- Show (`/items/:id`)
- Edit (`/items/:id/edit`)
- Delete: soft delete. The index row action uses `window.confirm`, and the show page uses an AlertDialog.

## How to get to it (user POV)

Sign in, then click "View items" on the home page or "Items" in the sidebar to reach `/items`. The "New item" button in the page header opens the create form.

## Driving it with Playwright MCP

Create (proven 2026-10-19):

1. `browser_navigate` to `http://localhost:3100/items`
2. `browser_click` on `role=main >> role=link[name="New item"] >> nth=0`. The URL becomes `/items/new`.
3. `browser_fill_form` with `#name` = `Verify widget` and `#description` = `Created by verify skill`
4. `browser_click` on `role=button[name="Create Item"]`

End state: the URL is `/items`, the snapshot has a row link named `Verify widget`, and the toast text reads `Item was successfully created.` The DB check:

```bash
bin/rails runner 'u=User.find_by!(email: "<EMAIL>"); i=u.items.find_by!(name: "Verify widget"); v=i.versions.last; puts({item_id: i.id, version_event: v.event, whodunnit: v.whodunnit, owner: u.id}.to_json)'
```

This must show `version_event: "create"` and `whodunnit == owner`.

Validation: submit with `#name` empty. The page stays on `/items/new`, the name field gets `aria-invalid="true"`, and an error message is shown. No new row appears.

Edit: from the show page, click "Edit item", change `#name`, and submit. The index shows the new name, and `versions.last.event` is `update`.

Delete: from the show page, click "Delete item" and confirm in the AlertDialog. The row disappears from the index, `Item.find_by(id:)` returns nil, `Item.with_discarded.find(id).discarded_at` is set, and the latest version event is `update` (discard is an update).

## Gotchas

- The index row delete uses `window.confirm`. Use the show-page AlertDialog path instead, or handle the dialog with `browser_handle_dialog`.
- There are three "New item" links (sidebar, header, empty state), so scope to `main` and take `nth=0`.
- A second throwaway user must not see the first user's items. That is the owner-scoping check after any policy change.
