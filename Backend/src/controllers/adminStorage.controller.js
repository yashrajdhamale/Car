import { deleteAdminPackageImage, uploadAdminPackageImages } from "../services/adminStorage.service.js";

export const uploadPackageImages = async (req, res, next) => {
  try {
    const files = req.files || [];
    const result = await uploadAdminPackageImages({ packageId: req.params.packageId || "packages", files });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const removePackageImage = async (req, res, next) => {
  try {
    const result = await deleteAdminPackageImage({ imageUrl: req.body?.imageUrl });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
