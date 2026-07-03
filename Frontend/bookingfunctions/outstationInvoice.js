const functions = require("firebase-functions/v2/https");
const cors = require("cors")({ origin: true });
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const admin = require("firebase-admin");

const GST_RATE = 5;

// Initialize firebase-admin once
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// -------------------------------
// EMAIL TRANSPORTER
// -------------------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "cabworkpune@gmail.com",
    pass: "jprbiffnzihctmbw", // use env var in production
  },
});

// -------------------------------
// HTML INVOICE TEMPLATE FOR OUTSTATION
// -------------------------------
function generateOutstationInvoiceHtml(data) {
  const gstAmount = Number(((data.price * GST_RATE) / 100).toFixed(2));
  const total = Number((data.price + gstAmount).toFixed(2));
  
  const tripDuration = data.days > 1 ? `${data.days} Days` : "1 Day";

  const logoHtml = data.includeLogo
    ? `<div style="text-align:center; margin-bottom:15px;">
         <img src="cid:companylogo" alt="Cabroute" style="width:120px;" />
       </div>`
    : "";

  return `
  <div style="font-family: Arial, Helvetica, sans-serif; color:#333; max-width:700px; margin:20px auto; padding:25px; border-radius:10px; background:#fff4e6;">
    ${logoHtml}
    <h2 style="text-align:center; margin:0 0 20px; color:#d35400;">Cabroute — Outstation Trip Invoice</h2>

    <div style="margin-bottom:15px;">
      <strong>Invoice No:</strong> ${data.invoiceNumber}<br/>
      <strong>Booking ID:</strong> ${data.bookingId || "-"}<br/>
      <strong>Date:</strong> ${data.generatedDate}<br/>
      <strong>Contact:</strong> 9922514719
    </div>

    <div style="margin-bottom:15px; display:flex; gap:40px; flex-wrap:wrap;">
      <div style="flex:1; min-width:250px;">
        <h4 style="margin:0 0 8px;">Bill To</h4>
        <div><strong>Name:</strong> ${data.customerName || "-"}</div>
        <div><strong>Email:</strong> ${data.customerEmail || "-"}</div>
        <div><strong>Passengers:</strong> ${data.passengerCount || 1} Person(s)</div>
        <div><strong>Trip Duration:</strong> ${tripDuration}</div>
      </div>

      <div style="flex:1; min-width:250px;">
        <h4 style="margin:0 0 8px;">Trip Details</h4>
        <div><strong>Vehicle:</strong> ${data.vehicleType}</div>
        <div><strong>Pickup:</strong> ${data.pickup}</div>
        <div><strong>Destination:</strong> ${data.destination}</div>
        <div><strong>Distance:</strong> ${data.distance ? data.distance + " km" : "-"}</div>
        <div><strong>Trip Date:</strong> ${data.travelDate || "-"}</div>
        <div><strong>Time:</strong> ${data.time || "-"}</div>
      </div>
    </div>

    <table style="width:100%; border-collapse:collapse; font-size:14px; margin-bottom:20px;">
      <thead style="background:#ffe0b2;">
        <tr>
          <th style="padding:10px; text-align:left; border:1px solid #f0f0f0;">Description</th>
          <th style="padding:10px; text-align:right; border:1px solid #f0f0f0;">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:10px; border:1px solid #f0f0f0;">Outstation Trip (${data.vehicleType})</td>
          <td style="padding:10px; text-align:right; border:1px solid #f0f0f0;">${data.price.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:10px; border:1px solid #f0f0f0;">GST (${GST_RATE}%)</td>
          <td style="padding:10px; text-align:right; border:1px solid #f0f0f0;">${gstAmount.toFixed(2)}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr style="background:#ffe0b2;">
          <td style="padding:12px; font-weight:bold; border:1px solid #f0f0f0;">Total</td>
          <td style="padding:12px; text-align:right; font-weight:bold; border:1px solid #f0f0f0; color:#d35400;">${total.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>

    <div style="background:#fff8e1; padding:15px; border-radius:8px; margin:20px 0; border-left:4px solid #ff9800;">
      <strong>Note:</strong> 
      <ul style="margin:8px 0 0 20px; padding:0;">
        <li>This fare is for round trip including driver charges, fuel, and tolls</li>
        <li>Driver's food and accommodation for multi-day trips are included</li>
        <li>Maximum ${data.vehicleCapacity || 4} passengers allowed as per vehicle capacity</li>
      </ul>
    </div>

    <p style="text-align:center; font-size:13px; color:#555; line-height:1.5;">
      Thank you for choosing <strong>Cabroute</strong>!<br/>
      Drive safe & have a pleasant journey!
    </p>
  </div>
  `;
}

// -------------------------------
// PDF GENERATOR FOR OUTSTATION
// -------------------------------
function generateOutstationPdfInvoice(data, pdfPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // Background color
      doc.rect(0, 0, doc.page.width, doc.page.height).fill("#fff8f0").fillColor("#000");

      // Logo (centered)
      const logoPath = path.join(__dirname, "logo.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, doc.page.width / 2 - 60, 30, { width: 120 });
      }

      doc.moveDown(5);

      // Title
      doc.fontSize(18).fillColor("#d35400").font("Helvetica-Bold")
        .text("CabRoute — Outstation Trip Invoice", { align: "center" });

      doc.moveDown(2);

      // Invoice Info
      doc.fontSize(10).fillColor("#000").font("Helvetica");
      doc.text(`Invoice No: ${data.invoiceNumber}`);
      doc.text(`Booking ID: ${data.bookingId || "-"}`);
      doc.text(`Date: ${data.generatedDate}`);
      doc.text(`Contact: 9922514719`);

      doc.moveDown(2);

      // Bill To / Trip Details Boxes
      const startX = 50;
      const colWidth = 250;
      let startY = doc.y;

      // Header background
      doc.rect(startX, startY, colWidth, 20).fill("#f4c289");
      doc.rect(startX + colWidth + 10, startY, colWidth, 20).fill("#f4c289");

      doc.fillColor("#000").font("Helvetica-Bold").fontSize(11);
      doc.text("Bill To", startX + 5, startY + 5);
      doc.text("Trip Details", startX + colWidth + 15, startY + 5);

      doc.font("Helvetica").fontSize(10).fillColor("#000");

      const billX = startX + 5;
      const tripX = startX + colWidth + 15;
      const boxWidth = colWidth - 10;

      let billY = startY + 25;
      let tripY = startY + 25;

      // Bill To content
      const tripDuration = data.days > 1 ? `${data.days} Days` : "1 Day";
      const billLines = [
        `Name: ${data.customerName || "-"}`,
        `Email: ${data.customerEmail || "-"}`,
        `Passengers: ${data.passengerCount || 1} Person(s)`,
        `Duration: ${tripDuration}`
      ];
      billLines.forEach(line => {
        doc.text(line, billX, billY, { width: boxWidth });
        billY += doc.heightOfString(line, { width: boxWidth }) + 3;
      });

      // Trip Details content
      let currentY = tripY;

      // Pickup
      doc.fillColor("#d35400").font("Helvetica-Bold").text("Pickup: ", tripX, currentY, { continued: false });
      doc.fillColor("#000").font("Helvetica").text(data.pickup, tripX + 50, currentY, { width: boxWidth - 50 });
      currentY += doc.heightOfString(data.pickup, { width: boxWidth - 50 }) + 5;

      // Destination
      doc.fillColor("#d35400").font("Helvetica-Bold").text("Destination: ", tripX, currentY, { continued: false });
      doc.fillColor("#000").font("Helvetica").text(data.destination, tripX + 50, currentY, { width: boxWidth - 50 });
      currentY += doc.heightOfString(data.destination, { width: boxWidth - 50 }) + 5;

      // Distance
      doc.fillColor("#000").font("Helvetica").text(`Distance: ${data.distance || "0"} km`, tripX, currentY);
      currentY += 15;

      // Vehicle
      doc.text(`Vehicle: ${data.vehicleType}`, tripX, currentY);
      currentY += 15;

      // Date & Time
      doc.text(`Date: ${data.travelDate || "-"}`, tripX, currentY);
      currentY += 15;
      doc.text(`Time: ${data.time || "-"}`, tripX, currentY);

      // Move startY below the taller of Bill To or Trip Details content
      startY = Math.max(billY, currentY) + 20;

      // Fare Table
      const tableX = 50;
      const tableWidth = doc.page.width - 100;
      const rowHeight = 25;

      // Table Header
      doc.rect(tableX, startY, tableWidth, rowHeight).fill("#f4c289");
      doc.fillColor("#000").font("Helvetica-Bold").text("Description", tableX + 5, startY + 7);
      doc.text("Amount (₹)", tableX + tableWidth - 100, startY + 7);

      let tableY = startY + rowHeight;

      // Trip Booking Row
      doc.rect(tableX, tableY, tableWidth, rowHeight).stroke("#e0e0e0");
      doc.font("Helvetica").text(`Outstation Trip (${data.vehicleType})`, tableX + 5, tableY + 7);
      doc.text(`₹${data.price.toFixed(2)}`, tableX + tableWidth - 100, tableY + 7);

      tableY += rowHeight;

      // GST Row
      const gstAmount = Number(((data.price * GST_RATE) / 100).toFixed(2));
      doc.rect(tableX, tableY, tableWidth, rowHeight).stroke("#e0e0e0");
      doc.text(`GST (${GST_RATE}%)`, tableX + 5, tableY + 7);
      doc.text(`₹${gstAmount.toFixed(2)}`, tableX + tableWidth - 100, tableY + 7);

      tableY += rowHeight;

      // Total Row
      const total = Number((data.price + gstAmount).toFixed(2));
      doc.rect(tableX, tableY, tableWidth, rowHeight).fill("#ffe0b2");
      doc.fillColor("#d35400").font("Helvetica-Bold").text("Total", tableX + 5, tableY + 7);
      doc.text(`₹${total.toFixed(2)}`, tableX + tableWidth - 100, tableY + 7);

      // Note Box
      doc.moveDown(2);
      const noteY = tableY + 50;
      doc.rect(50, noteY, doc.page.width - 100, 80).fill("#fff8e1").stroke("#ff9800");
      doc.fillColor("#000").font("Helvetica-Bold").fontSize(10).text("Note:", 55, noteY + 10);
      doc.font("Helvetica").fontSize(9);
      doc.text("• This fare is for round trip including driver charges, fuel, and tolls", 60, noteY + 25);
      doc.text("• Driver's food and accommodation for multi-day trips are included", 60, noteY + 40);
      doc.text(`• Maximum ${data.vehicleCapacity || 4} passengers allowed as per vehicle capacity`, 60, noteY + 55);

      // Footer
      doc.fontSize(10).fillColor("#555").text(
        "Thank you for choosing CabRoute! Drive safe & have a pleasant journey!",
        50, noteY + 100, { align: "center" }
      );

      doc.end();
      stream.on("finish", () => resolve());
      stream.on("error", reject);

    } catch (err) {
      reject(err);
    }
  });
}

// -------------------------------
// MAIN CLOUD FUNCTION with CORS
// -------------------------------
exports.sendOutstationInvoice = functions.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).json({ error: "POST required" });

    try {
      const {
        to, customerName, bookingId, vehicleType, vehicleCapacity,
        pickup, destination, travelDate, time, passengerCount,
        days, distance, price
      } = req.body || {};

      if (!to) return res.status(400).json({ error: "Recipient email (to) is required" });
      if (!vehicleType) return res.status(400).json({ error: "vehicleType is required" });

      // Ensure numeric price
      const parsedPrice = Number(price);
      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ error: "price must be a valid non-negative number" });
      }

      const invoiceNumber = `OUTST-INV-${Date.now()}`;
      const generatedDate = new Date().toLocaleDateString();

      const invoiceData = {
        invoiceNumber,
        generatedDate,
        bookingId: bookingId || "",
        customerName: customerName || "Guest",
        customerEmail: to,
        vehicleType,
        vehicleCapacity: vehicleCapacity || 4,
        pickup: pickup || "-",
        destination: destination || "-",
        travelDate: travelDate || "",
        time: time || "",
        passengerCount: passengerCount || 1,
        days: days || 1,
        distance: distance || 0,
        price: parsedPrice,
        includeLogo: fs.existsSync(path.join(__dirname, "logo.png")),
      };

      // Create HTML & PDF
      const html = generateOutstationInvoiceHtml(invoiceData);
      const pdfPath = path.join("/tmp", `${invoiceNumber}.pdf`);
      await generateOutstationPdfInvoice(invoiceData, pdfPath);

      // Prepare attachments (logo inline if exists)
      const attachments = [
        {
          filename: `${invoiceNumber}.pdf`,
          path: pdfPath,
          contentType: "application/pdf",
        },
      ];

      if (invoiceData.includeLogo) {
        attachments.push({
          filename: "logo.png",
          path: path.join(__dirname, "logo.png"),
          cid: "companylogo",
        });
      }

      // Send Invoice Email
      await transporter.sendMail({
        from: "cabworkpune@gmail.com",
        to: invoiceData.customerEmail,
        subject: `Your Outstation Trip Invoice (${invoiceData.invoiceNumber}) - Cabroute`,
        html,
        attachments,
      });

      // cleanup temp pdf
      try { fs.unlinkSync(pdfPath); } catch (e) { /* ignore unlink errors */ }

      // Send driver details email 5 seconds later if bookingId exists
      if (bookingId) {
        setTimeout(async () => {
          try {
            // Try to find booking in different collections
            const collections = ["bookings", "holidayBookings"];
            let driverDetails = null;

            for (const collectionName of collections) {
              const bookingRef = db.collection(collectionName).doc(bookingId);
              const snap = await bookingRef.get();
              
              if (snap.exists) {
                const data = snap.data();
                if (data.driverName || data.driverInfo) {
                  driverDetails = {
                    name: data.driverName || data.driverInfo?.name || "Driver",
                    phone: data.driverPhone || data.driverInfo?.phone || "",
                    vehicle: data.vehicleType || data.vehicle?.type || data.car?.name || vehicleType
                  };
                  break;
                }
              }
            }

            if (driverDetails) {
              await transporter.sendMail({
                from: "cabworkpune@gmail.com",
                to: to,
                subject: "Your Driver Details - Cabroute",
                html: `
                  <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; padding:20px;">
                    <h2 style="color:#d35400;">Your Driver Details</h2>
                    <p>Dear ${customerName || "Customer"},</p>
                    
                    <div style="background:#fff4e6; padding:20px; border-radius:8px; margin:20px 0;">
                      <h3 style="color:#333; margin-top:0;">Driver Information:</h3>
                      <p><strong>Driver Name:</strong> ${driverDetails.name}</p>
                      <p><strong>Contact Number:</strong> <a href="tel:${driverDetails.phone}">${driverDetails.phone}</a></p>
                      <p><strong>Vehicle:</strong> ${driverDetails.vehicle}</p>
                    </div>
                    
                    <p>Your driver will contact you soon. Please be ready at your pickup location.</p>
                    
                    <div style="margin-top:30px; padding-top:20px; border-top:1px solid #eee;">
                      <p style="font-size:12px; color:#666;">Thank you for choosing Cabroute!</p>
                    </div>
                  </div>
                `,
              });
            }
          } catch (error) {
            console.error("Error sending driver details email:", error);
          }
        }, 5000);
      }

      return res.json({ success: true, message: "Invoice sent successfully!" });
    } catch (err) {
      console.error("Error in sendOutstationInvoice:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
});