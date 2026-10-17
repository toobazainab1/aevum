# AEVUM

React (Vite) client + Express/MongoDB API. See `SECURITY_AUDIT.md` before deploying.

## Run locally
```
cd server && cp .env.example .env   # fill it in (NODE_ENV=development locally)
npm install && npm run dev
cd ../client && npm install && npm run dev
```
Product photos live in `client/src/assets/perfumes/` and are matched to products by name (`utils/perfumeImages.js`).
