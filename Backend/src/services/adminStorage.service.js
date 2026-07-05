import { storageBucket } from "./firebase.js";

const sanitize = (value) => String(value || "").replace(/\s+/g, "_");

export const uploadAdminPackageImages = async ({ packageId = "packages", files = [] }) => {
  const bucket = storageBucket();
  const results = [];

  for (const file of files) {
    const fileName = `${Date.now()}_${sanitize(file.originalname)}`;
    const destination = `Holiday_Images/${packageId}/${fileName}`;
    const blob = bucket.file(destination);

    await blob.save(file.buffer, {
      resumable: false,
      contentType: file.mimetype,
      metadata: { cacheControl: "public, max-age=31536000" },
    });

    await blob.makePublic().catch(() => {});

    results.push({
      fileName,
      path: destination,
      url: `https://storage.googleapis.com/${bucket.name}/${encodeURIComponent(destination).replace(/%2F/g, "/")}`,
    });
  }

  return { success: true, images: results };
};

export const deleteAdminPackageImage = async ({ imageUrl }) => {
  const bucket = storageBucket();
  const decoded = decodeURIComponent(String(imageUrl || "").split("/o/")[1] || "");
  if (!decoded) {
    const error = new Error("imageUrl is required");
    error.statusCode = 400;
    throw error;
  }

  await bucket.file(decoded).delete({ ignoreNotFound: true });
  return { success: true };
};
