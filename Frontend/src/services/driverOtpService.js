const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const postJson = async (path, body) => {
  const response = await fetch(`${BACKEND_BASE_URL}/api${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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

export const generateRideOtp = (payload) => postJson("/driver-otp/generate", payload);
export const verifyRideOtp = (payload) => postJson("/driver-otp/verify", payload);
