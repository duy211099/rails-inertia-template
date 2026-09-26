// Per https://inertia-rails.dev/guide/csrf-protection: Inertia Rails keeps an
// XSRF-TOKEN cookie refreshed on every Inertia-rendered request, rather than
// only stamping a <meta> tag once at initial page load. For a plain (non-
// Inertia) form POST or fetch call, reading this cookie fresh at submit time
// — instead of a <meta> tag snapshotted whenever this tab last rendered a
// page — is what the docs recommend, and it stays correct even if another
// tab (or a same-tab non-Inertia request) changed the session since.
export function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}
