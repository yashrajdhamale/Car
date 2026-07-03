// invoiceUtils.js
function generateInvoiceHtml(data) {
  return `
  <div>
    <h1>Invoice #${data.invoiceNumber}</h1>
    <p>Name: ${data.customerName}</p>
    <p>Car: ${data.car}</p>
    <p>Price: ₹${data.price}</p>
    <!-- Add more details as needed -->
  </div>
  `;
}

module.exports = { generateInvoiceHtml };
