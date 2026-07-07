const mongoose = require("mongoose");

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/RBTChat";

    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 5000,
        });

        console.log("✅ MongoDB Connected");
    } catch (error) {
        console.warn("⚠️ MongoDB connection failed:", error.message);
        console.warn("The server will continue running, but database features will be unavailable until MongoDB is reachable.");
    }
};

module.exports = connectDB;