const express = require("express");
const app = express();
const mongoose = require("mongoose");;
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const userRoute = require('./src/routes/userRoutes'); 
const cors = require('cors');
const path = require('path');
const jwtMiddleware = require("./src/middleware/jwtMiddleware");
const authRoute = require('./src/routes/authRoutes');

dotenv.config();

const PORT = process.env.PORT ||3000;
//connect to mongodb
connectDB();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
    const excludedRoutes = ["/user/login", "/user/signup", "/user/forgot-password" , "/user/reset-password" , "/user/verify-otp" , "/user/create-user"];
    if (excludedRoutes.includes(req.path)) {
        return next(); // Skip token verification for excluded routes
    }
    jwtMiddleware.verifyToken(req, res, next); 
});
app.use("/api/v1", authRoute);
app.use("/user", userRoute);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
});



app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});