require('dotenv').config();

const express = require('express')
const app = express()
const port = 3000
const cors = require('cors')
const cookieParser = require('cookie-parser')

const allowedOrigins = [
    "http://localhost:5173",
    "https://cm-frontend-virid.vercel.app"
]

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));
const connectDB = require("./db");

const users = require('./routes/UserRoutes');
const products = require('./routes/ProductRoutes');
const payment = require('./routes/PaymentRoutes');


connectDB();

app.use('/user', users);
app.use('/market', products);
app.use('/payment', payment);


app.get('/',(req, res)=>{
    res.send("Hiii, I welcome you on CollegeMarket. You are talking to CM_Backend");
} )
app.listen(process.env.PORT, ()=>{
    console.log(`Server is running on port: ${port}`)
} )