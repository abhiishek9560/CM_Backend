const {model, Schema, default: mongoose} = require('mongoose');


const ProductSchema = new Schema({
    title: {
        type: String,
        required: true,
    },

    description:{
        type: String,
        required:true,
    },

    price:{
        type: Number,
        required:true,
    },

    image:[String],

    category:{
        type:String,
        required:true,
    },

    status:{
        type:String,
        enum:['Available','Reserved','Sold'],
        default: 'Available',
    },

    seller:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },

    buyer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        default:null,
    },

    qr: {
        url: String,
        public_id: String,
        createdAt: Date,
    },

    createdAt:{
        type:Date,
        default:Date.now,
    }


});


const ProductModel = model("Product", ProductSchema);
module.exports = ProductModel;