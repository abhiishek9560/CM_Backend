const mongoose = require("mongoose");
const User = require("../models/UserModel"); // adjust path if needed

async function migrateUsers() {
  try {
    // ✅ connect to Mongo
    await mongoose.connect("mongodb://localhost:27017/CollegeMarketPlace"); // change DB name if needed
    console.log("Connected to MongoDB ✅");

    const users = await User.find({});
    console.log(`Found ${users.length} users to migrate...`);

    for (const user of users) {
      let changed = false;

      // totalListings → should be array of ObjectIds
      if (!Array.isArray(user.totalListings)) {
        user.totalListings = [];
        changed = true;
      } else {
        const validListings = user.totalListings.filter(id => mongoose.isValidObjectId(id));
        if (validListings.length !== user.totalListings.length) {
          user.totalListings = validListings;
          changed = true;
        }
      }

      // itemsSold → should be array of ObjectIds
      if (!Array.isArray(user.itemsSold)) {
        user.itemsSold = [];
        changed = true;
      } else {
        const validSold = user.itemsSold.filter(id => mongoose.isValidObjectId(id));
        if (validSold.length !== user.itemsSold.length) {
          user.itemsSold = validSold;
          changed = true;
        }
      }

      // itemsPurchased → should be array of ObjectIds
      if (!Array.isArray(user.itemsPurchased)) {
        user.itemsPurchased = [];
        changed = true;
      } else {
        const validPurchased = user.itemsPurchased.filter(id => mongoose.isValidObjectId(id));
        if (validPurchased.length !== user.itemsPurchased.length) {
          user.itemsPurchased = validPurchased;
          changed = true;
        }
      }

      if (changed) {
        await user.save();
        console.log(`✅ Fixed user ${user._id}`);
      }
    }

    console.log("Migration finished 🎉");
    await mongoose.disconnect();
  } catch (err) {
    console.error("Migration error ❌", err);
    await mongoose.disconnect();
  }
}

migrateUsers();
