import transporter from "../config/mail.js";

const sendVerificationEmail = async (email, token) => {
    const verificationUrl =
        `http://localhost:9000/api/auth/verify-email?token=${token}`;

    await transporter.sendMail({
        from: `"Mindly" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: "Verify your Mindly account",
        html: `
            <div style="font-family: Arial; padding: 30px;">
                <h2>Welcome to Mindly 👋</h2>

                <p>
                    Thanks for creating an account.
                    Please verify your email address.
                </p>

                <a
                    href="${verificationUrl}"
                    style="
                        display: inline-block;
                        padding: 12px 20px;
                        background: #000;
                        color: #fff;
                        text-decoration: none;
                        border-radius: 8px;
                    "
                >
                    Verify Email
                </a>

                <p style="margin-top: 20px;">
                    This link will expire in 15 minutes.
                </p>
            </div>
        `,
    });
};

export default sendVerificationEmail;