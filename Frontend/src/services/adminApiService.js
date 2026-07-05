const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const requestJson = async (path, { method = "GET", body } = {}) => {
  const response = await fetch(`${BACKEND_BASE_URL}/api${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || "Request failed");
  }
  return data;
};

export const adminApi = {
  getSuperAdmin: (email) => requestJson(`/admin/super-admin?email=${encodeURIComponent(email)}`),
  listPackages: () => requestJson("/admin/packages"),
  getPackage: (packageId) => requestJson(`/admin/packages/${encodeURIComponent(packageId)}`),
  updatePackage: (packageId, body) => requestJson(`/admin/packages/${encodeURIComponent(packageId)}`, { method: "PATCH", body }),
  deletePackage: (packageId) => requestJson(`/admin/packages/${encodeURIComponent(packageId)}`, { method: "DELETE" }),
};
