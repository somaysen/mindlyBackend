import mongoose from "mongoose";
import config from "./env.js";


const connectDB = async () =>{
    try {
        if (!config.MONGODB) {
            throw new Error("MONGO_URI is not configured");
        }

        await mongoose.connect(config.MONGODB);
        console.log("MongoDB connected");
    } catch (error) {
        throw new Error(`MongoDB connection failed: ${error.message}`);
    }
};

export default connectDB;
