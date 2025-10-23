// const nodemailer = require('nodemailer');
// const QRCode = require('qrcode');

// const transporter = nodemailer.createTransport({
//   service: "gmail", // or Outlook/other SMTP
//   auth: {
//     user: 'reviewit0124@gmail.com',
//     pass: 'lxrednnkzqfkbkfq'
//   }
// });

// async function sendOrderConfirmation(buyerEmail, sellerEmail, orderID) {
//   try {
//     // Generate QR Code (base64 string)
//     const qrDataUrl = await QRCode.toDataURL(`OrderID: ${orderID}`);
//     const base64Data = qrDataUrl.split(",")[1]; // remove 'data:image/png;base64,'

//     // Prepare attachments (inline image with cid)
//     const attachments = [
//       {
//         filename: "qrcode.png",
//         content: Buffer.from(base64Data, "base64"),
//         cid: "orderqr@marketplace", // unique cid
//       },
//     ];

//     // Buyer mail
//     await transporter.sendMail({
//       from: `"Marketplace" <reviewit124@gmail.com>`,
//       to: buyerEmail,
//       subject: "Order Confirmation",
//       html: `
//         <h2>Thank you for your order!</h2>
//         <p>Your order <b>${orderID}</b> has been confirmed.</p>
//         <p>Scan this QR at the time of delivery:</p>
//         <img src="cid:orderqr@marketplace" alt="Order QR" />
//       `,
//       attachments,
//     });

//     // Seller mail
//     await transporter.sendMail({
//       from: `"Marketplace" <reviewit124@gmail.com>`,
//       to: sellerEmail,
//       subject: "New Order Received",
//       html: `
//         <h2>You have a new order!</h2>
//         <p>Order ID: <b>${orderID}</b></p>
//         <p>Please prepare the product for delivery.</p>
//       `,
//     });

//     console.log("✅ Emails sent to buyer and seller");
//   } catch (err) {
//     console.error("❌ Error sending email:", err);
//   }
// }

// module.exports = { sendOrderConfirmation };



// utils/mailer.js
const nodemailer = require("nodemailer");
const QRCode = require("qrcode");
const jwt = require("jsonwebtoken");


const transporter = nodemailer.createTransport({
  service: "gmail", // change if using another provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
});

// helper to generate signed delivery token
function generateDeliveryToken(orderId, sellerId) {
  return jwt.sign(
    { orderId, sellerId, purpose: "delivery" },
    "Abhi_SECRET_KEY",
    { expiresIn: process.env.JWT_DELIVERY_EXPIRES || "7d" }
  );
}

async function generateDeliveryQR(deliveryLink) {
  // returns base64 data url
  return QRCode.toDataURL(deliveryLink);
}

// send confirmation to buyer (with QR inline) and notify seller
// async function sendOrderConfirmationWithQR(buyerEmail, sellerEmail, order) {
//   try {
    
//     const deliveryLink = `http://localhost:5173/delivery-confirmation/${order._id}`;
//     const qrDataUrl = await generateDeliveryQR(deliveryLink);

//     // convert DataURL -> Buffer for inline attachment (cid)
//     const base64Data = qrDataUrl.split(",")[1];
//     const qrBuffer = Buffer.from(base64Data, "base64");

//     // HTML templates (simple, professional)
//     const buyerHtml = `
//       <div style="font-family: Arial, sans-serif; color:#333;">
//         <div style="max-width:600px; margin:auto; padding:20px; border:1px solid #eee;">
//           <img src="${process.env.APP_URL}/assets/logo.png" alt="Logo" style="height:40px;"/>
//           <h2 style="color:#1f7bd6;">Order Confirmed — ${order.orderID || order._id}</h2>
//           <p>Hi ${order.buyerName || "Abhiiii"},</p>
//           <p>Thanks for your purchase. Your order has been confirmed.</p>
//           <h4>Order Summary</h4>
          
//           <p><strong>Total:</strong> ₹${order.amount}</p>
//           <p><strong>Delivery Address:</strong><br/>${order.deliveryAddress.completeAddress}</p>

//           <p style="margin-top:18px;">Please show the QR code below to the seller at the time of delivery.</p>
//           <img src="cid:orderqr" alt="Order QR" style="width:220px; height:auto; display:block; margin:12px 0;" />

//           <p style="color:#666; font-size:13px;">If you didn’t place this order, contact support immediately.</p>
//           <p style="margin-top:12px;">Best,<br/>College Market Team</p>
//         </div>
//       </div>
//     `;

//     const sellerHtml = `
//       <div style="font-family: Arial, sans-serif; color:#333;">
//         <div style="max-width:600px; margin:auto; padding:20px; border:1px solid #eee;">
//           <img src="${process.env.APP_URL}/assets/logo.png" alt="Logo" style="height:40px;"/>
//           <h2 style="color:#1f7bd6;">New Order — ${order.orderID || order._id}</h2>
//           <p>Hi ${order.sellerName || "Abhishekkkk"},</p>
//           <p>You have received a new order. Please prepare the item for delivery.</p>
//           <h4>Order Summary</h4>
          
//           <p><strong>Total:</strong> ₹${order.amount}</p>
//           <p><strong>Delivery Address:</strong><br/>${order.deliveryAddress.completeAddress}</p>
//           <p style="margin-top:12px;">You can confirm delivery by scanning the buyer's QR or by visiting:</p>
//           <p><a href="${deliveryLink}">${deliveryLink}</a></p>
//           <p style="margin-top:12px;">Best,<br/>College Market Team</p>
//         </div>
//       </div>
//     `;

//     // send buyer email (with QR inline)
//     await transporter.sendMail({
//       // from: `"College Market" <reviewit124@gmail.com>`,  
//       from: process.env.EMAIL_USER,
//       to: buyerEmail,
//       subject: `Order Confirmed — ${order.orderID || order._id}`,
//       html: buyerHtml,
//       attachments: [
//         {
//           filename:"order-qr.png",
//           content: qrBuffer,
//           cid:"orderqr"
//         }
//       ]
//     });

//     // send seller email (no inline QR necessary, but link included)
//     await transporter.sendMail({
//       // from: `"College Market" <reviewit124@gmail.com>`,
//       from: process.env.EMAIL_USER,
//       to: sellerEmail,
//       subject: `New Order Received — ${order.orderID || order._id}`,
//       html: sellerHtml,
//     });

//     return { success: true, deliveryLink };
//   } catch (err) {
//     console.error("Error sendOrderConfirmationWithQR:", err);
//     return { success: false, error: err.message || err };
//   }
// }


async function sendOrderConfirmationWithQR(buyerEmail, sellerEmail, order) {
  try {
    // console.log("📧 Sending simple emails to:", buyerEmail, sellerEmail);

    // Buyer email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: buyerEmail,
      subject: `Order Confirmed — ${order.orderID || order._id}`,
      text: `Hi there! Your order ${order.orderID || order._id} has been confirmed successfully.\n\nAmount: ₹${order.amount}\nDelivery Address: ${order.deliveryAddress?.completeAddress}\n\nThank you for shopping with College Market!`,
    });

    // Seller email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: sellerEmail,
      subject: `New Order Received — ${order.orderID || order._id}`,
      text: `Hello! You have received a new order (${order.orderID || order._id}).\n\nAmount: ₹${order.amount}\nDelivery Address: ${order.deliveryAddress?.completeAddress}\n\nPlease prepare the product for delivery.`,
    });

    console.log("✅ Simple emails sent successfully");
    return { success: true };
  } catch (err) {
    console.error("❌ Error in sendOrderConfirmationWithQR:", err);
    return { success: false, error: err.message || err };
  }
}

module.exports = { sendOrderConfirmationWithQR };





module.exports = {
  sendOrderConfirmationWithQR,
  generateDeliveryToken, // export if needed elsewhere
};
