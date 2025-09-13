require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/ProductModel');
const { ensureProductQr } = require('../utils/qr');

(async function run() {
  try {
    await mongoose.connect("mongodb://localhost:27017/CollegeMarketPlace");

    // Find products missing a QR
    const cursor = Product.find({
      $or: [{ qr: { $exists: false } }, { 'qr.url': { $exists: false } }, { 'qr.url': null }]
    }).cursor();

    let count = 0;
    for (let product = await cursor.next(); product != null; product = await cursor.next()) {
      try {
        await ensureProductQr(product);
        count++;
        // small delay to be kind to Cloudinary rate limits
        await new Promise(r => setTimeout(r, 120));
      } catch (e) {
        console.error(`Failed on product ${product._id}:`, e.message);
      }
    }

    console.log(`Backfill complete. Generated ${count} QR(s).`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
