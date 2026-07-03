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
// HTML INVOICE TEMPLATE FOR HOLIDAYS
// -------------------------------
function generateHolidayInvoiceHtml(data) {
  const gstAmount = Number(((data.price * GST_RATE) / 100).toFixed(2));
  const total = Number((data.price + gstAmount).toFixed(2));

  const logoHtml = data.includeLogo
    ? `<div style="text-align:center; margin-bottom:15px;">
         <img src="cid:companylogo" alt="Cabroute" style="width:120px;" />
       </div>`
    : "";

  // Build itinerary rows (only shown if itinerary data exists)
  const itinerarySection =
    Array.isArray(data.itinerary) && data.itinerary.length > 0
      ? `
    <h4 style="margin:0 0 8px;">Itinerary</h4>
    <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom:20px;">
      <thead style="background:#ffe0b2;">
        <tr>
          <th style="padding:8px 10px; text-align:left; border:1px solid #f0f0f0; width:60px;">Day</th>
          <th style="padding:8px 10px; text-align:left; border:1px solid #f0f0f0;">Activity</th>
          <th style="padding:8px 10px; text-align:left; border:1px solid #f0f0f0;">Details</th>
        </tr>
      </thead>
      <tbody>
        ${data.itinerary
          .map((item, idx) => {
            const activity =
              typeof item === "object" ? item.day || item.activity || "" : item;
            const details =
              typeof item === "object"
                ? item.details || item.description || ""
                : "";
            const bg = idx % 2 === 0 ? "#fff8f0" : "#ffffff";
            return `
            <tr style="background:${bg};">
              <td style="padding:8px 10px; border:1px solid #f0f0f0; color:#d35400; font-weight:bold;">Day ${idx + 1}</td>
              <td style="padding:8px 10px; border:1px solid #f0f0f0;">${activity}</td>
              <td style="padding:8px 10px; border:1px solid #f0f0f0; color:#555;">${details}</td>
            </tr>`;
          })
          .join("")}
      </tbody>
    </table>`
      : "";

  return `
  <div style="font-family: Arial, Helvetica, sans-serif; color:#333; max-width:700px; margin:20px auto; padding:25px; border-radius:10px; background:#fff4e6;">
    ${logoHtml}
    <h2 style="text-align:center; margin:0 0 20px; color:#d35400;">Cabroute — Holiday Package Invoice</h2>

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
        <div><strong>Phone:</strong> ${data.customerPhone || "-"}</div>
        <div><strong>Guests:</strong> ${data.guests || 1} Person(s)</div>
      </div>

      <div style="flex:1; min-width:250px;">
        <h4 style="margin:0 0 8px;">Package Details</h4>
        <div><strong>Package:</strong> ${data.packageName || "-"}</div>
        <div><strong>Duration:</strong> ${data.duration || "-"}</div>
        <div><strong>Vehicle:</strong> ${data.vehicle || "-"}</div>
        <div><strong>Travel Date:</strong> ${data.travelDate || "-"}</div>
        <div><strong>State / Destination:</strong> ${data.state || "-"}</div>
      </div>
    </div>

    ${itinerarySection}

    <table style="width:100%; border-collapse:collapse; font-size:14px; margin-bottom:20px;">
      <thead style="background:#ffe0b2;">
        <tr>
          <th style="padding:10px; text-align:left; border:1px solid #f0f0f0;">Description</th>
          <th style="padding:10px; text-align:right; border:1px solid #f0f0f0;">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:10px; border:1px solid #f0f0f0;">Holiday Package — ${data.packageName || "-"} (${data.vehicle || "-"})</td>
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
        <li>Driver allowances as per itinerary are included</li>
        <li>Road tolls, parking fees, and state taxes are included</li>
        <li>Entry tickets to attractions are not included</li>
        <li>Guest food and accommodation are not included</li>
      </ul>
    </div>

    <p style="text-align:center; font-size:13px; color:#555; line-height:1.5;">
      Thank you for choosing <strong>Cabroute</strong> for your holiday! 🌴<br/>
      Have a wonderful trip!
    </p>
  </div>
  `;
}

// -------------------------------
// PDF GENERATOR FOR HOLIDAYS
// -------------------------------
function generateHolidayPdfInvoice(data, pdfPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // Background color — same warm cream as outstation
      doc.rect(0, 0, doc.page.width, doc.page.height).fill("#fff8f0").fillColor("#000");

      // Logo (centered)
      const logoPath = path.join(__dirname, "logo.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, doc.page.width / 2 - 60, 30, { width: 120 });
      }

      doc.moveDown(5);

      // Title
      doc.fontSize(18).fillColor("#d35400").font("Helvetica-Bold")
        .text("CabRoute — Holiday Package Invoice", { align: "center" });

      doc.moveDown(2);

      // Invoice Info
      doc.fontSize(10).fillColor("#000").font("Helvetica");
      doc.text(`Invoice No: ${data.invoiceNumber}`);
      doc.text(`Booking ID: ${data.bookingId || "-"}`);
      doc.text(`Date: ${data.generatedDate}`);
      doc.text(`Contact: 9922514719`);

      doc.moveDown(2);

      // ---- Bill To / Package Details — identical 2-column layout to outstation ----
      const startX = 50;
      const colWidth = 250;
      let startY = doc.y;

      // Header background
      doc.rect(startX, startY, colWidth, 20).fill("#f4c289");
      doc.rect(startX + colWidth + 10, startY, colWidth, 20).fill("#f4c289");

      doc.fillColor("#000").font("Helvetica-Bold").fontSize(11);
      doc.text("Bill To", startX + 5, startY + 5);
      doc.text("Package Details", startX + colWidth + 15, startY + 5);

      doc.font("Helvetica").fontSize(10).fillColor("#000");

      const billX = startX + 5;
      const pkgX = startX + colWidth + 15;
      const boxWidth = colWidth - 10;

      let billY = startY + 25;
      let pkgY = startY + 25;

      // Bill To content
      const billLines = [
        `Name: ${data.customerName || "-"}`,
        `Email: ${data.customerEmail || "-"}`,
        `Phone: ${data.customerPhone || "-"}`,
        `Guests: ${data.guests || 1} Person(s)`,
      ];
      billLines.forEach((line) => {
        doc.text(line, billX, billY, { width: boxWidth });
        billY += doc.heightOfString(line, { width: boxWidth }) + 3;
      });

      // Package Details content (mirrors outstation's "Trip Details" style)
      doc.fillColor("#d35400").font("Helvetica-Bold")
        .text("Package: ", pkgX, pkgY, { continued: false });
      doc.fillColor("#000").font("Helvetica")
        .text(data.packageName || "-", pkgX + 58, pkgY, { width: boxWidth - 58 });
      pkgY += doc.heightOfString(data.packageName || "-", { width: boxWidth - 58 }) + 5;

      doc.fillColor("#d35400").font("Helvetica-Bold")
        .text("Duration: ", pkgX, pkgY, { continued: false });
      doc.fillColor("#000").font("Helvetica")
        .text(data.duration || "-", pkgX + 58, pkgY, { width: boxWidth - 58 });
      pkgY += 15;

      doc.fillColor("#000").font("Helvetica").text(`Vehicle: ${data.vehicle || "-"}`, pkgX, pkgY);
      pkgY += 15;
      doc.text(`Travel Date: ${data.travelDate || "-"}`, pkgX, pkgY);
      pkgY += 15;
      doc.text(`State: ${data.state || "-"}`, pkgX, pkgY);

      startY = Math.max(billY, pkgY) + 20;

      // ---- ITINERARY TABLE (only if data provided) ----
      const itinerary = Array.isArray(data.itinerary) ? data.itinerary : [];
      if (itinerary.length > 0) {
        if (startY > doc.page.height - 150) {
          doc.addPage();
          doc.rect(0, 0, doc.page.width, doc.page.height).fill("#fff8f0").fillColor("#000");
          startY = 50;
        }

        const tblX = 50;
        const tblW = doc.page.width - 100;
        const hdrH = 22;

        // Itinerary table header
        doc.rect(tblX, startY, tblW, hdrH).fill("#f4c289");
        doc.fillColor("#000").font("Helvetica-Bold").fontSize(10);
        doc.text("Day", tblX + 5, startY + 6, { width: 55 });
        doc.text("Activity", tblX + 65, startY + 6, { width: 160 });
        doc.text("Details", tblX + 235, startY + 6, { width: tblW - 240 });
        startY += hdrH;

        itinerary.forEach((item, idx) => {
          const activity =
            typeof item === "object" ? item.day || item.activity || "" : item;
          const details =
            typeof item === "object"
              ? item.details || item.description || ""
              : "";

          // Dynamic row height for wrapped detail text
          const detailH = Math.max(
            22,
            doc.heightOfString(details, { width: tblW - 240 }) + 10
          );

          // Page break if needed
          if (startY + detailH > doc.page.height - 60) {
            doc.addPage();
            doc.rect(0, 0, doc.page.width, doc.page.height).fill("#fff8f0").fillColor("#000");
            startY = 50;
          }

          const rowBg = idx % 2 === 0 ? "#fff8f0" : "#ffffff";
          doc.rect(tblX, startY, tblW, detailH).fill(rowBg).stroke("#e0e0e0");

          doc.fillColor("#d35400").font("Helvetica-Bold").fontSize(9)
            .text(`Day ${idx + 1}`, tblX + 5, startY + 6, { width: 55 });
          doc.fillColor("#000").font("Helvetica").fontSize(9)
            .text(activity, tblX + 65, startY + 6, { width: 160 });
          doc.fillColor("#555").font("Helvetica").fontSize(8)
            .text(details, tblX + 235, startY + 6, { width: tblW - 240 });

          startY += detailH;
        });

        startY += 15;
      }

      // ---- FARE TABLE — identical structure to outstation ----
      if (startY > doc.page.height - 180) {
        doc.addPage();
        doc.rect(0, 0, doc.page.width, doc.page.height).fill("#fff8f0").fillColor("#000");
        startY = 50;
      }

      const tableX = 50;
      const tableWidth = doc.page.width - 100;
      const rowHeight = 25;

      // Table Header
      doc.rect(tableX, startY, tableWidth, rowHeight).fill("#f4c289");
      doc.fillColor("#000").font("Helvetica-Bold").fontSize(10);
      doc.text("Description", tableX + 5, startY + 7);
      doc.text("Amount (₹)", tableX + tableWidth - 100, startY + 7);

      let tableY = startY + rowHeight;

      // Package Row
      doc.rect(tableX, tableY, tableWidth, rowHeight).stroke("#e0e0e0");
      doc.fillColor("#000").font("Helvetica").fontSize(9)
        .text(
          `Holiday Package — ${data.packageName || "-"} (${data.vehicle || "-"})`,
          tableX + 5,
          tableY + 7,
          { width: tableWidth - 120 }
        );
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
      doc.fillColor("#d35400").font("Helvetica-Bold").fontSize(10);
      doc.text("Total", tableX + 5, tableY + 7);
      doc.text(`₹${total.toFixed(2)}`, tableX + tableWidth - 100, tableY + 7);

      // Note Box — identical style to outstation
      const noteY = tableY + 50;
      if (noteY + 90 > doc.page.height - 30) {
        doc.addPage();
        doc.rect(0, 0, doc.page.width, doc.page.height).fill("#fff8f0").fillColor("#000");
      }
      const actualNoteY = noteY > doc.page.height - 120 ? 50 : noteY;

      doc.rect(50, actualNoteY, doc.page.width - 100, 80).fill("#fff8e1").stroke("#ff9800");
      doc.fillColor("#000").font("Helvetica-Bold").fontSize(10)
        .text("Note:", 55, actualNoteY + 10);
      doc.font("Helvetica").fontSize(9);
      doc.text("• Driver allowances as per itinerary are included", 60, actualNoteY + 25);
      doc.text("• Road tolls, parking fees, and state taxes are included", 60, actualNoteY + 40);
      doc.text("• Entry tickets to attractions are not included", 60, actualNoteY + 55);
      doc.text("• Guest food and accommodation are not included", 60, actualNoteY + 70);

      // Footer — same as outstation
      doc.fontSize(10).fillColor("#555").text(
        "Thank you for choosing CabRoute! Have a wonderful holiday! 🌴",
        50,
        actualNoteY + 100,
        { align: "center" }
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
exports.sendHolidayInvoice = functions.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).json({ error: "POST required" });

    try {
      const {
        to,
        customerName,
        customerPhone,
        bookingId,
        packageName,
        duration,
        vehicle,
        travelDate,
        guests,
        price,
        state,
        itinerary,   // optional: [{day:"Arrival in Munnar", details:"Check-in & rest"}, ...]
      } = req.body || {};

      if (!to) return res.status(400).json({ error: "Recipient email (to) is required" });
      if (!packageName) return res.status(400).json({ error: "packageName is required" });

      const parsedPrice = Number(price);
      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ error: "price must be a valid non-negative number" });
      }

      const invoiceNumber = `HOL-INV-${Date.now()}`;
      const generatedDate = new Date().toLocaleDateString();

      const invoiceData = {
        invoiceNumber,
        generatedDate,
        bookingId: bookingId || "",
        customerName: customerName || "Guest",
        customerEmail: to,
        customerPhone: customerPhone || "",
        packageName,
        duration: duration || "-",
        vehicle: vehicle || "-",
        travelDate: travelDate || "-",
        guests: guests || 1,
        price: parsedPrice,
        state: state || "-",
        itinerary: Array.isArray(itinerary) ? itinerary : [],
        includeLogo: fs.existsSync(path.join(__dirname, "logo.png")),
      };

      // Generate HTML & PDF
      const html = generateHolidayInvoiceHtml(invoiceData);
      const pdfPath = path.join("/tmp", `${invoiceNumber}.pdf`);
      await generateHolidayPdfInvoice(invoiceData, pdfPath);

      // Attachments
      const attachments = [
        {
          filename: `Holiday_Invoice_${invoiceNumber}.pdf`,
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
        subject: `Your Holiday Package Invoice (${invoiceData.invoiceNumber}) — ${packageName} | Cabroute`,
        html,
        attachments,
      });

      // Cleanup temp PDF
      try { fs.unlinkSync(pdfPath); } catch (e) { /* ignore */ }

      // Send driver details email 5 seconds later (same pattern as outstation)
      if (bookingId) {
        setTimeout(async () => {
          try {
            const bookingRef = db.collection("holidayBookings").doc(bookingId);
            const snap = await bookingRef.get();

            if (snap.exists) {
              const bookingData = snap.data();
              const driverName =
                bookingData.driverName || bookingData.driverInfo?.name;
              const driverPhone =
                bookingData.driverPhone || bookingData.driverInfo?.phone;
              const driverVehicle =
                bookingData.driverInfo?.vehicle || vehicle;

              if (driverName || driverPhone) {
                await transporter.sendMail({
                  from: "cabworkpune@gmail.com",
                  to: to,
                  subject: `Your Driver Details for ${packageName} — Cabroute`,
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; padding:20px;">
                      <h2 style="color:#d35400;">Your Driver Details 🌴</h2>
                      <p>Dear ${customerName || "Customer"},</p>
                      <p>A driver has been assigned for your <strong>${packageName}</strong> holiday package.</p>

                      <div style="background:#fff4e6; padding:20px; border-radius:8px; margin:20px 0;">
                        <h3 style="color:#333; margin-top:0;">Driver Information:</h3>
                        <p><strong>Driver Name:</strong> ${driverName || "N/A"}</p>
                        <p><strong>Contact Number:</strong> <a href="tel:${driverPhone}" style="color:#d35400;">${driverPhone || "N/A"}</a></p>
                        <p><strong>Vehicle:</strong> ${driverVehicle || "N/A"}</p>
                      </div>

                      <div style="background:#fff8e1; padding:15px; border-radius:8px; border-left:4px solid #ff9800;">
                        <p style="margin:4px 0;"><strong>Travel Date:</strong> ${travelDate || "-"}</p>
                        <p style="margin:4px 0;"><strong>Package:</strong> ${packageName}</p>
                        <p style="margin:4px 0;"><strong>Guests:</strong> ${guests || 1}</p>
                      </div>

                      <p style="margin-top:20px;">Your driver will contact you before the travel date. Please be ready at your pickup location.</p>

                      <div style="margin-top:30px; padding-top:20px; border-top:1px solid #eee;">
                        <p style="font-size:12px; color:#666;">Thank you for choosing Cabroute! Have a wonderful holiday! 🌴</p>
                      </div>
                    </div>
                  `,
                });
                console.log("✅ Driver details email sent:", bookingId);
              }
            }
          } catch (error) {
            console.error("Error sending driver details email:", error);
          }
        }, 5000);
      }

      return res.json({
        success: true,
        message: "Holiday invoice sent successfully!",
        invoiceNumber,
      });
    } catch (err) {
      console.error("Error in sendHolidayInvoice:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
});