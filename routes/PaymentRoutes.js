const express = require('express');
const Razorpay = require('razorpay');
const  crypto = require('crypto');
const Order = require('../models/OrderModel');
const Product = require('../models/ProductModel');
const User = require('../models/UserModel');
const verifyToken = require('../middlewares/userAuthentication');
const { sendOrderConfirmation, sendOrderConfirmationMail, sendOrderNotificationToSeller, sendOrderConfirmationWithQR } = require('../utils/mailer');


// creating the paymer router(router) so as to use it in the index.js as API
const router = express.Router();



// initializing razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET  
});


// creating order + razorpay order
router.post("/create-order", verifyToken, async(req,res)=>{
    try{
        const {productId, deliveryAddress, amount} = req.body;
        const buyerId = req.user.id;


        const product = await Product.findById(productId);
        if(!product){
            console.log("No such product found");
            return res.status(500).json("NO products found");
        }

        const options = {
            amount: amount*100,
            currency: "INR",
            receipt: "receipt_" + Date.now(),
        };

        const razorpayOrder = await razorpay.orders.create(options);

        const order = await Order.create({
            buyer: buyerId,
            seller: product.seller,
            product: productId,
            deliveryAddress,
            amount: amount,
            status:"Pending",
            paymentInfo: {razorpay_order_id: razorpayOrder.id},
        });

        res.json({
            success:true,
            razorpayOrder,
            order,
        });

    }catch(error){
        console.log(error);
        res.status(500).send("Error creating order");
    }
});


router.post("/verify-payment", async(req,res)=>{
    try{
        const {razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId} = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSign = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(sign.toString())
        .digest("hex");


        if(razorpay_signature === expectedSign){
            
            const order = await Order.findByIdAndUpdate(orderId, {
                status: "Paid",
                orderID: `ORD-${Date.now()}${Math.floor(Math.random()*9000) + 1000}`,
                paymentInfo: {razorpay_order_id, razorpay_payment_id, razorpay_signature},
            }, {new: true});

            await Product.findByIdAndUpdate(order.product, {
                status: "Reserved",
            });



            res.json({
                success:true,
                order
            });


            const buyer = await User.findById(order.buyer);
            const seller = await User.findById(order.seller);

            // await sendOrderConfirmationWithQR(buyer.email, seller.email, order);
            // sending mail asynchronously
            sendOrderConfirmationWithQR(buyer.email, seller.email, order)
            .then(result => {
                if(!result.success) console.error("Email send failed", result.error)
                else console.log("Email sent successfully");
            })
            .catch(error => console.error("Email send failed", error));
            
            
            
        }else{
            return res.status(400).json({success:false, message: "Invalid Signature"});
        }
    }catch(error){
        console.log(error);
        res.status(500).send("Error verifying payment");
    }
});

router.get("/get-order", async(req,res)=>{
    try{
        const {order_id} = req.query;
        const order = await Order.findById(order_id);
        res.status(200).json({order});
    }catch(error){
        console.log(error);
        res.status(500).json("Error fetching order");
    }
});



router.post("/confirm-order-delivery", async(req,res)=>{
    const {orderId} = req.body;

    const order = await Order.findById(orderId);
    if(!order){
        return res.status(400).json({success: false, message:"Order not found"});
    }

    if(order.status !=="Paid"){
        return res.status(400).json({success:false, message:"Payment not done"});
    }

    //updating order
    order.status = "Delivered";
    await order.save();

    //updating product
    await Product.findByIdAndUpdate(
        order.product,
        {status:"Sold", buyer:order.buyer},
        {new:true}
    );
   

    //updating seller stats
    await User.findByIdAndUpdate(order.seller,{
        $pull:{totalListings: order.product},
        $push:{itemsSold: order.product},
        $inc:{totalEarning: order.amount}
    })
    

    //updating buyer 
    await User.findByIdAndUpdate(order.buyer, {
        $push:{itemsPurchased:order.product}
    })
    
    return res.json({
        success:true,
        message: "Order delviered Successfully",
        order
    })
});

module.exports = router

