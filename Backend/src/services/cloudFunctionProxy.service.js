const CLOUD_FUNCTIONS_BASE_URL =
  process.env.CLOUD_FUNCTIONS_BASE_URL ||
  "https://us-central1-carzi-holidays-f4be3.cloudfunctions.net";

export const proxyCloudFunctionJson = async (functionName, payload) => {
  const response = await fetch(`${CLOUD_FUNCTIONS_BASE_URL}/${functionName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });

  const text = await response.text();
  let data = {};
  if (text) {
    try { data = JSON.parse(text); } catch { data = { message: text }; }
  }

  if (!response.ok) {
    const error = new Error(data.error || data.message || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};
