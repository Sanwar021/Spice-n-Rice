# Architecture

```text
frontend/                    React 18, strict TypeScript, Vite, Tailwind
  src/App.tsx                Public routes adapted from the supplied Figma export
  src/Admin.tsx              Authenticated operational editor
  src/business.tsx           Chicago hours, closure logic, metadata
  src/InquiryForm.tsx        Validated inquiry forms backed by the API
  src/responsive.css         Responsive integration and admin styling
  src/api.ts                 Cookie client, refresh coordination, query cache
  tests/                     Browser behavior, layout, accessibility
backend/
  cmd/server/                Configuration, migration, owner bootstrap, shutdown
  cmd/user/                  Operator account creation/reset CLI
  internal/handlers/         HTTP validation, auth, rate limits, uploads, responses
  internal/repositories/     Parameterized Postgres queries and transactions
  internal/services/         Integer pricing and formatting
  internal/models/           Shared record/identity types
  migrations/                Versioned schema and seed migrations
  openapi.yaml               API contract
scripts/                     Local launcher, hot reload, integration checks
```

Browser requests use the same origin. Vite proxies to Go locally; nginx does so in production. Public endpoints expose available menu/catering records, published testimonials, and business settings. TanStack Query uses a 3-second stale window, refetch on focus, 10-second polling, and invalidation after admin writes. Prices originate in PostgreSQL, never frontend constants.

The schema combines relational identity, category references, price columns, timestamps, and audit rows with JSONB for editable presentation fields. Table selection is allowlisted. Values are parameterized. Soft deletion retains references and history. Partial indexes support live menu lookup; inquiry status and audit chronology are indexed. Update triggers maintain timestamps.

Price updates lock rows and write audit entries in the same transaction. Bulk edits lock in ID order, calculate in integer arithmetic with half-up rounding, and commit atomically. Each entry includes resource, item, changed price field, before/after cents, actor, and time.

Passwords use bcrypt cost 12. A signed HS256 JWT expires after 15 minutes; an opaque refresh token lasts seven days and is stored only as a SHA-256 digest in PostgreSQL. Refresh tokens rotate atomically by consuming the prior token. JWTs also reference the server session, allowing immediate revocation on logout/password reset. Cookies are HttpOnly, SameSite=Strict, and Secure in production. Mutation Origin checks supplement cookie protections. Role authorization is enforced in Go, not just the UI.

The server applies body limits, rate limits, context timeouts, security headers, structured errors/logging, and graceful shutdown. Uploaded JPEG/PNG files have bounded dimensions/size, random filenames, and WebP re-encoding that strips source metadata. Only re-encoded images are served from uploads. Removed media stays on disk to preserve existing references.

Public inquiries are validated and rate-limited and include a honeypot. Saving is independent from optional best-effort SMTP notifications. There is no background email queue. External ordering is delegated to the restaurant's Menufy URL.

The visual system uses cream, saffron, chili, and forest tokens, serif headings and sans-serif body text, keyboard-visible focus, theme preference, responsive layouts, and reduced-motion-aware CSS decoration. Reference imagery and fonts are self-hosted. Admin and inquiry forms load in separate chunks. The previous WebGL component is unused. SEO includes titles, descriptions, Open Graph metadata, Restaurant JSON-LD, sitemap, robots, and favicon. This remains a client-rendered SPA; server prerendering is a possible future SEO enhancement, not an implemented capability.

Native deployment templates live in `deploy/`. Loopback proxy trust is opt-in, accepts only a valid single IP from `X-Real-IP`, and never trusts a non-loopback peer. The supplied nginx configuration overwrites that header; the Go service binds to loopback.
