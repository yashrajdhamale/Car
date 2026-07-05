const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const postJson = async (path, body) => {
  const response = await fetch(`${BACKEND_BASE_URL}/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || data.message || "Request failed");
    error.data = data;
    throw error;
  }
  return data;
};

export const sendScheduledConfirmation = (payload) => postJson("/driver-actions/scheduled-confirmation", payload);
export const acceptLocalRide = (payload) => postJson("/driver-actions/accept-local-ride", payload);
