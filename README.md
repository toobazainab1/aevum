# AEVUM

React (Vite) client + Express/MongoDB API. See `SECURITY_AUDIT.md` before deploying.

## Run locally
```
cd server && cp .env.example .env   # fill it in (NODE_ENV=development locally)
npm install && npm run dev
cd ../client && npm install && npm run dev
```
<<<<<<< HEAD
=======
Backend: runs on Vercel serverless (`server/api/index.js`, `server/vercel.json`) or any Node host (`npm start`). Uploads are limited to 4MB because of Vercel's request size limit.

>>>>>>> 1fc1e36 (Vercel serverless backend)
Payment screenshots: set `CLOUDINARY_URL` in `server/.env` for private cloud storage, then run `node scripts/testCloudinary.js` to check it.

Product photos live in `client/src/assets/perfumes/` and are matched to products by name (`utils/perfumeImages.js`).
