# Rails Inertia template upgrade

Approved design: migrate Oj serializers and types_from_serializers to Alba,
alba-inertia, and Typelizer while preserving SQLite, UI behavior, response keys,
authorization, timestamps, and pagination. Keep Oj's Rails JSON integration.

1. Migrate Item/User/Version/Pagy serializers, introduce lazy collection page
   resources, generate accurate nullable TypeScript types, and test full/partial
   requests and existing serialization contracts.
2. Add production JSON request logging and a development-only email inbox.
3. Add WebMock, TestProf, RSpec lint, N+1 regression checks, database consistency
   checks and deterministic generated-type verification to CI.
4. Update template documentation, run all tests/checks and production build,
   and review the complete diff.

No database migration or public response change is intended. Keep Devise,
Action Policy, Solid Queue, JS Routes, Node/npm, and existing frontend styling.
Do not add product-specific AI, GraphQL, payments, or infrastructure services.

Verification: existing backend/frontend suites, serializer and partial reload
contracts, HTTP isolation, local mail delivery, JSON logging, deterministic
type generation, N+1 regression checks, database consistency, lint, TypeScript,
Zeitwerk, security scans, and production image build.
