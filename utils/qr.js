const QRCode = require('qrcode');
const cloudinary = require('./cloudinary');

const uploadBufferToCloudinary = (buffer, publicId) => 
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: 'CM_qr',
                public_id: publicId,
                overwrite:true,
                resource_type: 'image',
            },
            (error, result) => (error? reject(error) : resolve(result))
        );
        stream.end(buffer);
    });



    async function generateQrPng(url){
        return QRCode.toBuffer(url, {
            type: 'png',
            width: 600,
            margin: 1,
            color: {dark: '#000000', light: '#FFFFFF'}
        });
    }



    async function ensureProductQr(product){
        if(product.qr?.url){
            return {url: product.qr.url, public_id: product.qr.public_id};
        }

        const productURL = `${process.env.VITE_API_URL}/market/product/${product._id}`;
        const png = await generateQrPng(productURL);
        const publicId = `qr_${product._id}`;


        const uploaded = await uploadBufferToCloudinary(png, publicId);

        product.qr = {
            url: uploaded.secure_url,
            public_id: uploaded.public_id,
            generatedAt: new Date(),
        };

        await product.save();

        return {url: product.qr.url, public_id: product.qr.public_id};
    };



    async function refreshProductQr(product){
        const productURL = qr.url;
        const png = await generateQrPng(productURL);
        const publicId =  `qr_${product._id}`;


        const uploaded = await uploadBufferToCloudinary(png, publicId);

        product.qr = {
            url: uploaded.secure_url,
            public_id: uploaded.public_id,
            generatedAt: new Date(),
        };

        await product.save();

        return {url:product.qr.url, public_id: product.qr.public_id};
    }


    module.exports = {ensureProductQr, refreshProductQr};