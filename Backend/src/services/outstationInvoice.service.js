const OUTSTATION_INVOICE_URL =
  process.env.OUTSTATION_INVOICE_URL ||
  "https://us-central1-carzi-holidays-f4be3.cloudfunctions.net/sendOutstationInvoice";

export const sendOutstationInvoice = async ({ body }) => {
  const payload = {
    to: body?.to || "",
    customerName: body?.customerName || "",
    bookingId: body?.bookingId || "",
    vehicleType: body?.vehicleType || "Outstation Vehicle",
    vehicleCapacity: body?.vehicleCapacity || 4,
    pickup: body?.pickup || "",
    destination: body?.destination || "",
    travelDate: body?.travelDate || "",
    time: body?.time || "",
    passengerCount: body?.passengerCount || 1,
    days: body?.days || 1,
    distance: body?.distance || 0,
    price: body?.price || 0,
    basePrice: body?.basePrice || 0,
    gstAmount: body?.gstAmount || 0,
    totalPrice: body?.totalPrice || body?.price || 0,
  };

  const response = await fetch(OUTSTATION_INVOICE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) {
    const error = new Error(result?.error || result?.message || `HTTP ${response.status}`);
    error.statusCode = response.status;
    throw error;
  }

  return { success: true, invoice: result };
};
