# AEVUM security audit & changes

## Findings and fixes
| Area | Finding | Fix |
|---|---|---|
| Customer data | `/uploads` was public: anyone with a URL could view payment screenshots; one real screenshot was committed to git | Static serving removed. Screenshots are served only via `GET /api/orders/:id/screenshot` (owner or admin). `uploads/` is git-ignored and the committed file is staged for removal |
| Uploads | Extension-only check, predictable names, client filename used | Random 128-bit names, MIME allowlist, **magic-byte verification**, size/field limits, rejected files are deleted |
| NoSQL injection | `{"email":{"$ne":null}}`-style payloads and `?filter[$ne]=x` reached queries | Global sanitizer (strips `$`/dotted/`__proto__` keys), strict type coercion, whitelists for query params |
| Mass assignment | Products/sales saved `req.body` wholesale | Field whitelists + validation (price, enums, hex colours, safe CSS background, https-only image URL) |
| Order tampering | Negative/NaN quantities, unvalidated size, unlimited items, bad JSON = 500 | Integer quantity 1–10, max 20 items, size must exist on product, prices always from DB, address fields validated |
| Auth | No rate limits, user-enumeration by timing, 6-char passwords, bcrypt cost 10, JWT never pinned to an algorithm | Login/register/order/admin rate limits, constant-time failed login, 8+ chars with letter+number, bcrypt cost 12 (old hashes upgraded on next login), JWT pinned to HS256 with issuer/audience, 7-day expiry, password `select:false` |
| Admin | Role gate was only a client-side check on localStorage data | `/admin` wrapped in a role-guarded route; role re-verified from the server on every page load; every admin API route checks role from the database |
| XSS | React escapes output (no `dangerouslySetInnerHTML` found), but emails interpolated raw user data into HTML | All email values HTML-escaped, tags stripped from stored text, strict CSP, inline script removed from `index.html` |
| CORS | Hard-coded list, `credentials: true` without need | Origins come from `CLIENT_ORIGINS`, unknown origins get no CORS headers, credentials off |
| Headers | None | API: CSP, HSTS, nosniff, frame deny, no-referrer, COOP/CORP, no-store. Frontend: same plus CSP via `client/vercel.json` |
| Debug / leaks | `err.message` returned to clients, `X-Powered-By`, emojis/emails in logs | Generic 500s, header disabled, no recipient addresses logged, Vite source maps off |
| Config | Server started with any secret | Refuses to start if `JWT_SECRET` is missing or under 32 chars |
| Cleanup | Duplicate Auth/Cart providers, 12 hard-coded `localhost:5000` URLs, malformed `index.html` (nested `<body>`) | Providers deduplicated, one `src/api.js` (`VITE_API_URL`), HTML fixed |

## Git history
4 commits scanned. `.env` was **never committed** and no keys/passwords appear in history. The only sensitive item is one customer payment screenshot (`server/uploads/payments/payment-1783260704997-240219.jpeg`).

## Things you must do yourself
1. **Rotate secrets**: your real `.env` was shared in a chat upload. Change the MongoDB user password, generate a new `JWT_SECRET`, and create a new Gmail App Password.
2. **Set environment variables** on your hosts using `server/.env.example` and `client/.env.example`. Set `NODE_ENV=production` and `CLIENT_ORIGINS`. Set `VITE_API_URL` in Vercel.
3. **Update dependencies** (I had no network access, so I could not run `npm audit`):
   `cd server && npm install multer@latest && npm audit fix && npm audit`, then the same `npm audit fix` in `client`. Your lockfile pins multer 1.4.5-lts.2; 1.x has published DoS advisories fixed in 2.x.
4. **MongoDB Atlas**: use a database user limited to `readWrite` on the `aevum` database, restrict Network Access to your host's IPs (not 0.0.0.0/0), and enable backups.
5. **Purge the screenshot from git history** (optional but recommended), then force-push:
   `pip install git-filter-repo && git filter-repo --path server/uploads --invert-paths`
6. Tighten `connect-src` in `client/vercel.json` from `https:` to your exact API origin.
7. Make an admin with `node scripts/makeAdmin.js you@email.com` after registering normally.

## Known limits
- JWT is kept in localStorage (as before). The CSP and XSS fixes reduce the risk; httpOnly cookies are the next step.
<<<<<<< HEAD
- Rate limiting is in-memory (fine for one server instance).
=======
- Rate limiting for login, sign-up and orders is stored in MongoDB (shared across serverless instances); broad/admin limits are per-instance.
>>>>>>> 1fc1e36 (Vercel serverless backend)
- Payment screenshots: with `CLOUDINARY_URL` set they are stored as private (authenticated) Cloudinary assets and only streamed to the order owner/admin by the API. Without it they are saved on local disk, which is wiped on free hosts. Run `node scripts/testCloudinary.js` after setting it.
- Stock is not decremented on orders and sale discounts are not applied server-side (pre-existing behaviour).
