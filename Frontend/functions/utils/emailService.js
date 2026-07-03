import dotenv from "dotenv";
import nodemailer from "nodemailer";
import handlebars from "handlebars";
import fs from "node:fs/promises";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });

const emailConfig = {
  user: process.env.EMAIL_USER,
  password: process.env.EMAIL_PASSWORD,
  from: process.env.EMAIL_FROM,
  adminEmail: process.env.ADMIN_EMAIL,
  service: "gmail",
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
};

const requiredVars = ["EMAIL_USER", "EMAIL_PASSWORD", "EMAIL_FROM", "ADMIN_EMAIL"];
const missingVars = requiredVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error("Missing required environment variables:", missingVars.join(", "));
  console.error("Please check Frontend/.env and ensure all required variables are set.");
}

console.log("Email service initialized (sending disabled)");

const sendBookingConfirmation = async (to, bookingDetails) => {
  console.log("Email sending is disabled. Would have sent booking confirmation to:", to);
  console.log("Booking details:", bookingDetails);
  return { success: true, messageId: "email_disabled" };
};

const sendAdminNotification = async (bookingDetails) => {
  console.log(
    "Admin notification is disabled. Would have sent notification for booking:",
    bookingDetails?.bookingId || "unknown"
  );
  return { success: true, messageId: "notification_disabled" };
};

const testEmail = async (to) => {
  console.log("Test email is disabled. Would have sent to:", to);
  return { success: true, message: "Test email is disabled" };
};

const initializeTransporter = () => ({
  verify: (callback) =>
    callback(null, { success: true, message: "Email sending is disabled" }),
});

export {
  sendBookingConfirmation,
  sendAdminNotification,
  testEmail,
  initializeTransporter,
};

