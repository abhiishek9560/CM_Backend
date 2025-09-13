const {model, Schema, default: mongoose} = require('mongoose');



const UserSchema = new Schema({

    name:{
        type:String,
        required:true,
    },

    email:{
        type:String,
        required:true,
    },

    role:{
        type:String,
        enum:['student','admin','faculty'],
        default:'student',
    },

    password:{
        type:String,
        required:true,
    },

    department:{
        type:String,
        required:true,
    },

    phone:{
        type:String,
        default:null
    },

    location:{
        type:String,
        default:null
    },
    
    bio:{
        type:String,
        default:null
    },

    totalListings:[
        {
            type:mongoose.Schema.Types.ObjectId, ref:"Product",
        }
    ],

    itemsSold:[
        {
            type:mongoose.Schema.Types.ObjectId, ref:"Product",
        }
    ],
    
    totalEarning:{
        type:Number,
        default:0
    },

    itemsPurchased:[
        {
            type:mongoose.Schema.Types.ObjectId, ref:"Product",
        }
    ],

    createdAt:{
        type:Date,
        default:Date.now,
    }
});

const UserModel = model("User", UserSchema);
module.exports = UserModel;