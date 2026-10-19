# JSON API v1

A JWT-authenticated API for client apps, at `/api/v1`. It is a separate login from the browser cookie session.

## Sub-features

- `POST /api/v1/session` with `{email, password}`: returns the user and an `Authorization: Bearer …` header
- `GET /api/v1/session`: the current user for a token
- `DELETE /api/v1/session`: revokes the token (JTI rotation)
- `POST /api/v1/session/exchange`: redeems the one-time code from the Google redirect
- `GET/POST/PATCH/DELETE /api/v1/items[/:id]`: owner-scoped items

## How to get to it (user POV)

A client app calls it over HTTP. There is no UI. API docs are mounted from `config/routes/api_docs.rb`.

## Driving it with curl

```bash
B=http://localhost:3100
CREDS='{"email":"<EMAIL>","password":"<PASSWORD>"}'
TOKEN=$(curl -s -D - -o /dev/null -X POST $B/api/v1/session -H 'Content-Type: application/json' -d "$CREDS" \
  | awk -F': ' 'tolower($1)=="authorization"{print $2}' | tr -d '\r')
curl -s $B/api/v1/items -H "Authorization: $TOKEN"
```

End state (proven 2026-10-19): the session POST returns `200` with an `authorization: Bearer …` header, and `GET /api/v1/items` returns `{"items":[…],"pagy":{…}}` containing only that user's items, with camelCase keys (`phoneNumber`, `createdAt`).

Revocation: `DELETE /api/v1/session` with the token, then `GET /api/v1/session` with the same token, must return 401.

## Gotchas

- Redact the bearer token in saved evidence (`sed 's/Bearer .*/Bearer <redacted>/'`).
- Wrong passwords count toward the Devise lock here too.
- CORS (`API_CORS_ORIGINS`) only matters for browsers. curl does not exercise it.
