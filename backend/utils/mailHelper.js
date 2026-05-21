import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT) || 465,
  secure: process.env.EMAIL_SECURE === "true" || (parseInt(process.env.EMAIL_PORT || 465) === 465), 
  pool: true, // Connection reuse karne ke liye
  maxConnections: 5,
  maxMessages: 100,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

export const sendEmail = async (to, subject, text, html) => {
  const mailOptions = {
    from: `"PackagingBazaar" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  };

  // Fire and forget (Runs in background, doesn't block API response)
  transporter.sendMail(mailOptions)
    .then(info => console.log("Background Email sent: " + info.response))
    .catch(error => console.error("Background Error sending email:", error));
    
  return true; // Immediately returns to unblock the API
};
