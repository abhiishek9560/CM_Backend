const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const jwt = require('jsonwebtoken');
const otpStore = {};

// required models
const User = require('../models/UserModel');
const Order = require('../models/OrderModel');
const verifyToken = require('../middlewares/userAuthentication');
const { sendOtpEmail } = require('../utils/mailer');


router.get('/user', async(req,res)=>{
    try{
        const user = await User.find();
        res.status(200).json(user);
    }
    catch(error){
        console.log(error.message);
        res.status(500).json({message:error.message});
    }
})


// signup route
router.post('/signup', async(req,res)=>{
    
    try{
        const {name, email, password, role, department, otp} = req.body;
        const matchingOTP = otpStore[email];
        console.log("Otp is: ", otp);
        console.log("stored otp: ", matchingOTP);

        // matching the userOTP and the stored OTP
        if(!matchingOTP){
            return res.status(400).json({message: "OTP not available in our store"});
        }else if(matchingOTP.otp != otp){
            return res.status(400).json({message: "Invalid OTP"});
        }else if(Date.now() > matchingOTP.expiresAt){
            return res.status(400).json({message: "Expired OTP"});
        }
        
        // checking for existing user
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(200).json({
                message: "This user already exists in my database"
            })
        }

        // salting and hashing the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // creating new user with the hashed pawwrod
        const newUser = new User({name, email, password:hashedPassword, role, department});
        await newUser.save();
        res.status(200).json({
            success:true,
            user: newUser
        })
    }
    catch(error){
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
});


// otp route
router.post('/send-otp', async(req,res) =>{
    const email = req.body.email;


    // generate otp first
    try{
        const otp = otpGenerator.generate(6, {digits:true, lowerCaseAlphabets:false, upperCaseAlphabets:false, specialChars:false});
        const expiresAt = Date.now() + 5*60*1000;
        console.log(otp, expiresAt);

        otpStore[email] = {otp, expiresAt};

        //create the transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        })

        const mailOptions = {
            from: 'reviewit124@gmail.com',
            to: email,
            subject: 'Your OTP for the CollegeMarketPlace Sign Up',
            html: `<h2>Hello!</h2><p>Your One-Time Password (OTP) is: <strong>${otp}</strong></p><p>This OTP is valid for 5 minutes.</p>`

        }

        await transporter.sendMail(mailOptions);
        res.status(200).json({
            otp: otp,
            expiteTime: expiresAt,
            message: `OTP sentt to ${email}`
        });

        // const result = await sendOtpEmail(email, otp);
        // if (result.success) {
        //     res.json({ success: true });
        // } else {
        //     res.status(500).json({ success: false, error: result.error });
        // }
    }
    catch(error){
        console.error("Error sending OTP:", error.message);
        res.status(500).json({ message: "Failed to send OTP" });
    }
})


router.post('/signin', async(req,res)=>{

    try{
        const {email, password} = req.body;

        const userExist = await User.findOne({email});
        if(!userExist){
            return res.status(400).json({
                success:false,
                message:"User doesn't exist"
            });
        }

        const hashMatch = await bcrypt.compare(password, userExist.password);
        if(!hashMatch){
            return res.status(400).json("Invalid user credentials");
        }

        const token = jwt.sign({id:userExist._id, role:userExist.role}, process.env.JWT_SECRET, {expiresIn: "1h"});

        res.cookie("token", token, {
            httpOnly: true,
            secure:true,
            sameSite:"None",
            maxAge: 3600000
        });

        res.status(200).json({
            message:"signin successful"
        })
    }catch(error){
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
});

router.get('/get-seller-name', async(req,res) => {
    try{
        const {query} = req.query;

        const sellerName = await User.findOne({query});
        // console.log(sellerName);
        res.status(200).json(sellerName.name);
    }catch(error){
        console.log(error.message);
        res.status(500).json({message:error.message});
    }
});

router.get('/user-details', verifyToken, async(req, res)=> {
    try{
        const user = await User.findById(req.user.id).select("-password");
        if(!user) return res.status(404).json({message: "User not found"});

        res.status(200).json({user});
    }catch(error){
        res.status(500).json({message: error.message});
    }
});



router.get('/is-loggedin', verifyToken, async(req, res)=> {
    try{
        res.status(200).json({user:req.user});
    }
    catch(error){
        console.log(error.message);
        res.status(400).json({message: "User not logged in"});
    }
})

router.post('/logout', async(req, res)=>{
    try{
        res.clearCookie("token", {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
        })
        res.status(200).json({message: "User logged out"});
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
} );

router.put('/update-user', verifyToken, async(req,res)=>{
    try{
        const updatedFields = req.body || {};


        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            {$set: updatedFields},
            {new:true, runValidators:true, context:'query'}
        ).select('-password');

        return res.status(200).json({
            success: true,
            user: updatedUser
        });


    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message: error.message
        });
    }
});

router.put('/user-stat-update', verifyToken, async(req, res)=>{
    try{
        const updatedStats = req.body || {};

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            {$set: updatedStats},
            {new:true, runValidators:true, context:'query'}
        ).select('-password');

        return res.status(200).json({
            success:true,
            user:updatedUser
        });
    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message
        });
    }
});


router.get("/get-seller", async(req,res)=>{
    try{
        const {seller_id} = req.query;
        const seller = await User.findById(seller_id);
        res.status(200).json({seller});
    }catch(error){
        console.log(error.message);
        res.status(500).json("Error fetching seller");
    }
});




router.get('/seller-details/:seller_id', async(req, res)=> {
    try{
        const user = await User.findById(req.params.seller_id).select("-password");
        if(!user) return res.status(404).json({message: "User not found"});

        res.status(200).json({user});
    }catch(error){
        res.status(500).json({message: error.message});
    }
});



router.get("/totalListings/:userId", async(req, res)=>{
    try{
        const {userId} = req.params;
        const user = await User.findById(userId).populate("totalListings");

        if(!user){
            return res.status(404).json({success: false, message: "User not found"});
        }

        res.status(200).json({
            success:true,
            products: user.totalListings,
        })
    }catch(error){
        console.log(error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
});



//fetching all orders of a user
router.get("/orders/:userId", async(req,res)=>{
    try{
        const orders = await Order.find({buyer: req.params.userId})
        .populate("product")
        .populate("seller", "name");

        if(!orders){
            return res.status(200).json({success:false, message:"User not found"});
        }

        res.status(200).json({
            success:true,
            orders: orders,
        })
    }catch(error){
        console.log(error.message);
        res.status(500).json({success:false, message:"Server  error"});
    }
});

module.exports = router