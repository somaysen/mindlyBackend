import config from "../config/env.js";
import transporter from "../config/mail.js";

const sendVerificationEmail = async (user, token) => {
  const verificationUrl = `${config.FRONTEND_URL}/verify-email?token=${encodeURIComponent(token)}`;

  await transporter.sendMail({
    from: `Mindly <${config.GMAIL_USER}>`,
    to: user.email,
    subject: "Verify your Mindly email address",
    text: `Verify your email address: ${verificationUrl}\n\nThis link expires in 15 minutes.`,
    html: `
      <p>Verify your email address by opening this link:</p>
      <p><a href="${verificationUrl}">Verify email</a></p>
      <p>This link expires in 15 minutes.</p>
    `,
  });
};

export default sendVerificationEmail;
