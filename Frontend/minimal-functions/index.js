
// const { onRequest } = require("firebase-functions/v2/https");
// const { onInit } = require("firebase-functions/v2/core");
// const { defineString } = require("firebase-functions/params");


// // Extra libraries
// const cors = require("cors")({ origin: true });
// const nodemailer = require("nodemailer");
// const chromium = require("chrome-aws-lambda");
// const path = require("path");

// // Define environment parameters
// const gmailEmail = defineString("GMAIL_EMAIL");
// const gmailPassword = defineString("GMAIL_PASSWORD");

// let transporter;

// // Initialize transporter with secrets after cold start
// onInit(async () => {
//   const email = gmailEmail.value();
//   const password = gmailPassword.value();

//   transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: { user: email, pass: password },
//   });

//   console.log("✅ Nodemailer transporter initialized");
// });

// // Generate invoice HTML template
// const generateInvoiceHtml = (invoiceData) => {
//   return `
//   <div style="font-family: Arial, sans-serif; max-width:700px; margin:auto; border:1px solid #ddd; padding:20px; border-radius:10px;">
//     <div style="text-align:center; margin-bottom:20px;">
//       <img src="cid:companylogo" alt="Carzy Holidays Logo" style="width:120px; margin-bottom:10px;" />
//       <h1 style="color:#ff6600; margin:0;">Carzy-Holidays</h1>
//       <p style="margin:5px 0; color:#555;">Phone: <b>9922514719</b> | Email: <b>cabworkpune@gmail.com</b></p>
//     </div>
//     <hr style="margin:20px 0;" />
//     <div style="margin-bottom:20px;">
//       <p><b>Invoice #:</b> ${invoiceData.invoiceNumber}</p>
//       <p><b>Issue Date:</b> ${new Date().toLocaleDateString()}</p>
//     </div>
//     <div style="margin-bottom:20px;">
//       <h3>Bill To:</h3>
//       <p>
//         <b>Name:</b> ${invoiceData.customerName}<br/>
//         <b>Email:</b> ${invoiceData.customerEmail}
//       </p>
//     </div>
//     <div style="margin-bottom:20px;">
//       <h3>Trip Details</h3>
//       <table style="width:100%; border-collapse:collapse;">
//         <tr><td style="padding:6px; border:1px solid #ddd;"><b>Vehicle</b></td><td style="padding:6px; border:1px solid #ddd;">${invoiceData.car}</td></tr>
//         <tr><td style="padding:6px; border:1px solid #ddd;"><b>Pickup</b></td><td style="padding:6px; border:1px solid #ddd;">${invoiceData.pickup}</td></tr>
//         <tr><td style="padding:6px; border:1px solid #ddd;"><b>Destination</b></td><td style="padding:6px; border:1px solid #ddd;">${invoiceData.destination}</td></tr>
//         <tr><td style="padding:6px; border:1px solid #ddd;"><b>Passengers</b></td><td style="padding:6px; border:1px solid #ddd;">${invoiceData.passengerCount}</td></tr>
//         <tr><td style="padding:6px; border:1px solid #ddd;"><b>Days</b></td><td style="padding:6px; border:1px solid #ddd;">${invoiceData.days}</td></tr>
//         <tr><td style="padding:6px; border:1px solid #ddd;"><b>Distance</b></td><td style="padding:6px; border:1px solid #ddd;">${invoiceData.distance} km</td></tr>
//       </table>
//     </div>
//     <div style="margin-bottom:20px;">
//       <h3>Driver Details</h3>
//       <table style="width:100%; border-collapse:collapse; margin-bottom: 20px;">
//         <tr><td style="padding:6px; border:1px solid #ddd;"><b>Name</b></td><td style="padding:6px; border:1px solid #ddd;">${invoiceData.driverName || "N/A"}</td></tr>
//         <tr><td style="padding:6px; border:1px solid #ddd;"><b>Phone</b></td><td style="padding:6px; border:1px solid #ddd;">${invoiceData.driverPhone || "N/A"}</td></tr>
//         <tr><td style="padding:6px; border:1px solid #ddd;"><b>Vehicle</b></td><td style="padding:6px; border:1px solid #ddd;">${invoiceData.driverVehicle || "N/A"}</td></tr>
//       </table>
//     </div>
//     <div style="margin-bottom:20px;">
//       <h3>Payment Summary</h3>
//       <table style="width:100%; border-collapse:collapse;">
//         <tr style="background:#f2f2f2;">
//           <th style="padding:8px; border:1px solid #ddd;">Service</th>
//           <th style="padding:8px; border:1px solid #ddd;">Amount</th>
//         </tr>
//         <tr>
//           <td style="padding:8px; border:1px solid #ddd;">Trip Booking (${invoiceData.car})</td>
//           <td style="padding:8px; border:1px solid #ddd;">₹${invoiceData.price}</td>
//         </tr>
//         <tr>
//           <td style="padding:8px; border:1px solid #ddd; text-align:right;"><b>Total</b></td>
//           <td style="padding:8px; border:1px solid #ddd;"><b>₹${invoiceData.price}</b></td>
//         </tr>
//       </table>
//     </div>
//     <div style="text-align:center; margin-top:30px; color:#555;">
//       <p>Thank you for booking with <b>Carzy-Holidays</b> 🚖</p>
//     </div>
//   </div>
//   `;
// };

// // Generate PDF buffer using Puppeteer (chromium)
// const generatePdfBuffer = async (invoiceData) => {
//   const browser = await chromium.puppeteer.launch({
//     args: chromium.args,
//     executablePath: await chromium.executablePath,
//     headless: chromium.headless,
//   });

//   const page = await browser.newPage();
//   const html = generateInvoiceHtml(invoiceData);
//   await page.setContent(html, { waitUntil: "networkidle0" });
//   const pdfBuffer = await page.pdf({ format: "A4" });
//   await browser.close();

//   return pdfBuffer;
// };

// // Main Cloud Function
// exports.sendInvoiceEmailV2 = onRequest(
//   {
//     cors: true,
//     memory: "1GB",
//     timeoutSeconds: 300,
//   },
//   async (req, res) => {
//     if (!transporter) {
//       return res.status(503).json({ error: "Service initializing, please try again shortly." });
//     }

//     if (req.method !== "POST") {
//       return res.status(405).json({ error: "Method not allowed, POST required." });
//     }

//     const {
//       to,
//       customerName,
//       car,
//       pickup,
//       destination,
//       passengerCount,
//       days,
//       distance,
//       price,
//       driverName,
//       driverPhone,
//       driverVehicle,
//     } = req.body || {};

//     if (!to || !car || !price) {
//       return res.status(400).json({ error: "Missing required booking details." });
//     }

//     const invoiceNumber = `INV-${Date.now()}`;
//     const invoiceData = {
//       invoiceNumber,
//       customerName,
//       customerEmail: to,
//       car,
//       pickup,
//       destination,
//       passengerCount,
//       days,
//       distance,
//       price,
//       driverName,
//       driverPhone,
//       driverVehicle,
//     };

//     try {
//       const pdfBuffer = await generatePdfBuffer(invoiceData);

//       await transporter.sendMail({
//         from: gmailEmail.value(),
//         to,
//         subject: `Your Booking Invoice - ${invoiceNumber}`,
//         html: generateInvoiceHtml(invoiceData),
//         attachments: [
//           {
//             filename: "logo.png",
//             path: path.join(__dirname, "logo.png"),
//             cid: "companylogo",
//           },
//           {
//             filename: `${invoiceNumber}.pdf`,
//             content: pdfBuffer,
//             contentType: "application/pdf",
//           },
//         ],
//       });

//       return res.status(200).json({ success: true, message: "Invoice email sent successfully." });
//     } catch (error) {
//       console.error("❌ Error sending invoice email:", error);
//       return res.status(500).json({ success: false, error: error.message });
//     }
//   }
// );


// index.js
// const { onRequest } = require("firebase-functions/v2/https");
// const nodemailer = require("nodemailer");
// const cors = require("cors")({ origin: true });
// const path = require("path");
// const chromium = require("chrome-aws-lambda");
// const { generateInvoiceHtml } = require("./invoiceUtils"); // simple HTML generator

// exports.sendInvoiceEmailV2 = onRequest({ memory: "1GB", timeoutSeconds: 300 }, async (req, res) => {
//   // Handle preflight CORS
//   if (req.method === "OPTIONS") {
//     res.set("Access-Control-Allow-Origin", "*");
//     res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
//     res.set("Access-Control-Allow-Headers", "Content-Type");
//     return res.status(204).send("");
//   }

//   cors(req, res, async () => {
//     if (req.method !== "POST") {
//       return res.status(405).send({ error: "POST method required" });
//     }

//     const {
//       to, customerName, car, pickup, destination, passengerCount, days, distance, price
//     } = req.body;

//     if (!to || !car || !price) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     // Load secrets inside handler
//     const gmailEmail = process.env.GMAIL_EMAIL || "<YOUR_EMAIL>";
//     const gmailPassword = process.env.GMAIL_PASSWORD || "<YOUR_PASSWORD>";

//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: { user: gmailEmail, pass: gmailPassword },
//     });

//     try {
//       // Launch Puppeteer only when needed
//       const browser = await chromium.puppeteer.launch({
//         args: chromium.args,
//         executablePath: await chromium.executablePath,
//         headless: chromium.headless,
//       });

//       const page = await browser.newPage();
//       const html = generateInvoiceHtml({ customerName, car, pickup, destination, passengerCount, days, distance, price });
//       await page.setContent(html, { waitUntil: "networkidle0" });
//       const pdfBuffer = await page.pdf({ format: "A4" });
//       await browser.close();

//       // Send email
//       await transporter.sendMail({
//         from: gmailEmail,
//         to,
//         subject: "Booking Invoice",
//         html,
//         attachments: [
//           { filename: "invoice.pdf", content: pdfBuffer, contentType: "application/pdf" },
//         ],
//       });

//       return res.status(200).json({ success: true, message: "Invoice sent" });
//     } catch (err) {
//       console.error(err);
//       return res.status(500).json({ error: err.message });
//     }
//   });
// });

// index.js
// const { onRequest } = require("firebase-functions/v2/https");
// const nodemailer = require("nodemailer");
// const cors = require("cors")({ origin: true });
// const chromium = require("chrome-aws-lambda");
// const path = require("path");

// // Import your invoice HTML generator
// const { generateInvoiceHtml } = require("./invoiceUtils");

// // Load Gmail credentials from Firebase environment
// const gmailEmail = process.env.GMAIL_EMAIL;
// const gmailPassword = process.env.GMAIL_PASSWORD;

// // Helper: send invoice email
// async function sendInvoiceEmail(invoiceData) {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: { user: gmailEmail, pass: gmailPassword },
//   });

//   // Launch Puppeteer to generate PDF
//   const browser = await chromium.puppeteer.launch({
//     args: chromium.args,
//     executablePath: await chromium.executablePath,
//     headless: chromium.headless,
//   });

//   const page = await browser.newPage();
//   await page.setContent(generateInvoiceHtml(invoiceData), { waitUntil: "networkidle0" });
//   const pdfBuffer = await page.pdf({ format: "A4" });
//   await browser.close();

//   // Send email
//   await transporter.sendMail({
//     from: gmailEmail,
//     to: invoiceData.customerEmail,
//     subject: `Booking Invoice - ${invoiceData.invoiceNumber}`,
//     html: generateInvoiceHtml(invoiceData),
//     attachments: [
//       {
//         filename: "invoice.pdf",
//         content: pdfBuffer,
//         contentType: "application/pdf",
//       },
//       {
//         filename: "logo.png",
//         path: path.join(__dirname, "logo.png"),
//         cid: "companylogo",
//       },
//     ],
//   });
// }

// // Main function
// exports.sendInvoiceEmailV2 = onRequest({ memory: "1GB", timeoutSeconds: 300 }, async (req, res) => {
//   // Handle preflight request
//   if (req.method === "OPTIONS") {
//     res.set("Access-Control-Allow-Origin", "*");
//     res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
//     res.set("Access-Control-Allow-Headers", "Content-Type");
//     return res.status(204).send("");
//   }

//   cors(req, res, async () => {
//     if (req.method !== "POST") return res.status(405).json({ error: "POST required" });

//     const {
//       to,
//       customerName,
//       car,
//       pickup,
//       destination,
//       passengerCount,
//       days,
//       distance,
//       price,
//       driverName,
//       driverPhone,
//       driverVehicle,
//     } = req.body;

//     if (!to || !car || !price) return res.status(400).json({ error: "Missing required booking details." });

//     const invoiceNumber = `INV-${Date.now()}`;
//     const invoiceData = {
//       invoiceNumber,
//       customerName,
//       customerEmail: to,
//       car,
//       pickup,
//       destination,
//       passengerCount,
//       days,
//       distance,
//       price,
//       driverName,
//       driverPhone,
//       driverVehicle,
//     };

//     try {
//       await sendInvoiceEmail(invoiceData);
//       return res.status(200).json({ success: true, message: "Invoice email sent successfully." });
//     } catch (error) {
//       console.error("Error sending invoice:", error);
//       return res.status(500).json({ success: false, error: error.message });
//     }
//   });
// });

// const { onRequest } = require("firebase-functions/v2/https");
// const nodemailer = require("nodemailer");
// const chromium = require("chrome-aws-lambda");
// const path = require("path");
// const cors = require("cors")({ origin: true }); // ✅ CORS middleware
// const { generateInvoiceHtml } = require("./invoiceUtils");

// const gmailEmail = process.env.GMAIL_EMAIL;
// const gmailPassword = process.env.GMAIL_PASSWORD;

// // Helper: send invoice email
// async function sendInvoiceEmail(invoiceData) {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: { user: gmailEmail, pass: gmailPassword },
//   });

//   const browser = await chromium.puppeteer.launch({
//     args: chromium.args,
//     executablePath: await chromium.executablePath,
//     headless: chromium.headless,
//   });

//   const page = await browser.newPage();
//   await page.setContent(generateInvoiceHtml(invoiceData), { waitUntil: "networkidle0" });
//   const pdfBuffer = await page.pdf({ format: "A4" });
//   await browser.close();

//   await transporter.sendMail({
//     from: gmailEmail,
//     to: invoiceData.customerEmail,
//     subject: `Booking Invoice - ${invoiceData.invoiceNumber}`,
//     html: generateInvoiceHtml(invoiceData),
//     attachments: [
//       { filename: "invoice.pdf", content: pdfBuffer, contentType: "application/pdf" },
//       { filename: "logo.png", path: path.join(__dirname, "logo.png"), cid: "companylogo" },
//     ],
//   });
// }

// // Main Cloud Function
// exports.sendInvoiceEmailV2 = onRequest({ memory: "1GB", timeoutSeconds: 300 }, async (req, res) => {
//   // ✅ Always set CORS headers
//   res.set("Access-Control-Allow-Origin", "*");
//   res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
//   res.set("Access-Control-Allow-Headers", "Content-Type");

//   // ✅ Handle preflight request
//   if (req.method === "OPTIONS") {
//     return res.status(204).send("");
//   }

//   if (req.method !== "POST") {
//     return res.status(405).json({ error: "POST required" });
//   }

//   const {
//     to,
//     customerName,
//     car,
//     pickup,
//     destination,
//     passengerCount,
//     days,
//     distance,
//     price,
//     driverName,
//     driverPhone,
//     driverVehicle,
//   } = req.body;

//   if (!to || !car || !price) {
//     return res.status(400).json({ error: "Missing required booking details." });
//   }

//   const invoiceNumber = `INV-${Date.now()}`;
//   const invoiceData = {
//     invoiceNumber,
//     customerName,
//     customerEmail: to,
//     car,
//     pickup,
//     destination,
//     passengerCount,
//     days,
//     distance,
//     price,
//     driverName,
//     driverPhone,
//     driverVehicle,
//   };

//   try {
//     await sendInvoiceEmail(invoiceData);
//     return res.status(200).json({ success: true, message: "Invoice email sent successfully." });
//   } catch (error) {
//     console.error("Error sending invoice:", error);
//     return res.status(500).json({ success: false, error: error.message });
//   }
// });


const { onRequest } = require("firebase-functions/v2/https");
const nodemailer = require("nodemailer");
const chromium = require("chrome-aws-lambda");
const path = require("path");
const { generateInvoiceHtml } = require("./invoiceUtils");

const gmailEmail = process.env.GMAIL_EMAIL;
const gmailPassword = process.env.GMAIL_PASSWORD;

// Helper: send invoice email
async function sendInvoiceEmail(invoiceData) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailEmail, pass: gmailPassword },
  });

  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  await page.setContent(generateInvoiceHtml(invoiceData), { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({ format: "A4" });
  await browser.close();

  await transporter.sendMail({
    from: gmailEmail,
    to: invoiceData.customerEmail,
    subject: `Booking Invoice - ${invoiceData.invoiceNumber}`,
    html: generateInvoiceHtml(invoiceData),
    attachments: [
      { filename: "invoice.pdf", content: pdfBuffer, contentType: "application/pdf" },
      { filename: "logo.png", path: path.join(__dirname, "logo.png"), cid: "companylogo" },
    ],
  });
}

// Main Cloud Function with fixed CORS handling
exports.sendInvoiceEmailV2 = onRequest(async (req, res) => {
  // Set CORS headers for all responses
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(204).send(""); // No content
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST required" });
  }

  const {
    to,
    customerName,
    car,
    pickup,
    destination,
    passengerCount,
    days,
    distance,
    price,
    driverName,
    driverPhone,
    driverVehicle,
  } = req.body;

  if (!to || !car || !price) {
    return res.status(400).json({ error: "Missing required booking details." });
  }

  const invoiceNumber = `INV-${Date.now()}`;
  const invoiceData = {
    invoiceNumber,
    customerName,
    customerEmail: to,
    car,
    pickup,
    destination,
    passengerCount,
    days,
    distance,
    price,
    driverName,
    driverPhone,
    driverVehicle,
  };

  try {
    await sendInvoiceEmail(invoiceData);
    return res.status(200).json({ success: true, message: "Invoice email sent successfully." });
  } catch (error) {
    console.error("Error sending invoice:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});
