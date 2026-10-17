// Checks your Cloudinary settings end-to-end: upload -> private download -> delete.
// Usage (inside the server folder):  node scripts/testCloudinary.js
require('../config/env') // loads .env (needs MONGO_URI/JWT_SECRET set like normal)
const storage = require('../utils/fileStorage')

// 1x1 transparent PNG
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')

;(async () => {
  if (!storage.isCloud()) {
    console.error('❌ Cloudinary is not configured. Set CLOUDINARY_URL (or CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET) in server/.env')
    process.exit(1)
  }
  let ref
  try {
    ref = await storage.saveImage(PNG, 'image/png')
    console.log('✅ 1/3 Upload works      ->', ref)
  } catch (e) { console.error('❌ Upload failed:', e.message); process.exit(1) }

  const img = await storage.getImage(ref)
  if (img && img.buffer.length > 0) console.log('✅ 2/3 Private download works (', img.mime, img.buffer.length, 'bytes )')
  else { console.error('❌ Download failed (see message above). Upload worked, so keys are right; tell Claude the error.'); await storage.deleteImage(ref); process.exit(1) }

  await storage.deleteImage(ref)
  console.log('✅ 3/3 Cleanup done. Cloudinary is ready - payment screenshots will be stored privately.')
})()
