const multer = require('multer');
const {CloudinaryStorage} = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');


const storage = new CloudinaryStorage({
    cloudinary,
    params:{
        folder: 'CM_products',
        allowed_formats: ['jpeg', 'png', 'jpg', 'webp'],
    },
});


const upload = multer({storage});
module.exports = upload;