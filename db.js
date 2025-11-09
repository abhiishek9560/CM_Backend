require("dotenv").config();
const mongoose = require('mongoose')


const connectDB = async ()=> {
    try{

        // localhost database
        // await mongoose.connect("mongodb://localhost:27017/CollegeMarketPlace");
        // console.log("Database connected");


        // atlas cloud database
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        
        console.log("Atlas Database connected");
    }
    catch(error){
        console.error(error.message);
        process.exit(1);
    }
}


module.exports = connectDB;