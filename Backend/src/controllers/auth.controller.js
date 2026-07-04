import {
  createAuthUser,
  createUserProfile,
  syncGoogleAuthUser,
} from "../services/user.service.js";
import { firebaseAdmin, firestore, FieldValue, storageBucket } from "../services/firebase.js";

const uploadBufferToStorage = async (file, destination) => {
  const bucket = storageBucket();
  const blob = bucket.file(destination);

  await blob.save(file.buffer, {
    resumable: false,
    contentType: file.mimetype,
    metadata: {
      cacheControl: "public, max-age=31536000",
    },
  });

  await blob.makePublic().catch(() => {});

  return `https://storage.googleapis.com/${bucket.name}/${encodeURIComponent(destination).replace(/%2F/g, "/")}`;
};

const signInWithFirebasePassword = async (email, password) => {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;

  if (!apiKey) {
    const error = new Error("FIREBASE_WEB_API_KEY is not configured on the backend");
    error.statusCode = 500;
    throw error;
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data?.error?.message || "Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  return data;
};

const normalizeRole = (role) => {
  const value = String(role || "").trim().toLowerCase();
  if (["customer", "agency", "travelagency", "travel_agency", "driver"].includes(value)) {
    return value === "travelagency" || value === "travel_agency" ? "agency" : value;
  }
  return "customer";
};

const resolveStatus = (userData = {}) => String(userData.status || userData.approvalStatus || "active").toLowerCase().trim();


export const registerUser = async (req, res, next) => {
  try {
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
        message:
          "email, password, firstName, lastName, and contactNumber1 are required",
      });
    }

    const fullDisplayName =
      displayName ||
      [firstName, middleName, lastName].filter(Boolean).join(" ").trim();
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

export const registerDriver = async (req, res, next) => {
  try {
    const body = req.body || {};
    const firstName = body.firstName;
    const middleName = body.middleName || "";
    const lastName = body.lastName;
    const primaryContact = body.primaryContact;
    const secondaryContact = body.secondaryContact || "";
    const email = body.email;
    const password = body.password;
    const homeAddress = body.homeAddress;
    const officeAddress = body.officeAddress || "";
    const vehicleType = body.vehicleType;
    const customVehicleType = body.customVehicleType || "";
    const vehicleModel = body.vehicleModel;
    const vehicleColor = body.vehicleColor;
    const vehicleNumber = body.vehicleNumber;
    const agreementDate = body.agreementDate;
    const firmName = body.firmName || "";
    const agreementAddress = body.agreementAddress || "";
    const aadhaarNumber = body.aadhaarNumber;
    const panNumber = body.panNumber;
    const paymentStructure = body.paymentStructure || "";
    const paymentCycle = body.paymentCycle || "";
    const agreementStartDate = body.agreementStartDate;
    const agreementEndDate = body.agreementEndDate;
    const declarationAccepted = body.declarationAccepted === true || body.declarationAccepted === "true";
    const femaleSafetyAccepted = body.femaleSafetyAccepted === true || body.femaleSafetyAccepted === "true";
    const noSolicitationAccepted = body.noSolicitationAccepted === true || body.noSolicitationAccepted === "true";
    const legalComplianceAccepted = body.legalComplianceAccepted === true || body.legalComplianceAccepted === "true";
    const agreementVersion = body.agreementVersion || "v1";
    const companyName = body.companyName || "Cab Route Services";
    const companyAddress = body.companyAddress || "";
    const companySignerName = body.companySignerName || "";
    const companySignerDesignation = body.companySignerDesignation || "";

    if (!firstName || !lastName || !primaryContact || !email || !password || !homeAddress || !vehicleType || !vehicleModel || !vehicleColor || !vehicleNumber) {
      return res.status(400).json({
        success: false,
        message: "Missing required driver registration fields",
      });
    }

    if (!declarationAccepted || !femaleSafetyAccepted || !legalComplianceAccepted) {
      return res.status(400).json({
        success: false,
        message: "Required agreement acknowledgements are missing",
      });
    }

    const files = req.files || {};
    const requiredFiles = ["aadhar", "pan", "license", "rcBook"];
    if (requiredFiles.some((key) => !files[key]?.[0])) {
      return res.status(400).json({
        success: false,
        message: "Required document uploads are missing",
      });
    }

    const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ").trim();
    let authUser;
    try {
      authUser = await createAuthUser({
        email,
        password,
        displayName: fullName,
        phoneNumber: primaryContact,
      });
    } catch (error) {
      if (error?.code === "auth/email-already-exists") {
        return res.status(409).json({
          success: false,
          message: "This email is already registered. Please sign in instead.",
        });
      }
      if (error?.code === "auth/invalid-phone-number") {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid phone number.",
        });
      }
      throw error;
    }

    const normalizedVehicleType = vehicleType === "other" ? customVehicleType || vehicleType : vehicleType;
    const uploadedDocuments = {};
    for (const [key, fileList] of Object.entries(files)) {
      const file = fileList?.[0];
      if (!file) continue;
      const fileName = `${Date.now()}_${file.originalname}`.replace(/\s+/g, "_");
      const destination = `drivers/${authUser.uid}/documents/${key}_${fileName}`;
      uploadedDocuments[key] = await uploadBufferToStorage(file, destination);
    }

    const vehiclePhotoFiles = files.vehiclePhotos || [];
    const uploadedVehiclePhotos = [];
    for (const file of vehiclePhotoFiles) {
      const fileName = `${Date.now()}_${file.originalname}`.replace(/\s+/g, "_");
      const destination = `drivers/${authUser.uid}/vehicle/photos/${fileName}`;
      uploadedVehiclePhotos.push(await uploadBufferToStorage(file, destination));
    }

    const userProfile = await createUserProfile({
      uid: authUser.uid,
      email,
      firstName,
      middleName,
      lastName,
      contactNumber1: primaryContact,
      contactNumber2: secondaryContact,
      displayName: fullName,
      role: "driver",
    });

    const agreementData = {
      agreementVersion,
      companyName,
      companyAddress,
      companySignerName,
      companySignerDesignation,
        agreementDate: agreementDate || null,
        driverName: fullName,
        firmName,
        address: agreementAddress || homeAddress,
        aadhaarNumber,
      panNumber,
      paymentStructure,
      paymentCycle,
      validityStartDate: agreementStartDate || null,
      validityEndDate: agreementEndDate || null,
      declarationAccepted: !!declarationAccepted,
      femaleSafetyAccepted: !!femaleSafetyAccepted,
        noSolicitationAccepted: !!noSolicitationAccepted,
        legalComplianceAccepted: !!legalComplianceAccepted,
        acceptedAt: FieldValue.serverTimestamp(),
      };

    await firestore.collection("users").doc(authUser.uid).set(
      {
        uid: authUser.uid,
        email,
        fullName,
        firstName,
        middleName,
        lastName,
        primaryContact,
        secondaryContact,
        address: homeAddress,
        officeAddress,
        role: "driver",
        type: "driver",
        status: "pending",
        emailVerified: false,
        isDriver: true,
        agreementAccepted: true,
        agreementVersion,
        agreementData,
        vehicle: {
          type: normalizedVehicleType,
          model: vehicleModel,
          color: vehicleColor,
          number: String(vehicleNumber).toUpperCase(),
          photos: uploadedVehiclePhotos,
        },
        documents: uploadedDocuments,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastLogin: null,
      },
      { merge: true }
    );

    await firestore.collection("drivers").doc(authUser.uid).set(
      {
        uid: authUser.uid,
        userId: authUser.uid,
        email,
        fullName,
        firstName,
        middleName,
        lastName,
        phone: primaryContact,
        secondaryContact,
        address: homeAddress,
        officeAddress,
        role: "driver",
        type: "driver",
        status: "pending",
        isActive: false,
        isVerified: false,
        agreementAccepted: true,
        agreementVersion,
        agreementData,
        vehicle: {
          type: normalizedVehicleType,
          model: vehicleModel,
          color: vehicleColor,
          number: String(vehicleNumber).toUpperCase(),
          photos: uploadedVehiclePhotos,
        },
        documents: uploadedDocuments,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastOnline: null,
      },
      { merge: true }
    );

    return res.status(201).json({
      success: true,
      message: "Driver registration submitted successfully",
      authUser: {
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName,
      },
      user: userProfile,
    });
  } catch (error) {
    next(error);
  }
};

export const registerAgency = async (req, res, next) => {
  try {
    const body = req.body || {};
    const agencyName = body.agencyName || "";
    const ownerName = body.ownerName || "";
    const officeEmail = String(body.officeEmail || "").trim().toLowerCase();
    const phone = body.phone || "";
    const password = body.password || "";

    const natureOfBusiness = body.natureOfBusiness || "Travel Agency";
    const country = body.country || "India";
    const primaryMobile = body.primaryMobile || phone;
    const secondaryMobile = body.secondaryMobile || "";
    const businessType = body.businessType || "";
    const fax = body.fax || "";
    const city = body.city || "";
    const hearAboutUs = body.hearAboutUs || "Google";
    const timeZone = body.timeZone || "Asia/Kolkata";
    const preferredCurrency = body.preferredCurrency || "INR";
    const website = body.website || "";
    const firstName = body.firstName || "";
    const lastName = body.lastName || "";
    const address = body.address || "";
    const telephone = body.telephone || "";
    const pincode = body.pincode || "";
    const designation = body.designation || "";
    const iataStatus = body.iataStatus || "not_approved";
    const username = body.username || "";

    if (!agencyName || !ownerName || !officeEmail || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "agencyName, ownerName, officeEmail, phone, and password are required",
      });
    }

    const files = req.files || {};
    const requiredFiles = ["selfieFile", "profilePhotoFile", "companyRegistrationFile", "companyPanFile"];
    if (requiredFiles.some((key) => !files[key]?.[0])) {
      return res.status(400).json({
        success: false,
        message: "Required agency documents are missing",
      });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    let authUser;
    try {
      authUser = await createAuthUser({
        email: officeEmail,
        password,
        displayName: ownerName || agencyName,
        phoneNumber: primaryMobile || phone,
      });
    } catch (error) {
      if (error?.code === "auth/email-already-exists") {
        return res.status(409).json({
          success: false,
          message: "This email is already registered. Please sign in instead.",
        });
      }
      if (error?.code === "auth/invalid-phone-number") {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid phone number.",
        });
      }
      throw error;
    }

    const uploadedFiles = {};
    for (const [key, fileList] of Object.entries(files)) {
      const file = fileList?.[0];
      if (!file) continue;
      const fileName = `${Date.now()}_${file.originalname}`.replace(/\s+/g, "_");
      const destination = `agency-documents/${authUser.uid}/${key}_${fileName}`;
      uploadedFiles[key] = await uploadBufferToStorage(file, destination);
    }

    const agencyPayload = {
      uid: authUser.uid,
      role: "agency",
      type: "agency",
      status: "pending_verification",
      registrationCompleted: true,
      emailVerified: false,
      phoneVerified: false,
      verificationStep: "email_pending",
      agencyName,
      ownerName,
      officeEmail,
      phone,
      natureOfBusiness,
      country,
      primaryMobile,
      secondaryMobile,
      businessType,
      fax,
      city,
      hearAboutUs,
      timeZone,
      preferredCurrency,
      website,
      firstName,
      lastName,
      address,
      telephone,
      pincode,
      designation,
      iataStatus,
      username,
      selfieFileName: files.selfieFile?.[0]?.originalname || "",
      profilePhotoFileName: files.profilePhotoFile?.[0]?.originalname || "",
      companyRegistrationFileName: files.companyRegistrationFile?.[0]?.originalname || "",
      companyPanFileName: files.companyPanFile?.[0]?.originalname || "",
      selfieUrl: uploadedFiles.selfieFile || "",
      profilePhotoUrl: uploadedFiles.profilePhotoFile || "",
      registrationDocUrl: uploadedFiles.companyRegistrationFile || "",
      panCardUrl: uploadedFiles.companyPanFile || "",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await firestore.collection("agencies").doc(authUser.uid).set(agencyPayload, { merge: true });

    await firestore.collection("users").doc(authUser.uid).set(
      {
        uid: authUser.uid,
        role: "agency",
        type: "agency",
        status: "pending_verification",
        email: officeEmail,
        displayName: agencyName || ownerName || "Agency User",
        phoneNumber: primaryMobile,
        agencyName,
        firstName,
        lastName,
        emailVerified: false,
        phoneVerified: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        selfieUrl: uploadedFiles.selfieFile || "",
        profilePhotoUrl: uploadedFiles.profilePhotoFile || "",
        registrationDocUrl: uploadedFiles.companyRegistrationFile || "",
        panCardUrl: uploadedFiles.companyPanFile || "",
      },
      { merge: true }
    );

    return res.status(201).json({
      success: true,
      message: "Agency registration submitted successfully",
      user: {
        uid: authUser.uid,
        email: officeEmail,
        displayName: agencyName || ownerName || "Agency User",
        role: "agency",
      },
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password, role = "customer" } = req.body || {};

    console.log(`Attempting login for email: ${email} with role: ${role}`);
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "email and password are required",
      });
    }

    const normalizedRole = normalizeRole(role);
    const authResponse = await signInWithFirebasePassword(email, password);
    const uid = authResponse.localId;

    const userRecord = await firebaseAdmin.auth().getUser(uid);
    const userDoc = await firestore.collection("users").doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const storedRole = normalizeRole(userData?.role || userData?.type || "customer");
    const status = resolveStatus(userData);

    if (storedRole !== normalizedRole) {
      return res.status(403).json({
        success: false,
        message: `This account is not registered as a ${normalizedRole}`,
      });
    }

    if (["driver", "agency"].includes(storedRole) && !["active", "approved", "verified"].includes(status)) {
      return res.status(403).json({
        success: false,
        message: `This ${storedRole} account is awaiting approval`,
      });
    }

    const displayName =
      userData?.displayName ||
      userRecord.displayName ||
      authResponse.displayName ||
      email.split("@")[0];

    if (!userDoc.exists) {
      await createUserProfile({
        uid,
        email,
        firstName: displayName.split(" ")[0] || displayName,
        middleName: "",
        lastName: displayName.split(" ").slice(1).join(" "),
        contactNumber1: userRecord.phoneNumber || "",
        displayName,
        role: normalizedRole,
      });
    }

    const customToken = await firebaseAdmin.auth().createCustomToken(uid, { role: normalizedRole });

    console.log(`User ${email} logged in successfully with role ${normalizedRole}`);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      customToken,
      user: {
        uid,
        email: userRecord.email || email,
        displayName,
        photoURL: userRecord.photoURL || "",
        role: normalizedRole,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const sendPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ success: false, message: "email is required" });
    }

    const actionCodeSettings = process.env.FRONTEND_ORIGIN
      ? { url: `${process.env.FRONTEND_ORIGIN}/login` }
      : undefined;

    const resetLink = await firebaseAdmin.auth().generatePasswordResetLink(email, actionCodeSettings);

    return res.status(200).json({
      success: true,
      message: "Password reset link generated",
      resetLink,
    });
  } catch (error) {
    next(error);
  }
};

export const startPhoneLogin = async (_req, res) => {
  return res.status(501).json({
    success: false,
    message: "Phone OTP login is not configured on the backend yet",
  });
};

export const verifyPhoneLogin = async (_req, res) => {
  return res.status(501).json({
    success: false,
    message: "Phone OTP login is not configured on the backend yet",
  });
};

export const continueWithGoogle = async (req, res, next) => {
  try {
    const { idToken, displayName, phoneNumber, role = "user" } = req.body || {};
    
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "idToken is required",
      });
    }

    const { firebaseAdmin } = await import("../services/firebase.js");
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    const authUser = await syncGoogleAuthUser({
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName:
        displayName || decodedToken.name || decodedToken.email?.split("@")[0] || "User",
      photoURL: decodedToken.picture || "",
      phoneNumber: decodedToken.phone_number || phoneNumber,
    });

    const names = (displayName || decodedToken.name || "").trim().split(/\s+/).filter(Boolean);
    const firstName = names[0] || decodedToken.email?.split("@")[0] || "User";
    const lastName = names.length > 1 ? names.slice(1).join(" ") : "";

    const user = await createUserProfile({
      uid: authUser.uid,
      email: authUser.email || decodedToken.email || "",
      firstName,
      middleName: "",
      lastName,
      contactNumber1: decodedToken.phone_number || phoneNumber || "",
      contactNumber2: "",
      displayName: authUser.displayName || displayName || decodedToken.name || firstName,
      role,
    });

    return res.status(200).json({
      success: true,
      message: "Google sign-in completed successfully",
      user,
      customToken: await firebaseAdmin.auth().createCustomToken(authUser.uid),
      authUser: {
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName,
        photoURL: authUser.photoURL || "",
      },
    });
  } catch (error) {
    next(error);
  }
};
