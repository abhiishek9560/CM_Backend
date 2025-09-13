const {model, Schema, default: mongoose} = require('mongoose');
const Razorpay = require('razorpay');

const OrderSchema = new Schema({

    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },

    seller:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },

    product:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required:true,  
    },

    quantity:{
        type: Number,
        default: 1,
    },
    
    deliveryAddress: {
        name: {type: String, required:true},
        number: {type: String, required:true},
        nearbyHostel: {type:String, required:true},
        completeAddress: {type:String, required:true},
    },

    paymentInfo: {
        razorpay_order_id: String,
        razorpay_payment_id: String,
        razorpay_signature: String
    },

    status: {
        type: String,
        enum: ["Pending", "Paid", "Delivered", "Cancelled"],
        default: "Pending",
    },

    amount:{
        type: Number,
        required:true,
    },
    
    orderID:{
        type:String,
    },

    createdAt: {
        type: Date,
        default: Date.now(),
    }
});


const OrderModel = model("Order", OrderSchema);
module.exports = OrderModel;