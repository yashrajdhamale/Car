const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const twilio = require("twilio");

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// ── Firebase Secrets for Twilio ──────────────────────────────────────
const TWILIO_ACCOUNT_SID  = defineSecret("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN   = defineSecret("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = defineSecret("TWILIO_PHONE_NUMBER");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "cabworkpune@gmail.com",
    pass: "jprbiffnzihctmbw",
  },
});

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://carzi-holidays-f4be3.web.app",
  "https://carzi-holidays-f4be3.firebaseapp.com",
  "https://cabroute.in",
  "https://www.cabroute.in",
  "https://cabroute.in.travelogholiday.com",
];

function setCors(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) res.set("Access-Control-Allow-Origin", origin);
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function handleCors(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return true; }
  return false;
}

function generateOtp() {
  const buf = crypto.randomBytes(4);
  return String(100000 + (buf.readUInt32BE(0) % 900000));
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function collectionForType(rideType) {
  return { outstation: "bookings", airport: "airportTransfers", holiday: "holidayBookings", localPickup: "localRides" }[rideType] || "bookings";
}

// ── NEW: Format phone number for Twilio (must be +91XXXXXXXXXX) ──────
function formatIndianPhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, ""); // strip non-digits
  // If we don't have at least a 10-digit number, don't attempt SMS.
  // This avoids cases like "Not provided" becoming "+" and causing Twilio errors.
  if (digits.length < 10) return null;
  if (digits.length === 10) return `+91${digits}`;          // 9876543210 → +919876543210
  if (digits.length === 11 && digits.startsWith("0")) return `+91${digits.slice(1)}`; // 09876543210 → +919876543210
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`; // 919876543210 → +919876543210
  if (digits.length === 13 && digits.startsWith("91")) return `+${digits.slice(1)}`; // edge case
  return `+${digits}`; // fallback — pass as-is with +
}

// ── NEW: Send OTP via SMS using Twilio ───────────────────────────────
async function sendOtpSms({ phone, otp, customerName, req }) {
  try {
    const accountSid  = TWILIO_ACCOUNT_SID.value();
    const authToken   = TWILIO_AUTH_TOKEN.value();
    const fromNumber  = TWILIO_PHONE_NUMBER.value();
    // TEMPORARY DEBUG — remove after fixing
    console.log(`🔑 SID length: ${accountSid?.length}, Token length: ${authToken?.length}, From: ${fromNumber}`);

    const client = twilio(accountSid, authToken);
    const toNumber = formatIndianPhone(phone);

    if (!toNumber) {
      console.warn("⚠️ SMS skipped — no phone number available");
      return;
    }

    await client.messages.create({
      body: `Dear ${customerName}, your Cabroute ride OTP is ${otp}. Valid for 10 minutes. Do NOT share with anyone except your driver.`,
      from: fromNumber,
      to: toNumber,
    });

    console.log(`✅ OTP SMS sent to ${toNumber}`);
  } catch (err) {
    // SMS failure should NOT block the email or response
    console.error("❌ SMS send failed (non-fatal):", err.message);
  }
}

async function sendOtpEmail({ to, customerName, otp, driverName, driverPhone, vehicleType, vehicleNumber, bookingId }) {
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:20px auto;padding:30px;border-radius:12px;background:#fff4e6;border:1px solid #ffd59f;">
    <div style="text-align:center;margin-bottom:24px;">
      <h2 style="color:#d35400;margin:0;">Your driver is here!</h2>
      <p style="color:#666;font-size:14px;margin-top:6px;">Share this OTP with your driver to start the ride</p>
    </div>
    <div style="background:#1a1a2e;border-radius:16px;padding:28px;text-align:center;margin:20px 0;">
      <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:0 0 10px;letter-spacing:1px;text-transform:uppercase;">Your Ride OTP</p>
      <div style="font-size:48px;font-weight:900;letter-spacing:12px;color:#f4511e;font-family:'Courier New',monospace;">${otp}</div>
      <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:14px 0 0;">Valid for 10 minutes &nbsp;·&nbsp; Do NOT share with anyone other than your driver</p>
    </div>
    <div style="background:#fff;border-radius:10px;padding:20px;margin:20px 0;border:1px solid #ffe0b2;">
      <h3 style="margin:0 0 14px;color:#333;font-size:15px;">Driver Details</h3>
      <table style="width:100%;font-size:14px;color:#444;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#888;">Driver Name</td><td style="padding:6px 0;font-weight:700;text-align:right;">${driverName || "—"}</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Phone</td><td style="padding:6px 0;font-weight:700;text-align:right;"><a href="tel:${driverPhone}" style="color:#d35400;text-decoration:none;">${driverPhone || "—"}</a></td></tr>
        ${vehicleType ? `<tr><td style="padding:6px 0;color:#888;">Vehicle</td><td style="padding:6px 0;font-weight:700;text-align:right;">${vehicleType}</td></tr>` : ""}
        ${vehicleNumber ? `<tr><td style="padding:6px 0;color:#888;">Number Plate</td><td style="padding:6px 0;font-weight:700;text-align:right;">${vehicleNumber}</td></tr>` : ""}
        <tr><td style="padding:6px 0;color:#888;">Booking ID</td><td style="padding:6px 0;font-size:12px;text-align:right;color:#999;">${bookingId}</td></tr>
      </table>
    </div>
    <div style="background:#fff8e1;border-left:4px solid #ff9800;border-radius:6px;padding:14px 18px;font-size:13px;color:#7a5200;">
      <strong>⚠️ Safety Reminder:</strong> Only share this OTP with the driver who has arrived for your booking.
    </div>
    <p style="text-align:center;font-size:12px;color:#aaa;margin-top:24px;">Thank you for choosing <strong>Cabroute</strong> · Ride safe!</p>
  </div>`;

  await transporter.sendMail({ from: "cabworkpune@gmail.com", to, subject: `🔒 Your Ride OTP — ${otp} | Cabroute`, html });
}

// ═══════════════════════════════════════════════════
// FUNCTION 1 — generateRideOtp
// ═══════════════════════════════════════════════════
exports.generateRideOtp = onRequest(
  { secrets: [TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER] }, // ← tells Firebase to inject secrets
  async (req, res) => {
    if (handleCors(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ error: "POST required" });

    try {
      const { bookingId, rideType = "outstation", driverName, driverPhone, vehicleType, vehicleNumber } = req.body || {};
      if (!bookingId) return res.status(400).json({ error: "bookingId is required" });

      const colName = collectionForType(rideType);
      const bookingRef = db.collection(colName).doc(bookingId);
      const bookingSnap = await bookingRef.get();

      if (!bookingSnap.exists) {
        return res.status(404).json({ error: `Booking not found in ${colName}` });
      }

      const d = bookingSnap.data();
      console.log(`📋 [${rideType}] Booking ${bookingId} fields: ${Object.keys(d).join(", ")}`);

      // Generate + store OTP
      const otp = generateOtp();
      const otpHash = hashOtp(otp);
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await bookingRef.update({
        otpHash,
        otpExpiresAt: admin.firestore.Timestamp.fromDate(otpExpiresAt),
        otpGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
        otpVerified: false,
        otpAttempts: 0,
      });

      // ── Resolve email ────────────────────────────────────────────────
      let email = d.userEmail || d.email || d.customerEmail || null;
      console.log(`📧 Direct field email: ${email || "not found"}`);

      if (!email && d.userId) {
        try {
          const userSnap = await db.collection("users").doc(d.userId).get();
          if (userSnap.exists) {
            const u = userSnap.data();
            email = u.email || u.userEmail || u.emailAddress || null;
            console.log(`📧 From users collection: ${email || "not found"}`);
          }
        } catch (e) { console.warn("⚠️ Firestore user lookup failed:", e.message); }
      }

      if (!email && d.userId) {
        try {
          const authUser = await admin.auth().getUser(d.userId);
          email = authUser.email || null;
          console.log(`📧 From Firebase Auth: ${email || "not found"}`);
        } catch (e) { console.warn("⚠️ Auth lookup failed:", e.message); }
      }

      // ── Resolve phone ────────────────────────────────────────────────
      // ── Resolve phone: check booking doc first, then users collection ────
      let phone = d.userPhone || d.customerPhone || d.phone || d.phoneNumber || null;

      // DEBUG: Log raw phone and all fields for this rideType
      console.log(`📱 [${rideType}] Raw phone from booking doc:`, JSON.stringify(phone));
      console.log(`📱 [${rideType}] All booking fields:`, JSON.stringify(Object.keys(d)));

      // Normalize common placeholders / invalid values
      if (typeof phone === "string") {
        const trimmed = phone.trim().toLowerCase();
        if (!trimmed || trimmed === "not provided" || trimmed === "na" || trimmed === "n/a") {
          phone = null;
        }
      }

      if (!phone && d.userId) {
        try {
          const userSnap = await db.collection("users").doc(d.userId).get();
          if (userSnap.exists) {
            const u = userSnap.data();
            phone = u.phoneNumber || u.userPhone || u.phone || u.contactNumber1 || null;
            console.log(`📱 Phone from users collection: ${phone || "not found"}`);
          }
        } catch (e) { console.warn("⚠️ Phone lookup from users failed:", e.message); }
      }

      console.log(`📱 Final phone for SMS: ${phone || "not found"}`);

      const customerName = d.userName || d.customerName || d.displayName || "Customer";

      // ── Send Email ───────────────────────────────────────────────────
      if (email) {
        await sendOtpEmail({
          to: email,
          customerName,
          otp,
          driverName:    driverName    || d.driverName    || "Your Driver",
          driverPhone:   driverPhone   || d.driverPhone   || "",
          vehicleType:   vehicleType   || d.vehicleType   || d.car?.name || "",
          vehicleNumber: vehicleNumber || d.vehicleNumber || "",
          bookingId,
        });
        console.log(`✅ OTP emailed to ${email} for booking ${bookingId} (${rideType})`);
      } else {
        console.warn(`⚠️ No email for booking ${bookingId}. OTP stored, not emailed.`);
      }

      // ── Send SMS (NEW) ───────────────────────────────────────────────
      await sendOtpSms({ phone, otp, customerName, req });

      // ── Response ─────────────────────────────────────────────────────
      if (!email && !phone) {
        return res.json({
          success: true,
          warning: "OTP generated but no customer email or phone found",
          hint: `Booking fields present: ${Object.keys(d).join(", ")}`,
          userId: d.userId || null,
        });
      }

      return res.json({ success: true, message: "OTP sent", expiresAt: otpExpiresAt.toISOString() });

    } catch (err) {
      console.error("❌ generateRideOtp error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);


// ═══════════════════════════════════════════════════
// FUNCTION 2 — verifyRideOtp (NO CHANGES)
// ═══════════════════════════════════════════════════
exports.verifyRideOtp = onRequest(async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "POST required" });

  try {
    const { bookingId, rideType = "outstation", otp, driverId } = req.body || {};
    if (!bookingId) return res.status(400).json({ error: "bookingId is required" });
    if (!otp)       return res.status(400).json({ error: "otp is required" });

    const bookingRef = db.collection(collectionForType(rideType)).doc(bookingId);

    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(bookingRef);
      if (!snap.exists) throw new Error("Booking not found");
      const data = snap.data();

      if (data.otpVerified === true) return { success: true, alreadyVerified: true };
      if (!data.otpHash) throw new Error("No OTP found. Ask your driver to resend.");

      const expiresAt = data.otpExpiresAt?.toDate();
      if (expiresAt && new Date() > expiresAt) {
        return { success: false, reason: "expired", message: "OTP has expired. Please ask your driver to generate a new one." };
      }

      const attempts = (data.otpAttempts || 0) + 1;
      if (attempts > 5) {
        return { success: false, reason: "max_attempts", message: "Too many incorrect attempts. Please contact support." };
      }

      if (hashOtp(String(otp).trim()) !== data.otpHash) {
        tx.update(bookingRef, { otpAttempts: attempts });
        const remaining = 5 - attempts;
        return {
          success: false,
          reason: "wrong_otp",
          message: remaining > 0 ? `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` : "Maximum attempts reached.",
        };
      }

      tx.update(bookingRef, {
        otpVerified: true,
        otpVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        otpVerifiedByDriver: driverId || null,
        status: "in_progress",
        rideStartedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        otpHash: admin.firestore.FieldValue.delete(),
        otpExpiresAt: admin.firestore.FieldValue.delete(),
      });

      return { success: true };
    });

    if (result.success) {
      return res.json({ success: true, message: result.alreadyVerified ? "Ride already started." : "OTP verified! Ride started." });
    }
    return res.status(200).json({ success: false, reason: result.reason, message: result.message });

  } catch (err) {
    console.error("❌ verifyRideOtp error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});