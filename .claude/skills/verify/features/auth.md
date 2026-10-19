# Sign in / sign out

Devise with email/password and Google OAuth. The web login page only offers Google.

## Sub-features

- Sign in (`POST /users/sign_in`, `Users::SessionsController`)
- Sign out (`DELETE /users/sign_out` via the "Sign out" form in `AuthNav`), which redirects to `/` with a flash
- Google OAuth (`POST /users/auth/google_oauth2`)
- Account lock after repeated failures (Devise `:lockable`)

## How to get to it (user POV)

Home page (`/`), then the "Sign in" button in the header, which leads to `/users/sign_in` and "Continue with Google". Signed in, the header shows the user's name and a "Sign out" button.

## Driving it with Playwright MCP

- Sign in: use the `browser_evaluate` recipe in `../SKILL.md`. End state: the fetch resolves at `/`. On reload, `/` shows the user's name ("Verify Bot") and a "Sign out" button, and the home card shows a "View items" button instead of the sign-in prompt.
- Sign out: on `/`, click `role=button[name="Sign out"]`. End state: back on `/`, the header shows "Sign in", and visiting `/items` redirects to `/users/sign_in`.
- Signed-out gate: `curl -s -o /dev/null -w '%{http_code} %{redirect_url}' http://localhost:3100/items` prints `302 http://localhost:3100/users/sign_in`.

## Gotchas

- Google OAuth makes real calls to Google and has no local credentials. Do not claim it verified.
- 5 failed password attempts lock the account. Create a new user rather than unlocking.
- Use `localhost`, not `127.0.0.1`. The redirect between them loses the session cookie.
