import dotenv from "dotenv";

dotenv.config();

const config = {
    MONGODB: process.env.MONGO_URI,
    PORT: Number(process.env.PORT) || 3000,
};

export default config;
