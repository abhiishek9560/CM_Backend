const express = require('express')
const router =express.Router();
const upload = require('../utils/multer');

const Product = require('../models/ProductModel');
const User = require('../models/UserModel');
const verifyToken = require('../middlewares/userAuthentication');
const { ensureProductQr, refreshProductQr } = require('../utils/qr');
// const uploadToCloudinary = require('../utils/cloudinary');

router.get('/product/:product_id', async(req,res)=>{

    try {
        const product = await Product.findById(req.params.product_id);
        res.status(200).json({product})
    } catch(error){
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
    
});


router.post('/list-prod', verifyToken, upload.array('images', 5), async(req,res)=>{

    try{
    const {title, description, price, category } = req.body;
    // const imageUrls = req.files.map(file => file.path);
    const seller = req.user.id;

    if(!req.files || req.files.length === 0){
        return res.status(400).json({
            success: false,
            message: "No images uploaded"
        })
    }

    const imageUrls = req.files.map(file => file.path);

    const prodExist = await Product.findOne({title: title, description: description});
    if(prodExist){
        return res.status(500).json({
            success: false,
            message: "Product already exists"
        })
    }
    

    const newProduct = new Product({title, description, price, image: imageUrls, category, seller});
    await newProduct.save();
    console.log(newProduct);

    await ensureProductQr(newProduct);

    // updating the product count
    await User.findByIdAndUpdate(
        seller,
        {$inc: {totalListings: 1}},
        {new:true}
    );
    
    res.status(200).json({
        success: true,
        product: newProduct,
        message: "New product added successfully"
    })
    }catch(error){
        console.error("Upload error:", error);
        res.status(500).json({
            status:false,
            message:error.message
        })
    }
});


router.get('/filtered-prod-list', async(req,res) =>{

    try{
        let {query, category, price} = req.query;
        const filter ={};

        if(query){
            filter.title = {$regex: query, $options:"i"};
        }

        if(category && category !== 'All'){
            filter.category = {$regex: new RegExp(`^${category}$`, "i")};
        }
        console.log(price, query, category);

        if(price && price !== "allPrices"){
            
            if(price === "500"){
                filter.price = {$lte: parseFloat(price)};
            }
            else if(price === "1000"){
                filter.price = ( {$gte: parseFloat(price)})
            }
            else if(price === "500-1000"){
                const minPrice = 500;
                const maxPrice = 1000
                filter.price = {$gte: parseFloat(minPrice), $lte: parseFloat(maxPrice)}
            };
        }
        
            // filter.price = {$lte: parseFloat(minPrice)};
            // else if(price === "over1000"){
            //     filter.price = {$gte: parseFloat(1000)};
            // }
            // else if(price === "500-1000"){
            //     filter.price = {$gte: parseFloat(500), $lte: parseFloat(1000)};
            // }
        // if(category && category !== 'All'){
        //     filter.category = {$regex: new RegExp(`^${category}$`, "i")};
        // }

        // if(query){
        //     filter.title = {$regex: query, $options: "i"};
        // }

        const products = await Product.find(filter);
        res.status(200).json({products});
    }catch(error){
        console.log(error.message);
        res.status(500).json({message:error.message});
    }
});



// routes/ProductRoutes.js (more)
router.get('/product/:product_id/qr', async (req, res) => {
  try {

    const refresh = req.query.refresh === '1';

    const product = await Product.findById(req.params.product_id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const result = refresh
      ? await refreshProductQr(product)
      : await (product.qr?.url ? product.qr : ensureProductQr(product));

    return res.json({ success: true, url: result.url });
  } catch (error) {
    console.error('QR endpoint error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});



router.get("/get-product", async(req,res)=>{
    try{
        const {product_id} = req.query;
        const product = await Product.findById(product_id);
        res.status(200).json({product});
    }catch(error){
        console.log(error);
        res.status(500).json("Error fetching product");
    }
})



module.exports = router