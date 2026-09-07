import nodemailer from "nodemailer";
import config from "./env.js";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: config.GMAIL_USER,
        pass: config.GMAIL_APP_PASSWORD,
    },
});

export default transporter;