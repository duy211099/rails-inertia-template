# Rails Inertia template upgrade

Approved design: migrate Oj serializers, types_from_serializers to Alba,
alba-inertia, Typelizer. Keep SQLite, UI behavior, response keys,
authorization, timestamps, pagination. Keep Oj's Rails JSON integration.

1. Migrate Item/User/Version/Pagy serializers, add lazy collection page
   resources, generate accurate nullable TypeScript types, test full/partial
   requests + existing serialization contracts.
2. Add production JSON request logging + dev-only email inbox.
3. Add WebMock, TestProf, RSpec lint, N+1 regression checks, database
   consistency checks, deterministic generated-type verification to CI.
4. Update template docs, run all tests/checks + production build, review
   full diff.

No database migration or public response change intended. Keep Devise,
Action Policy, Solid Queue, JS Routes, Node/npm, existing frontend styling.
No product-specific AI, GraphQL, payments, infrastructure services.

Verification: existing backend/frontend suites, serializer + partial reload
contracts, HTTP isolation, local mail delivery, JSON logging, deterministic
type generation, N+1 regression checks, database consistency, lint,
TypeScript, Zeitwerk, security scans, production image build.