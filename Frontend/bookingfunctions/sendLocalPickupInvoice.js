const { onRequest } = require("firebase-functions/v2/https");
const cors = require("cors")({ origin: true });
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

const GST_RATE = 5;

// -------------------------------
// EMAIL TRANSPORTER
// -------------------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "cabworkpune@gmail.com",
    pass: "jprbiffnzihctmbw",
  },
});

// -------------------------------
// HTML INVOICE TEMPLATE FOR LOCAL PICKUP
// -------------------------------
function generateLocalPickupInvoiceHtml(data) {
  const base      = Number((data.distance * 12).toFixed(2));
  const gstAmount = Number(((base * GST_RATE) / 100).toFixed(2));
  const total     = Number((base + gstAmount).toFixed(2));

  const logoHtml = data.includeLogo
    ? `<div style="text-align:center; margin-bottom:15px;">
         <img src="cid:companylogo" alt="Cabroute" style="width:120px;" />
       </div>`
    : "";

  return `
  <div style="font-family: Arial, Helvetica, sans-serif; color:#333; max-width:700px; margin:20px auto; padding:25px; border-radius:10px; background:#f0f4ff;">
    ${logoHtml}
    <h2 style="text-align:center; margin:0 0 20px; color:#302b63;">Cabroute — Local Pickup Invoice</h2>

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
        <div><strong>City:</strong> ${data.city || "-"}</div>
      </div>

      <div style="flex:1; min-width:250px;">
        <h4 style="margin:0 0 8px;">Trip Details</h4>
        <div><strong>Vehicle:</strong> ${data.vehicleType}</div>
        <div><strong>Driver:</strong> ${data.driverName || "-"}</div>
        <div><strong>Driver Phone:</strong> ${data.driverPhone || "-"}</div>
        <div><strong>Pickup:</strong> ${data.pickup}</div>
        <div><strong>Drop:</strong> ${data.drop}</div>
        <div><strong>Distance:</strong> ${data.distance} km</div>
        <div><strong>Duration:</strong> ${data.duration} min</div>
      </div>
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
          <td style="padding:10px; border:1px solid #e0e0f0;">Local Pickup (₹12/km × ${data.distance} km)</td>
          <td style="padding:10px; text-align:right; border:1px solid #e0e0f0;">₹${base.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:10px; border:1px solid #e0e0f0;">GST (${GST_RATE}%)</td>
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

    <div style="background:#eef2ff; padding:15px; border-radius:8px; margin:20px 0; border-left:4px solid #302b63;">
      <strong>Note:</strong>
      <ul style="margin:8px 0 0 20px; padding:0;">
        <li>Fare calculated at ₹12/km flat rate</li>
        <li>GST of 5% is included in the total</li>
        <li>No hidden charges</li>
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
// PDF GENERATOR FOR LOCAL PICKUP
// -------------------------------
function generateLocalPickupPdfInvoice(data, pdfPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc    = new PDFDocument({ size: "A4", margin: 50 });
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // Background
      doc.rect(0, 0, doc.page.width, doc.page.height).fill("#f0f4ff").fillColor("#000");

      // Logo
      const logoPath = path.join(__dirname, "logo.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, doc.page.width / 2 - 60, 30, { width: 120 });
      }
      doc.moveDown(5);

      // Title
      doc.fontSize(18).fillColor("#302b63").font("Helvetica-Bold")
        .text("CabRoute — Local Pickup Invoice", { align: "center" });
      doc.moveDown(2);

      // Invoice Info
      doc.fontSize(10).fillColor("#000").font("Helvetica");
      doc.text(`Invoice No: ${data.invoiceNumber}`);
      doc.text(`Booking ID: ${data.bookingId || "-"}`);
      doc.text(`Date: ${data.generatedDate}`);
      doc.text(`Contact: 9922514719`);
      doc.moveDown(2);

      // Two-column boxes
      const startX   = 50;
      const colWidth = 250;
      let   startY   = doc.y;

      doc.rect(startX, startY, colWidth, 20).fill("#b0beff");
      doc.rect(startX + colWidth + 10, startY, colWidth, 20).fill("#b0beff");

      doc.fillColor("#000").font("Helvetica-Bold").fontSize(11);
      doc.text("Bill To",       startX + 5,              startY + 5);
      doc.text("Trip Details",  startX + colWidth + 15,  startY + 5);

      doc.font("Helvetica").fontSize(10).fillColor("#000");

      const billX  = startX + 5;
      const tripX  = startX + colWidth + 15;
      const boxW   = colWidth - 10;

      let billY = startY + 25;
      let tripY = startY + 25;

      // Bill To
      [
        `Name: ${data.customerName || "-"}`,
        `Email: ${data.customerEmail || "-"}`,
        `City: ${data.city || "-"}`
      ].forEach(line => {
        doc.text(line, billX, billY, { width: boxW });
        billY += doc.heightOfString(line, { width: boxW }) + 3;
      });

      // Trip Details
      [
        `Vehicle: ${data.vehicleType}`,
        `Driver: ${data.driverName || "-"}`,
        `Driver Phone: ${data.driverPhone || "-"}`,
        `Pickup: ${data.pickup}`,
        `Drop: ${data.drop}`,
        `Distance: ${data.distance} km`,
        `Duration: ${data.duration} min`
      ].forEach(line => {
        doc.text(line, tripX, tripY, { width: boxW });
        tripY += doc.heightOfString(line, { width: boxW }) + 3;
      });

      startY = Math.max(billY, tripY) + 20;

      // Fare Table
      const tableX     = 50;
      const tableWidth = doc.page.width - 100;
      const rowHeight  = 25;

      const base      = Number((data.distance * 12).toFixed(2));
      const gstAmount = Number(((base * GST_RATE) / 100).toFixed(2));
      const total     = Number((base + gstAmount).toFixed(2));

      // Header
      doc.rect(tableX, startY, tableWidth, rowHeight).fill("#b0beff");
      doc.fillColor("#000").font("Helvetica-Bold");
      doc.text("Description",  tableX + 5,              startY + 7);
      doc.text("Amount (₹)",   tableX + tableWidth - 100, startY + 7);

      let tableY = startY + rowHeight;

      // Base fare row
      doc.rect(tableX, tableY, tableWidth, rowHeight).stroke("#e0e0e0");
      doc.font("Helvetica");
      doc.text(`Local Pickup (₹12/km × ${data.distance} km)`, tableX + 5, tableY + 7);
      doc.text(`Rs.${base.toFixed(2)}`, tableX + tableWidth - 100, tableY + 7);
      tableY += rowHeight;

      // GST row
      doc.rect(tableX, tableY, tableWidth, rowHeight).stroke("#e0e0e0");
      doc.text(`GST (${GST_RATE}%)`, tableX + 5, tableY + 7);
      doc.text(`Rs.${gstAmount.toFixed(2)}`, tableX + tableWidth - 100, tableY + 7);
      tableY += rowHeight;

      // Total row
      doc.rect(tableX, tableY, tableWidth, rowHeight).fill("#b0beff");
      doc.fillColor("#302b63").font("Helvetica-Bold");
      doc.text("Total", tableX + 5, tableY + 7);
      doc.text(`Rs.${total.toFixed(2)}`, tableX + tableWidth - 100, tableY + 7);

      // Note box
      doc.moveDown(2);
      const noteY = tableY + 50;
      doc.rect(50, noteY, doc.page.width - 100, 70).fill("#eef2ff").stroke("#302b63");
      doc.fillColor("#000").font("Helvetica-Bold").fontSize(10).text("Note:", 55, noteY + 10);
      doc.font("Helvetica").fontSize(9);
      doc.text("• Fare calculated at Rs.12/km flat rate",   60, noteY + 25);
      doc.text("• GST of 5% is included in the total",      60, noteY + 40);
      doc.text("• No hidden charges",                        60, noteY + 55);

      // Footer
      doc.fontSize(10).fillColor("#555").text(
        "Thank you for choosing CabRoute! Drive safe & have a pleasant journey!",
        50, noteY + 90, { align: "center" }
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
// MAIN CLOUD FUNCTION — v2 with cors: true + manual headers
// -------------------------------
exports.sendLocalPickupInvoice = onRequest({ cors: true }, async (req, res) => {
  // Manual CORS headers — belt AND suspenders
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight
  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "POST")    return res.status(405).json({ error: "POST required" });

  try {
    const {
      to, customerName, bookingId, vehicleType,
      pickup, drop, city, distance, duration,
      driverName, driverPhone
    } = req.body || {};

    if (!to)       return res.status(400).json({ error: "Recipient email (to) is required" });
    if (!distance) return res.status(400).json({ error: "distance is required" });

    const parsedDistance = Number(distance);
    if (!Number.isFinite(parsedDistance) || parsedDistance <= 0)
      return res.status(400).json({ error: "distance must be a valid positive number" });

    const invoiceNumber = `LOCAL-INV-${Date.now()}`;
    const generatedDate = new Date().toLocaleDateString("en-IN");

    const invoiceData = {
      invoiceNumber,
      generatedDate,
      bookingId:    bookingId    || "",
      customerName: customerName || "Guest",
      customerEmail: to,
      vehicleType:  vehicleType  || "Car",
      pickup:       pickup       || "-",
      drop:         drop         || "-",
      city:         city         || "Pune",
      distance:     parsedDistance,
      duration:     duration     || 0,
      driverName:   driverName   || "",
      driverPhone:  driverPhone  || "",
      includeLogo:  fs.existsSync(path.join(__dirname, "logo.png")),
    };

    const html    = generateLocalPickupInvoiceHtml(invoiceData);
    const pdfPath = path.join("/tmp", `${invoiceNumber}.pdf`);
    await generateLocalPickupPdfInvoice(invoiceData, pdfPath);

    const attachments = [
      {
        filename:    `${invoiceNumber}.pdf`,
        path:        pdfPath,
        contentType: "application/pdf",
      },
    ];

    if (invoiceData.includeLogo) {
      attachments.push({
        filename: "logo.png",
        path:     path.join(__dirname, "logo.png"),
        cid:      "companylogo",
      });
    }

    await transporter.sendMail({
      from:    "cabworkpune@gmail.com",
      to:      invoiceData.customerEmail,
      subject: `Your Local Pickup Invoice (${invoiceData.invoiceNumber}) - Cabroute`,
      html,
      attachments,
    });

    try { fs.unlinkSync(pdfPath); } catch (e) { /* ignore */ }

    return res.json({ success: true, message: "Invoice sent successfully!" });
  } catch (err) {
    console.error("Error in sendLocalPickupInvoice:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});