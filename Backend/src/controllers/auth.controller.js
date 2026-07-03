import { createAuthUser, createUserProfile } from "../services/user.service.js";

export const registerUser = async (req, res, next) => {
  try {

    console.log(Object.keys(process.env));
    console.log("Value:", process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
console.log("Type:", typeof process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
console.log("Length:", process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.length);
    const {
      email,
      password,
      firstName,
      middleName = "",
      lastName,
      contactNumber1,
      contactNumber2 = "",
      displayName,
    } = req.body || {};

    if (!email || !password || !firstName || !lastName || !contactNumber1) {
      return res.status(400).json({
        success: false,
        message: "email, password, firstName, lastName, and contactNumber1 are required",
      });
    }

    const fullDisplayName = displayName || [firstName, middleName, lastName].filter(Boolean).join(" ").trim();
    const authUser = await createAuthUser({
      email,
      password,
      displayName: fullDisplayName,
      phoneNumber: contactNumber1,
    });

    const user = await createUserProfile({
      uid: authUser.uid,
      email,
      firstName,
      middleName,
      lastName,
      contactNumber1,
      contactNumber2,
      displayName: fullDisplayName,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user,
      authUser: {
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName,
      },
    });
  } catch (error) {
    next(error);
  }
};
