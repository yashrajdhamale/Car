import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

console.log("EMAIL_USER =", process.env.EMAIL_USER);
console.log("EMAIL_PASSWORD exists =", !!process.env.EMAIL_PASSWORD);
console.log("EMAIL_FROM =", process.env.EMAIL_FROM);
// Create transporter using configured credentials
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

transporter.verify((err, success) => {
  if (err) {
    console.error("❌ SMTP VERIFY FAILED");
    console.error(err);
  } else {
    console.log("✅ SMTP VERIFIED");
  }
});

/**
 * Sends an email directly from the backend using nodemailer.
 * Supports passing html/text directly, or using pre-defined templates.
 */
export const sendEmailThroughBackend = async (payload) => {
  const { to, subject, html, text, template, data } = payload || {};

  if (!to) {
    throw new Error("Recipient email (to) is required");
  }

  let emailHtml = html || "";
  let emailText = text || "";
  let emailSubject = subject || "Notification from Cabroute";

  // Template handling (re-implemented from cloud functions logic)
  if (template === "localPickupInvoice" || template === "sendLocalPickupInvoice") {
    const base = Number((payload.distance * 12).toFixed(2));
    const gstAmount = Number(((base * 5) / 100).toFixed(2));
    const total = Number((base + gstAmount).toFixed(2));
    const invoiceNum = payload.invoiceNumber || `INV-${payload.bookingId || Date.now()}`;
    const genDate = payload.generatedDate || new Date().toLocaleDateString();

    emailHtml = `
      <div style="font-family: Arial, Helvetica, sans-serif; color:#333; max-width:700px; margin:20px auto; padding:25px; border-radius:10px; background:#f0f4ff;">
        <h2 style="text-align:center; margin:0 0 20px; color:#302b63;">Cabroute — Local Pickup Invoice</h2>
        <div style="margin-bottom:15px;">
          <strong>Invoice No:</strong> ${invoiceNum}<br/>
          <strong>Booking ID:</strong> ${payload.bookingId || "-"}<br/>
          <strong>Date:</strong> ${genDate}<br/>
          <strong>Contact:</strong> 9922514719
        </div>
        <div style="margin-bottom:15px;">
          <h4 style="margin:0 0 8px;">Bill To</h4>
          <div><strong>Name:</strong> ${payload.customerName || "-"}</div>
          <div><strong>Email:</strong> ${payload.customerEmail || to || "-"}</div>
          <div><strong>City:</strong> ${payload.city || "-"}</div>
        </div>
        <div style="margin-bottom:15px;">
          <h4 style="margin:0 0 8px;">Trip Details</h4>
          <div><strong>Vehicle:</strong> ${payload.vehicleType || "Car"}</div>
          <div><strong>Driver:</strong> ${payload.driverName || "-"}</div>
          <div><strong>Driver Phone:</strong> ${payload.driverPhone || "-"}</div>
          <div><strong>Pickup:</strong> ${payload.pickup || "-"}</div>
          <div><strong>Drop:</strong> ${payload.drop || "-"}</div>
          <div><strong>Distance:</strong> ${payload.distance || 0} km</div>
          <div><strong>Duration:</strong> ${payload.duration || 0} min</div>
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:14px; margin-bottom:20px;">
          <thead style="background:#d0d8ff;">
            <tr>
              <th style="padding:10px; text-align:left; border:1px solid #e0e0f0;">Description</th>
              <th style="padding:10px; text-align:right; border:1px solid #e0e0f0;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:10px; border:1px solid #e0e0f0;">Local Pickup (₹12/km × ${payload.distance || 0} km)</td>
              <td style="padding:10px; text-align:right; border:1px solid #e0e0f0;">₹${base.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding:10px; border:1px solid #e0e0f0;">GST (5%)</td>
              <td style="padding:10px; text-align:right; border:1px solid #e0e0f0;">₹${gstAmount.toFixed(2)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr style="background:#d0d8ff;">
              <td style="padding:12px; font-weight:bold; border:1px solid #e0e0f0;">Total</td>
              <td style="padding:12px; text-align:right; font-weight:bold; border:1px solid #e0e0f0; color:#302b63;">₹${total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>`;
  } else if (template === "holidayBookingConfirmation") {
    const bookingDetails = data?.bookingDetails || {};
    emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:20px auto; padding:25px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2e7d32;">Holiday Booking Confirmation!</h2>
        <p>Dear ${data?.customerName || "Customer"},</p>
        <p>Your holiday booking has been successfully received and is being processed.</p>
        <h3>Booking Details:</h3>
        <ul>
          <li><strong>Booking ID:</strong> ${bookingDetails.bookingId || data?.bookingId || "N/A"}</li>
          <li><strong>Package Name:</strong> ${bookingDetails.packageName || data?.packageName || "N/A"}</li>
          <li><strong>Travel Date:</strong> ${bookingDetails.travelDate || data?.travelDate || "N/A"}</li>
          <li><strong>Amount Paid/Total:</strong> ₹${bookingDetails.totalAmount || data?.totalAmount || "0"}</li>
          <li><strong>Status:</strong> Confirmed</li>
        </ul>
        <p>We will assign a driver and vehicle for your journey shortly.</p>
        <p>Thank you for choosing Cabroute!</p>
      </div>`;
  } else if (template === "driverAssigned") {
    const bookingDetails = data?.bookingDetails || {};
    emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:20px auto; padding:25px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #1565c0;">Driver Assigned for Your Trip</h2>
        <p>Dear ${data?.customerName || "Customer"},</p>
        <p>A driver has been assigned for your upcoming trip <strong>#${data?.bookingId || bookingDetails.bookingId || "N/A"}</strong>.</p>
        <h3>Driver & Vehicle Details:</h3>
        <ul>
          <li><strong>Driver Name:</strong> ${data?.driverName || "Assigned Driver"}</li>
          <li><strong>Vehicle Details:</strong> ${data?.vehicleDetails || "Assigned Vehicle"}</li>
          <li><strong>Travel Date:</strong> ${bookingDetails.travelDate || "N/A"}</li>
          <li><strong>Pickup Location:</strong> ${bookingDetails.pickupLocation || "N/A"}</li>
        </ul>
        <p>Our driver will contact you shortly before the ride.</p>
        <p>Have a safe journey!</p>
      </div>`;
  }else if (template === "airportInvoice") {

    const total = Number(payload.price || 0).toFixed(2);
    const invoiceNum = `AIR-${payload.bookingId}`;
    const genDate = new Date().toLocaleDateString();

    emailSubject = `Airport Booking Invoice - ${payload.bookingId}`;

    emailHtml = `
    <div style="font-family:Arial,sans-serif;
                max-width:700px;
                margin:auto;
                background:#ffffff;
                border-radius:10px;
                padding:30px;
                border:1px solid #ddd;">

        <h2 style="text-align:center;color:#1565C0;">
            Cabroute Airport Transfer Invoice
        </h2>

        <hr/>

        <p><strong>Invoice No:</strong> ${invoiceNum}</p>
        <p><strong>Booking ID:</strong> ${payload.bookingId}</p>
        <p><strong>Date:</strong> ${genDate}</p>

        <br/>

        <h3>Customer Details</h3>

        <p><strong>Name:</strong> ${payload.customerName}</p>
        <p><strong>Email:</strong> ${payload.customerEmail || to}</p>

        <br/>

        <h3>Trip Details</h3>

        <table style="width:100%;border-collapse:collapse;">

            <tr>
                <td style="padding:8px;"><strong>Vehicle</strong></td>
                <td>${payload.vehicleType}</td>
            </tr>

            <tr>
                <td style="padding:8px;"><strong>Pickup</strong></td>
                <td>${payload.pickup}</td>
            </tr>

            <tr>
                <td style="padding:8px;"><strong>Drop</strong></td>
                <td>${payload.drop}</td>
            </tr>

            <tr>
                <td style="padding:8px;"><strong>Travel Date</strong></td>
                <td>${payload.travelDate}</td>
            </tr>

            <tr>
                <td style="padding:8px;"><strong>Time</strong></td>
                <td>${payload.time}</td>
            </tr>

            <tr>
                <td style="padding:8px;"><strong>Adults</strong></td>
                <td>${payload.adults}</td>
            </tr>

            <tr>
                <td style="padding:8px;"><strong>Children</strong></td>
                <td>${payload.children}</td>
            </tr>

        </table>

        <br/>

        <h2 style="text-align:right;color:#2E7D32;">
            Total : ₹${total}
        </h2>

        <hr/>

        <p style="text-align:center;color:#666;">
            Thank you for choosing Cabroute.
            Have a safe journey.
        </p>

    </div>`;
} else if (template === "holidayInvoice") {
    const total = Number(payload.price || 0).toFixed(2);
    const invoiceNum = `HOL-${payload.bookingId}`;
    const genDate = new Date().toLocaleDateString();
    const itinerary = Array.isArray(payload.itinerary) ? payload.itinerary : [];

    emailSubject = `Holiday Booking Invoice - ${payload.bookingId}`;

    emailHtml = `
    <div style="font-family:Arial,sans-serif;
                max-width:700px;
                margin:auto;
                background:#ffffff;
                border-radius:10px;
                padding:30px;
                border:1px solid #ddd;">

        <h2 style="text-align:center;color:#2E7D32;">
            Cabroute Holiday Booking Invoice
        </h2>

        <hr/>

        <p><strong>Invoice No:</strong> ${invoiceNum}</p>
        <p><strong>Booking ID:</strong> ${payload.bookingId}</p>
        <p><strong>Date:</strong> ${genDate}</p>

        <br/>

        <h3>Customer Details</h3>
        <p><strong>Name:</strong> ${payload.customerName || "-"}</p>
        <p><strong>Email:</strong> ${payload.customerEmail || to}</p>
        <p><strong>Phone:</strong> ${payload.customerPhone || "-"}</p>

        <br/>

        <h3>Holiday Details</h3>
        <table style="width:100%;border-collapse:collapse;">
            <tr>
                <td style="padding:8px;"><strong>Package</strong></td>
                <td>${payload.packageName || "-"}</td>
            </tr>
            <tr>
                <td style="padding:8px;"><strong>State</strong></td>
                <td>${payload.state || "-"}</td>
            </tr>
            <tr>
                <td style="padding:8px;"><strong>Duration</strong></td>
                <td>${payload.duration || "-"}</td>
            </tr>
            <tr>
                <td style="padding:8px;"><strong>Vehicle</strong></td>
                <td>${payload.vehicle || "-"}</td>
            </tr>
            <tr>
                <td style="padding:8px;"><strong>Travel Date</strong></td>
                <td>${payload.travelDate || "-"}</td>
            </tr>
            <tr>
                <td style="padding:8px;"><strong>Guests</strong></td>
                <td>${payload.guests || 1}</td>
            </tr>
            <tr>
                <td style="padding:8px;"><strong>Driver</strong></td>
                <td>${payload.driverName || "-"} ${payload.driverPhone ? `(${payload.driverPhone})` : ""}</td>
            </tr>
        </table>

        ${itinerary.length ? `
          <br/>
          <h3>Itinerary</h3>
          <ul>
            ${itinerary.map((item) => `<li>${typeof item === "string" ? item : item?.title || item?.name || JSON.stringify(item)}</li>`).join("")}
          </ul>
        ` : ""}

        <br/>

        <h2 style="text-align:right;color:#2E7D32;">
            Total : â‚¹${total}
        </h2>

        <hr/>

        <p style="text-align:center;color:#666;">
            Thank you for choosing Cabroute.
            Have a wonderful holiday.
        </p>

    </div>`;
}

  const mailOptions = {
    from: process.env.EMAIL_FROM || "carworkpune@gmail.com",
    to,
    subject: emailSubject,
    ...(emailHtml ? { html: emailHtml } : { text: emailText }),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Email sending failed directly on backend:", error.message);
    throw new Error(`SMTP Email transport failed: ${error.message}`);
  }
};
