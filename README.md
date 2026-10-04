# Spice ’N’ Rice

React 18 / TypeScript / Vite restaurant website and administration studio, backed by Go, chi, pgx, and PostgreSQL. The public pages implement the supplied Restaurant Website UI Design Figma export: Fraunces/DM Sans typography, cream/forest/saffron palette, circular food hero, category browsing, catering, about, contact, and dark theme. Local development does **not** require or use Docker.

## Run locally

Requirements: Node 24+, Go 1.26.6+, PostgreSQL 16+, and Google's `cwebp` encoder on PATH or configured with `CWEBP_PATH`. The Go module pins a patched toolchain; an older Go installation with automatic toolchain downloads enabled will fetch it. The checked-in lockfile pins frontend dependencies.

```sh
cd frontend
npm ci
cd ../backend
go mod download
cd ..
```

Create a dedicated database and database user. Copy `.env.example` to `.env`, set `DATABASE_URL`, a random `JWT_SECRET` of at least 32 characters, `OWNER_EMAIL`, and an `OWNER_PASSWORD` of at least 12 characters. Keep `.env` private. The owner is created only when the users table is empty; changing its environment password later does not reset the account.

```sh
make dev
# Without Make (including Windows):
node scripts/local.mjs
```

Public site: **http://127.0.0.1:5175**. Admin: **http://127.0.0.1:5175/admin**. API health: **http://127.0.0.1:8087/health**. Use the exact origin configured in `FRONTEND_ORIGIN` for cookie and CSRF checks. Vite provides frontend hot reload; the Node development watcher rebuilds and restarts Go after `.go` changes. Restart after changing environment variables or migrations.

### This workspace

An isolated local PostgreSQL 17 cluster was created in `.local/pgdata`, bound to **127.0.0.1:55439**, with database/user `spicenrice` / `spice`. It does not alter the existing PostgreSQL services. This development-only cluster uses local trust authentication; never expose it to a network or reuse this configuration in production. The initial owner email is `owner@spicenrice.local`; its generated password is in the ignored `.env` file. A project-local WebP encoder is configured there too.

If that cluster is stopped, run in PowerShell from the repository root:

```powershell
& 'C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe' -D '.local/pgdata' -l '.local/postgres.log' -o '-p 55439 -h 127.0.0.1' start
node scripts/local.mjs
```

To stop it after stopping the app:

```powershell
& 'C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe' -D '.local/pgdata' stop
```

## Editing the restaurant

- **Menu items:** inline prices are entered in integer cents (`1399` means $13.99). Press Save on that row. Edit opens the full item form with category, description, image, vegetarian/spicy flags, homepage feature selection, availability, and ordering. Sold-out items disappear from the public menu.
- **Bulk prices:** choose a category or all categories, choose percentage adjustment or fixed cents, enter the amount, and review the confirmation. Each changed price is audited in the same database transaction. Percentages round half-up to the nearest cent.
- **Categories:** drag rows to reorder, or use the keyboard-accessible up/down buttons. Hidden or deleted categories are excluded from public results. Deleting a category soft-deletes it and hides its items; reassign items before deletion if they should remain public.
- **Catering:** full/half tray prices use cents. Tandoori Chicken uses per-piece pricing, with no half-tray price displayed.
- **Media library:** upload JPEG or PNG files up to 8 MiB / 40 megapixels. The server decodes the header, checks limits, generates a WebP and thumbnail, and assigns random filenames. Use uploaded media in item and settings editors. Removing media hides it from the library but retains files so existing references do not break.
- **Site settings (owner):** update logo, headline, hero/catering imagery, phones, address, external ordering/social links, lunch text and optional price, daily opening hours, and holiday closures. Daily schedules use America/Chicago, not the visitor's timezone. Overnight opening intervals are not supported.
- **Inbox:** catering and contact submissions appear with new/read/replied/archived states. Marking “replied” records status; it does not send an email. Use the email link to reply in your own mail client.
- **Testimonials:** publish genuine customer feedback only. There are no invented reviews in the seed. The public section stays hidden until a visible testimonial exists.
- **Roles:** staff can manage operating content and prices; only owners can delete records or change site settings. All role checks also run on the server.

Public queries revalidate on focus and every 10 seconds while open. Local admin edits immediately invalidate cached data in the same tab. Independent public visitors see updates within that polling interval. There is no static price data in the frontend.

### Staff accounts and password reset

With `DATABASE_URL` loaded in your shell, set `USER_EMAIL`, `USER_PASSWORD` (12+ characters), and `USER_ROLE` (`staff` or `owner`), then run `go run ./cmd/user` from `backend/`. It creates an account or resets an existing account and revokes its sessions. Do not put passwords in command history or commit them. This is an operator CLI; there is no public registration endpoint.

## Environment

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL DSN; use TLS outside local development |
| `JWT_SECRET` | Random signing secret, minimum 32 characters |
| `OWNER_EMAIL`, `OWNER_PASSWORD` | Initial owner, only on empty users table |
| `LISTEN_ADDR` | Go bind address; local launcher defaults to `:8087` |
| `FRONTEND_ORIGIN` | Exact public origin, no trailing slash |
| `TRUST_LOOPBACK_PROXY` | Default `false`; set `true` only behind a loopback proxy that overwrites `X-Real-IP`, with Go bound to loopback |
| `COOKIE_SECURE` | `true` for HTTPS production; `false` for local HTTP |
| `UPLOAD_DIR` | Persistent upload directory, relative to backend working directory |
| `CWEBP_PATH` | Optional encoder path; otherwise `cwebp` on PATH |
| `MIGRATIONS_DIR` | Migration path; defaults to `migrations` |
| `SMTP_HOST`, `SMTP_PORT` | Optional SMTP server / port (typically 587) |
| `SMTP_USER`, `SMTP_PASSWORD` | SMTP credentials |
| `SMTP_FROM`, `SMTP_TO` | Notification sender and restaurant recipient |

SMTP notifications contain only a notification to check the admin inbox, not customer details. The inquiry is saved first; delivery failure is logged and does not discard it. SMTP delivery is best effort, without a durable retry queue. Real email delivery requires your SMTP configuration and was not exercised against an external provider.

## Tests and checks

With the local API, frontend, and isolated database running:

```sh
cd backend
go test ./...
go vet ./...
golangci-lint run
cd ../frontend
npm run lint
npm test
npm run build
npx playwright test
node scripts/design-audit.mjs
node scripts/admin-audit.mjs
npm audit
cd ..
node scripts/integration.mjs
node scripts/media-test.mjs
```

Browser tests use installed Chrome, not a downloaded browser, and read credentials from `.env` without printing them. Integration tests exercise database writes; run them only against a development database. Test records are soft-deleted after the main integration suite; audit evidence is retained. The media test adds a genuine restaurant photo to the development media library.

`backend/openapi.yaml` is an OpenAPI 3.1 document serialized as JSON (valid YAML 1.2). `backend/requests.http` is a REST client collection. `node scripts/openapi.mjs` regenerates the spec; `node scripts/seed.mjs` regenerates the original seed migration. Never regenerate an already-applied migration in a deployed database; add a new migration instead.

## Deployment without Docker: VPS

1. Provision PostgreSQL 16, a restricted application database user, and regular automated backups. Use a private connection with TLS where applicable.
2. Install Node 24, Go, `cwebp`, and nginx. Run `npm ci && npm run build` in `frontend/`; run `go build -o spice-api ./cmd/server` in `backend/`.
3. Copy the Go binary and `migrations/` to `/opt/spicenrice/backend`. Run as an unprivileged dedicated service user. Provide environment values through a protected systemd `EnvironmentFile`; set `COOKIE_SECURE=true`, your HTTPS `FRONTEND_ORIGIN`, and a private `LISTEN_ADDR=127.0.0.1:8087`.
4. Keep `UPLOAD_DIR` persistent and writable by that service user; back it up alongside PostgreSQL. Do not store uploads only in an ephemeral release directory.
5. Serve `frontend/dist` with nginx. Use `deploy/nginx.conf`, replacing its domain and certificate paths. Use `deploy/spicenrice.service` with a dedicated `spicenrice` user and a protected `/etc/spicenrice.env`. The service enables `TRUST_LOOPBACK_PROXY=true`; nginx overwrites `X-Real-IP`, so limits apply separately to each visitor. Keep Go bound to loopback. Run `nginx -t` and verify the service on the target Linux host before enabling traffic. These templates were reviewed locally; nginx/systemd were not available for a live Linux deployment test.
6. Set a 9 MiB proxy upload limit. Add HSTS only after HTTPS is fully working. Verify `/health`, login, refresh, upload, inquiry submission, and the Menufy link on the real domain.
7. Migrations run at API startup. For multiple replicas, use a single release migration job before rolling out binaries. Back up first and review each migration before a production update.
8. Update `frontend/public/sitemap.xml` for the final canonical domain. `robots.txt` excludes admin/API; authentication protects admin data independently of robots.

The optional container files from the original brief remain unused. This workflow uses native PostgreSQL, Go, nginx, and systemd; no Docker was used.

## Content choices and limitations

- The supplied business details and all 68 individual menu prices / 39 catering entries are seeded. Beef Biriyani half-tray is **$80**, correcting the old site's apparent $70 typo as instructed.
- The lunch price is null until the owner sets it; “call for price” is shown. Vegetarian status is inferred from dish names. Spicy flags default off because spice levels were unspecified; the owner should set them. Do not treat these flags as allergen guarantees.
- “Chicken Karma” retains the supplied spelling. Chicken Karahi/Karma boneless variants and samosa fillings are separate menu items. Lassi and Chicken 65 retain their supplied option descriptions.
- Shrimp Curry remains in the supplied catering `Veg` section to preserve the brief's source grouping; it is seafood, not vegetarian. The owner should move it to an appropriate section before publication.
- The supplied Figma export includes four illustrative Unsplash food images. The exact images and fonts are self-hosted; responsive WebP sizes are provided for the hero and featured cards. Images are labeled illustrative and can be replaced through admin settings/media. The original restaurant catering image is a low-resolution interior photograph.
- The supplied photo hero replaces the previous procedural 3D bowl. Decorative CSS motion respects reduced-motion preferences; the old WebGL component is unused and excluded from the production bundle.
- Layout checks cover 320, 375, 390, 600, 768, 820, 1024, 1280, 1440, 1920, and 2560 CSS-pixel widths. This is broad responsive coverage, not a claim of testing every physical device or browser.
- Local database validation used installed **PostgreSQL 17**, not 16. SQL uses PostgreSQL 16-compatible features, but a PostgreSQL 16 runtime pass remains a deployment check.
- No public deployment, real SMTP delivery, or payment integration was performed. Ordering links to the existing Menufy service.

Original business content: https://spicenriceharun.com/index.html. The newer user-supplied Figma design supplies the visual reference and illustrative food images. See `frontend/public/images/SOURCES.md`.
