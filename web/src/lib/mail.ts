import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // Bypass self-signed certificate issues
  },
});

export const sendVerificationEmail = async (email: string, token: string) => {
  const domain = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verificationLink = `${domain}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Protech System" <no-reply@protech.com>',
    to: email,
    subject: "Verify your email - Protech System",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <h2 style="color: #0f172a; font-weight: 800;">Welcome to Protech System</h2>
        <p style="color: #64748b; line-height: 1.6;">Thank you for registering. Please verify your email address to activate your account.</p>
        <a href="${verificationLink}" style="display: inline-block; background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;">Verify Email Address</a>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 30px;">If you did not create an account, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 10px;">Protech Assist SL Limited</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error("Failed to send verification email:", error);
    // We don't throw here to avoid failing the whole registration if email fails
    // In a production app, you might want to handle this differently
  }
};

export const generateVerificationToken = () => {
  return uuidv4();
};
