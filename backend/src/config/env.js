import dotenv from "dotenv";

dotenv.config();

const asBoolean = (value) => String(value).toLowerCase() === "true";

const config = {
    MONGODB: process.env.MONGO_URI || "mongodb://localhost:27017/ mindly",
    PORT: Number(process.env.PORT) || 3000,
    SKIP_DB: asBoolean(process.env.SKIP_DB),
    GMAIL_USER:process.env.GMAIL_USER,
    GMAIL_APP_PASSWORD:process.env.GMAIL_APP_PASSWORD,
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
    AUTH_TOKEN_SECRET: process.env.AUTH_TOKEN_SECRET,
    AUTH_TOKEN_TTL_HOURS: Number(process.env.AUTH_TOKEN_TTL_HOURS) || 24,
};

export default config;
