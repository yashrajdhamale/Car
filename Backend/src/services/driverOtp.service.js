import crypto from "crypto";
import { firebaseAdmin, firestore, FieldValue } from "./firebase.js";
import { sendEmailThroughBackend } from "./emailProxy.service.js";

function generateOtp() {
  const buf = crypto.randomBytes(4);
  return String(100000 + (buf.readUInt32BE(0) % 900000));
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function collectionForType(rideType) {
  const mapping = {
    outstation: "bookings",
    airport: "airportTransfers",
    holiday: "holidayBookings",
    localPickup: "localRides",
  };
  return mapping[rideType] || "bookings";
}

export const generateDriverRideOtp = async (payload) => {
  const { bookingId, rideType = "outstation", driverName, driverPhone, vehicleType, vehicleNumber } = payload || {};
  if (!bookingId) throw new Error("bookingId is required");

  const colName = collectionForType(rideType);
  const bookingRef = firestore.collection(colName).doc(bookingId);
  const bookingSnap = await bookingRef.get();

  if (!bookingSnap.exists) {
    throw new Error(`Booking not found in ${colName}`);
  }

  const d = bookingSnap.data();

  // Generate + store OTP
  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await bookingRef.update({
    otpHash,
    otpExpiresAt: firebaseAdmin.firestore.Timestamp.fromDate(otpExpiresAt),
    otpGeneratedAt: FieldValue.serverTimestamp(),
    otpVerified: false,
    otpAttempts: 0,
  });

  // Resolve user email
  let email = d.userEmail || d.email || d.customerEmail || null;
  if (!email && d.userId) {
    try {
      const userSnap = await firestore.collection("users").doc(d.userId).get();
      if (userSnap.exists) {
        const u = userSnap.data();
        email = u.email || u.userEmail || u.emailAddress || null;
      }
    } catch (e) {
      console.warn("⚠️ Firestore user lookup failed:", e.message);
    }
  }

  if (!email && d.userId) {
    try {
      const authUser = await firebaseAdmin.auth().getUser(d.userId);
      email = authUser.email || null;
    } catch (e) {
      console.warn("⚠️ Auth lookup failed:", e.message);
    }
  }

  // Send Email
  if (email) {
    const customerName = d.userName || d.customerName || d.displayName || "Customer";
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
            <tr><td style="padding:6px 0;color:#888;">Driver Name</td><td style="padding:6px 0;font-weight:700;text-align:right;">${driverName || d.driverName || "—"}</td></tr>
            <tr><td style="padding:6px 0;color:#888;">Phone</td><td style="padding:6px 0;font-weight:700;text-align:right;">${driverPhone || d.driverPhone || "—"}</td></tr>
            ${vehicleType ? `<tr><td style="padding:6px 0;color:#888;">Vehicle</td><td style="padding:6px 0;font-weight:700;text-align:right;">${vehicleType}</td></tr>` : ""}
            ${vehicleNumber ? `<tr><td style="padding:6px 0;color:#888;">Number Plate</td><td style="padding:6px 0;font-weight:700;text-align:right;">${vehicleNumber}</td></tr>` : ""}
            <tr><td style="padding:6px 0;color:#888;">Booking ID</td><td style="padding:6px 0;font-size:12px;text-align:right;color:#999;">${bookingId}</td></tr>
          </table>
        </div>
      </div>`;

    await sendEmailThroughBackend({
      to: email,
      subject: `🔒 Your Ride OTP — ${otp} | Cabroute`,
      html,
    });
  }

  return { success: true, message: "OTP sent", expiresAt: otpExpiresAt.toISOString() };
};

export const verifyDriverRideOtp = async (payload) => {
  const { bookingId, rideType = "outstation", otp, driverId } = payload || {};
  if (!bookingId) throw new Error("bookingId is required");
  if (!otp) throw new Error("otp is required");

  const colName = collectionForType(rideType);
  const bookingRef = firestore.collection(colName).doc(bookingId);

  const result = await firestore.runTransaction(async (tx) => {
    const snap = await tx.get(bookingRef);
    if (!snap.exists) throw new Error("Booking not found");
    const data = snap.data();

    if (data.otpVerified === true) return { success: true, alreadyVerified: true };
    if (!data.otpHash) throw new Error("No OTP found. Ask your driver to resend.");

    const expiresAt = data.otpExpiresAt?.toDate();
    if (expiresAt && new Date() > expiresAt) {
      return { success: false, reason: "expired", message: "OTP has expired. Ask your driver to generate a new one." };
    }

    const attempts = (data.otpAttempts || 0) + 1;
    if (attempts > 5) {
      return { success: false, reason: "max_attempts", message: "Too many incorrect attempts. Contact support." };
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
      otpVerifiedAt: FieldValue.serverTimestamp(),
      otpVerifiedByDriver: driverId || null,
      status: "in_progress",
      rideStartedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      otpHash: FieldValue.delete(),
      otpExpiresAt: FieldValue.delete(),
    });

    return { success: true };
  });

  return result;
};
