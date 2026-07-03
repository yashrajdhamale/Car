const { onRequest } = require("firebase-functions/v2/https");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

// Setup transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "cabworkpune@gmail.com",
    pass: "jprbiffnzihctmbw",
  },
});

// Generate HTML invoice for Holiday
const generateHolidayInvoiceHtml = (invoiceData) => {
  const gstAmount = (invoiceData.price * 5) / 100;
  const total = invoiceData.price + gstAmount;
  return `
<div style="font-family: Arial, sans-serif; max-width:700px; margin:auto; border:1px solid #ddd; padding:20px; border-radius:10px;">
  <div style="text-align:center;">
    <img src="cid:companylogo" style="width:120px; margin-bottom:10px;">
    <h2>Carzy Holidays - Invoice</h2>
    <p>Phone: 9922514719 | Email: cabworkpune@gmail.com</p>
  </div>
  <hr style="margin:20px 0;">
  <p><b>Invoice #:</b> ${invoiceData.invoiceNumber}</p>
  <p><b>Date:</b> ${new Date().toLocaleDateString()}</p>
  <div>
    <h3>Bill To:</h3>
    <p>Name: ${invoiceData.customerName}<br>Email: ${invoiceData.customerEmail}</p>
  </div>
  <div>
    <h3>Trip Details</h3>
    <table style="width:100%; border-collapse:collapse;">
      <tr style="background:#fef3e2;">
        <th style="border:1px solid #ddd; padding:10px;">Vehicle</th>
        <th style="border:1px solid #ddd; padding:10px;">Pickup</th>
        <th style="border:1px solid #ddd; padding:10px;">Destination</th>
      </tr>
      <tr>
        <td style="border:1px solid #ddd; padding:10px;">${invoiceData.car}</td>
        <td style="border:1px solid #ddd; padding:10px;">${invoiceData.pickup}</td>
        <td style="border:1px solid #ddd; padding:10px;">${invoiceData.destination}</td>
      </tr>
    </table>
  </div>
  <div>
    <h3>Payment Summary</h3>
    <table style="width:100%; border-collapse:collapse;">
      <tr>
        <td style="border:1px solid #ddd; padding:10px; text-align:left;">Trip Booking (${invoiceData.car})</td>
        <td style="border:1px solid #ddd; padding:10px; text-align:right;">₹${invoiceData.price.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="border:1px solid #ddd; padding:10px; text-align:left;">GST (5%)</td>
        <td style="border:1px solid #ddd; padding:10px; text-align:right;">₹${gstAmount.toFixed(2)}</td>
      </tr>
      <tr style="background:#fef3e2; font-weight:bold;">
        <td style="border:1px solid #ddd; padding:10px; text-align:left;">Total</td>
        <td style="border:1px solid #ddd; padding:10px; text-align:right;">₹${total.toFixed(2)}</td>
      </tr>
    </table>
  </div>
  <div style="text-align:center; margin-top:30px;">
    <p>Thank you for booking with <b>Carzy-Holidays</b> 🚖</p>
  </div>
</div>`;
};

// Generate PDF invoice
const generatePdfInvoice = (invoiceData, filePath) => {
  return new Promise((resolve, reject) => {
    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    // ... (your PDF content code similar to previous snippets)
    // For brevity, assume the same as previous, omitted here.
    doc.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
};

// Send invoice email handler
exports.sendHolidayInvoice = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method Not Allowed" });
  const { to, customerName, car, pickup, destination, passengerCount, distance, price } = req.body || {};

  if (!to || !car || !price) return res.status(400).json({ error: "Missing params" });

  const invoiceNumber = `INV-${Date.now()}`;
  const invoiceData = {
    invoiceNumber,
    customerName,
    customerEmail: to,
    car,
    pickup,
    destination,
    passengerCount,
    distance,
    price,
  };

  const html = generateHolidayInvoiceHtml(invoiceData);
  const pdfFilePath = "/tmp/" + invoiceNumber + ".pdf";
  await generatePdfInvoice(invoiceData, pdfFilePath);

  await transporter.sendMail({
    from: "cabworkpune@gmail.com",
    to,
    subject: "Your Booking Invoice - Carzy Holidays",
    html,
    attachments: [
      { filename: "logo.png", path: path.join(__dirname, "logo.png"), cid: "companylogo" },
      { filename: `${invoiceNumber}.pdf`, path: pdfFilePath },
    ],
  });

  res.json({ success: true, message: "Invoice sent", invoiceNumber });
});
