import nodemailer from "nodemailer";
import * as dotenv from "dotenv";
import path from "path";

// Load .env from the root of the web directory
dotenv.config({ path: path.join(process.cwd(), '.env') });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

async function testEmail() {
  console.log("Starting email test with config:");
  console.log("Host:", process.env.SMTP_HOST);
  console.log("Port:", process.env.SMTP_PORT);
  console.log("Secure:", process.env.SMTP_SECURE);
  console.log("User:", process.env.SMTP_USER);
  
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: "protechassist36@gmail.com", // Sending to self for test
    subject: "Protech SMTP Test",
    text: "This is a test email to verify SMTP configuration.",
  };

  try {
    await transporter.verify();
    console.log("SMTP Connection verified successfully.");
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
  } catch (error) {
    console.error("SMTP Test Failed:", error);
  }
}

testEmail();
