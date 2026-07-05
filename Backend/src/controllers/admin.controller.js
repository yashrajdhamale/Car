import {
  deleteAdminPackage,
  findSuperAdminByEmail,
  getAdminPackageById,
  listAdminPackages,
  updateAdminPackage,
} from "../services/admin.service.js";

export const readSuperAdmin = async (req, res, next) => {
  try {
    const email = req.query.email || "";
    const users = await findSuperAdminByEmail(email);
    return res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

export const readPackages = async (_req, res, next) => {
  try {
    const packages = await listAdminPackages();
    return res.status(200).json({ success: true, packages });
  } catch (error) {
    next(error);
  }
};

export const readPackageById = async (req, res, next) => {
  try {
    const pkg = await getAdminPackageById(req.params.packageId);
    if (!pkg) {
      return res.status(404).json({ success: false, message: "Package not found" });
    }
    return res.status(200).json({ success: true, package: pkg });
  } catch (error) {
    next(error);
  }
};

export const patchPackageById = async (req, res, next) => {
  try {
    await updateAdminPackage(req.params.packageId, req.body || {});
    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const removePackageById = async (req, res, next) => {
  try {
    await deleteAdminPackage(req.params.packageId);
    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
