const CLOUD_FUNCTIONS_BASE_URL =
  process.env.CLOUD_FUNCTIONS_BASE_URL ||
  "https://us-central1-carzi-holidays-f4be3.cloudfunctions.net";

const forwardJson = async (path, body) => {
  const response = await fetch(`${CLOUD_FUNCTIONS_BASE_URL}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body || {}),
  });

  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const error = new Error(data.error || data.message || "OTP request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const generateDriverRideOtp = async (payload) => {
  return forwardJson("generateRideOtp", payload);
};

export const verifyDriverRideOtp = async (payload) => {
  return forwardJson("verifyRideOtp", payload);
};
