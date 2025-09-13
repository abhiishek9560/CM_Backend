require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require("mongoose");

(async ()=>{
  try {
    await mongoose.connect(process.env.MONGO_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log("✅ Connected to Atlas!");
    await mongoose.disconnect();
  } catch(err) {
    console.error("❌ Error:", err.message);
  }
})();
