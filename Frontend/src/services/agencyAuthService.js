import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updateProfile,
} from "firebase/auth";
import { storage } from "../config/firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";

let confirmationResultRef = null;
let recaptchaVerifierRef = null;

export const setupRecaptcha = (containerId = "recaptcha-container") => {
  try {
    clearAgencyRecaptcha();

    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`reCAPTCHA container #${containerId} not found.`);
    }

    container.innerHTML = "";

    recaptchaVerifierRef = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
      callback: () => {
        console.log("[setupRecaptcha] reCAPTCHA solved");
      },
      "expired-callback": () => {
        console.log("[setupRecaptcha] reCAPTCHA expired");
        clearAgencyRecaptcha();
      },
    });

    return recaptchaVerifierRef;
  } catch (error) {
    console.error("[setupRecaptcha] failed", error);
    throw error;
  }
};

export const clearAgencyRecaptcha = () => {
  try {
    if (recaptchaVerifierRef) {
      recaptchaVerifierRef.clear();
      recaptchaVerifierRef = null;
    }

    const container = document.getElementById("recaptcha-container");
    if (container) {
      container.innerHTML = "";
    }
  } catch (error) {
    console.warn("[clearAgencyRecaptcha] failed", error);
  }
};

export const registerAgency = async (form) => {
  try {
    const officeEmail = form.officeEmail?.trim().toLowerCase();
    const password = form.password;
    const phone = form.phone?.trim();

    console.log("[registerAgency] starting");
    console.log("[registerAgency] input:", {
      agencyName: form.agencyName,
      ownerName: form.ownerName,
      officeEmail,
      phone,
      passwordLength: password?.length,
      username: form.username,
      city: form.city,
      businessType: form.businessType,
    });

    if (!officeEmail || !password || !phone) {
      throw new Error("Missing required registration details.");
    }

    const cred = await createUserWithEmailAndPassword(auth, officeEmail, password);

    const uid = cred.user.uid;

    const selfieRef = ref(
      storage,
      `agency-documents/${uid}/selfie`
    );

    const profilePhotoRef = ref(
      storage,
      `agency-documents/${uid}/passport-photo`
    );

    const registrationDocRef = ref(
      storage,
      `agency-documents/${uid}/registration-document`
    );

    const panCardRef = ref(
      storage,
      `agency-documents/${uid}/pan-card`
    );
    console.log("========== STORAGE DEBUG ==========");
    console.log("Storage bucket:", storage.app.options.storageBucket);
    console.log("Selfie file:", form.selfieFile);
    console.log("Selfie ref:", selfieRef.fullPath);
    console.log("==================================");
        await uploadBytes(selfieRef, form.selfieFile);

    await uploadBytes(
      profilePhotoRef,
      form.profilePhotoFile
    );

    await uploadBytes(
      registrationDocRef,
      form.companyRegistrationFile
    );

    await uploadBytes(
      panCardRef,
      form.companyPanFile
    );

    const selfieUrl =
      await getDownloadURL(selfieRef);

    const profilePhotoUrl =
      await getDownloadURL(profilePhotoRef);

    const registrationDocUrl =
      await getDownloadURL(registrationDocRef);

    const panCardUrl =
      await getDownloadURL(panCardRef);

    console.log("[registerAgency] user created:", {
      uid: cred.user?.uid,
      email: cred.user?.email,
      emailVerified: cred.user?.emailVerified,
    });

    await updateProfile(cred.user, {
      displayName: form.ownerName || form.agencyName || "Agency User",
    });

    console.log("[registerAgency] profile updated");

    await sendEmailVerification(cred.user);

    console.log("[registerAgency] verification email request success");

    const agencyPayload = {
      uid: cred.user.uid,
      role: "agency",
      type: "agency",

      status: "pending_verification",
      registrationCompleted: true,
      emailVerified: false,
      phoneVerified: false,
      verificationStep: "email_pending",

      agencyName: form.agencyName || "",
      ownerName: form.ownerName || "",
      officeEmail,
      phone,

      natureOfBusiness: form.natureOfBusiness || "",
      country: form.country || "",
      primaryMobile: form.primaryMobile || phone,
      secondaryMobile: form.secondaryMobile || "",
      businessType: form.businessType || "",
      fax: form.fax || "",
      city: form.city || "",
      hearAboutUs: form.hearAboutUs || "",
      timeZone: form.timeZone || "",
      preferredCurrency: form.preferredCurrency || "INR",
      website: form.website || "",
      firstName: form.firstName || "",
      lastName: form.lastName || "",
      address: form.address || "",
      telephone: form.telephone || "",
      pincode: form.pincode || "",
      designation: form.designation || "",
      iataStatus: form.iataStatus || "not_approved",
      username: form.username || "",
      selfieFileName: form.selfieFileName || "",
      profilePhotoFileName: form.profilePhotoFileName || "",
      selfieUrl,
      profilePhotoUrl,
      registrationDocUrl,
      panCardUrl,

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    console.log("[registerAgency] writing agency document:", agencyPayload);

    await setDoc(doc(db, "agencies", cred.user.uid), agencyPayload);

    await setDoc(
      doc(db, "users", cred.user.uid),
      {
        uid: cred.user.uid,
        role: "agency",
        type: "agency",
        status: "pending_verification",
        email: officeEmail,
        displayName: form.agencyName || form.ownerName || "Agency User",
        phoneNumber: phone,
        agencyName: form.agencyName || "",
        firstName: form.firstName || "",
        lastName: form.lastName || "",
        emailVerified: false,
        phoneVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        selfieUrl,
        profilePhotoUrl,
        registrationDocUrl,
        panCardUrl,
      },
      { merge: true }
    );

    console.log("[registerAgency] firestore documents saved");

    return cred.user;
  } catch (error) {
    console.error("[registerAgency] failed");
    console.error("[registerAgency] error code:", error?.code);
    console.error("[registerAgency] error message:", error?.message);
    console.error("[registerAgency] full error:", error);
    throw error;
  }
};

export const refreshAgencyVerificationFlags = async (uid) => {
  try {
    console.log("[refreshAgencyVerificationFlags] start", { uid });

    await auth.currentUser?.reload();
    const currentUser = auth.currentUser;

    console.log(
      "[refreshAgencyVerificationFlags] current user:",
      currentUser
        ? {
            uid: currentUser.uid,
            email: currentUser.email,
            emailVerified: currentUser.emailVerified,
          }
        : null
    );

    if (!currentUser || currentUser.uid !== uid) return null;

    const agencyRef = doc(db, "agencies", uid);
    const userRef = doc(db, "users", uid);
    const agencySnap = await getDoc(agencyRef);

    console.log("[refreshAgencyVerificationFlags] agency exists:", agencySnap.exists());

    if (!agencySnap.exists()) return null;

    const profile = agencySnap.data();
    const emailVerified = currentUser.emailVerified;
    const phoneVerified = !!profile.phoneVerified;

    let status = "pending_verification";
    let verificationStep = "email_pending";

    if (emailVerified && !phoneVerified) {
      status = "pending_phone_verification";
      verificationStep = "phone_pending";
    } else if (emailVerified && phoneVerified) {
      status = "active";
      verificationStep = "verified";
    }

    await updateDoc(agencyRef, {
      emailVerified,
      status,
      verificationStep,
      updatedAt: serverTimestamp(),
    });

    await updateDoc(userRef, {
      emailVerified,
      status,
      updatedAt: serverTimestamp(),
    });

    console.log("[refreshAgencyVerificationFlags] firestore updated", {
      emailVerified,
      phoneVerified,
      status,
      verificationStep,
    });

    const updatedSnap = await getDoc(agencyRef);
    return { user: currentUser, profile: updatedSnap.data() };
  } catch (error) {
    console.error("[refreshAgencyVerificationFlags] failed");
    console.error("[refreshAgencyVerificationFlags] error code:", error?.code);
    console.error("[refreshAgencyVerificationFlags] error message:", error?.message);
    console.error("[refreshAgencyVerificationFlags] full error:", error);
    throw error;
  }
};

export const resendAgencyEmailVerification = async () => {
  try {
    console.log("[resendAgencyEmailVerification] clicked");
    console.log(
      "[resendAgencyEmailVerification] current user:",
      auth.currentUser
        ? {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            emailVerified: auth.currentUser.emailVerified,
          }
        : null
    );

    if (!auth.currentUser) {
      throw new Error("No logged in user.");
    }

    await sendEmailVerification(auth.currentUser);

    console.log("[resendAgencyEmailVerification] resend success");
  } catch (error) {
    console.error("[resendAgencyEmailVerification] failed");
    console.error("[resendAgencyEmailVerification] error code:", error?.code);
    console.error("[resendAgencyEmailVerification] error message:", error?.message);
    console.error("[resendAgencyEmailVerification] full error:", error);
    throw error;
  }
};

export const sendAgencyPhoneOtp = async (phone) => {
  try {
    console.log("[sendAgencyPhoneOtp] starting", {
      phone,
      hostname: window.location.hostname,
      origin: window.location.origin,
    });

    const verifier = setupRecaptcha("recaptcha-container");
    confirmationResultRef = await signInWithPhoneNumber(auth, phone, verifier);

    console.log("[sendAgencyPhoneOtp] OTP sent successfully");
    return true;
  } catch (error) {
    console.error("[sendAgencyPhoneOtp] failed");
    console.error("[sendAgencyPhoneOtp] error code:", error?.code);
    console.error("[sendAgencyPhoneOtp] error message:", error?.message);
    console.error("[sendAgencyPhoneOtp] full error:", error);

    clearAgencyRecaptcha();
    throw error;
  }
};

export const verifyAgencyPhoneOtp = async (uid, otpCode) => {
  try {
    if (!confirmationResultRef) {
      throw new Error("OTP session expired. Please request OTP again.");
    }

    const result = await confirmationResultRef.confirm(otpCode);
    const verifiedPhone = result?.user?.phoneNumber || auth.currentUser?.phoneNumber || "";

    const agencyRef = doc(db, "agencies", uid);
    const userRef = doc(db, "users", uid);

    const agencySnap = await getDoc(agencyRef);
    if (!agencySnap.exists()) {
      throw new Error("Agency profile not found.");
    }

    const profile = agencySnap.data();
    const emailVerified = !!profile.emailVerified;

    await updateDoc(agencyRef, {
      phoneVerified: true,
      phone: verifiedPhone || profile.phone || "",
      primaryMobile: verifiedPhone || profile.primaryMobile || "",
      status: emailVerified ? "active" : "pending_email_verification",
      verificationStep: emailVerified ? "verified" : "email_pending",
      updatedAt: serverTimestamp(),
    });

    await updateDoc(userRef, {
      phoneVerified: true,
      phoneNumber: verifiedPhone || "",
      status: emailVerified ? "active" : "pending_email_verification",
      updatedAt: serverTimestamp(),
    });

    console.log("[verifyAgencyPhoneOtp] phone verified", {
      uid,
      verifiedPhone,
      emailVerified,
    });

    const updatedSnap = await getDoc(agencyRef);
    return updatedSnap.data();
  } catch (error) {
    console.error("[verifyAgencyPhoneOtp] failed");
    console.error("[verifyAgencyPhoneOtp] error code:", error?.code);
    console.error("[verifyAgencyPhoneOtp] error message:", error?.message);
    console.error("[verifyAgencyPhoneOtp] full error:", error);
    throw error;
  }
};

export const markAgencyEmailVerified = async (uid) => {
  try {
    const agencyRef = doc(db, "agencies", uid);
    const userRef = doc(db, "users", uid);
    const agencySnap = await getDoc(agencyRef);

    if (!agencySnap.exists()) {
      throw new Error("Agency profile not found.");
    }

    const profile = agencySnap.data();
    const phoneVerified = !!profile.phoneVerified;

    await updateDoc(agencyRef, {
      emailVerified: true,
      status: phoneVerified ? "active" : "pending_phone_verification",
      verificationStep: phoneVerified ? "verified" : "phone_pending",
      updatedAt: serverTimestamp(),
    });

    await updateDoc(userRef, {
      emailVerified: true,
      status: phoneVerified ? "active" : "pending_phone_verification",
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("[markAgencyEmailVerified] failed");
    console.error("[markAgencyEmailVerified] error code:", error?.code);
    console.error("[markAgencyEmailVerified] error message:", error?.message);
    console.error("[markAgencyEmailVerified] full error:", error);
    throw error;
  }
};

export const markAgencyPhoneVerified = async (uid, verifiedPhone = "") => {
  try {
    const agencyRef = doc(db, "agencies", uid);
    const userRef = doc(db, "users", uid);
    const agencySnap = await getDoc(agencyRef);

    if (!agencySnap.exists()) {
      throw new Error("Agency profile not found.");
    }

    const profile = agencySnap.data();
    const emailVerified = !!profile.emailVerified;

    await updateDoc(agencyRef, {
      phoneVerified: true,
      phone: verifiedPhone || profile.phone || "",
      primaryMobile: verifiedPhone || profile.primaryMobile || "",
      status: emailVerified ? "active" : "pending_email_verification",
      verificationStep: emailVerified ? "verified" : "email_pending",
      updatedAt: serverTimestamp(),
    });

    await updateDoc(userRef, {
      phoneVerified: true,
      phoneNumber: verifiedPhone || profile.phone || "",
      status: emailVerified ? "active" : "pending_email_verification",
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("[markAgencyPhoneVerified] failed");
    console.error("[markAgencyPhoneVerified] error code:", error?.code);
    console.error("[markAgencyPhoneVerified] error message:", error?.message);
    console.error("[markAgencyPhoneVerified] full error:", error);
    throw error;
  }
};

export const loginAgency = async (officeEmail, password) => {
  try {
    console.log("[loginAgency] starting", { officeEmail });

    const cred = await signInWithEmailAndPassword(auth, officeEmail, password);
    const uid = cred.user.uid;

    console.log("[loginAgency] auth success:", {
      uid,
      email: cred.user.email,
      emailVerified: cred.user.emailVerified,
    });

    const agencyRef = doc(db, "agencies", uid);
    const agencySnap = await getDoc(agencyRef);

    console.log("[loginAgency] agency profile exists:", agencySnap.exists());

    if (!agencySnap.exists()) {
      throw new Error("Agency profile not found.");
    }

    await cred.user.reload();

    const emailVerified = auth.currentUser?.emailVerified || false;
    const profile = agencySnap.data();

    let status = profile?.status || "pending_verification";
    if (emailVerified && profile?.phoneVerified) {
      status = "active";
    } else if (emailVerified && !profile?.phoneVerified) {
      status = "pending_phone_verification";
    } else if (!emailVerified && profile?.phoneVerified) {
      status = "pending_email_verification";
    }

    await updateDoc(agencyRef, {
      emailVerified,
      status,
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "users", uid), {
      emailVerified,
      status,
      updatedAt: serverTimestamp(),
    });

    const refreshedSnap = await getDoc(agencyRef);
    const refreshedProfile = refreshedSnap.data();

    console.log("[loginAgency] final profile:", {
      emailVerified,
      role: refreshedProfile?.role,
      phoneVerified: refreshedProfile?.phoneVerified,
      status: refreshedProfile?.status,
    });

    return {
      user: cred.user,
      profile: {
        ...refreshedProfile,
        emailVerified,
      },
    };
  } catch (error) {
    console.error("[loginAgency] failed");
    console.error("[loginAgency] error code:", error?.code);
    console.error("[loginAgency] error message:", error?.message);
    console.error("[loginAgency] full error:", error);
    throw error;
  }
};

export const getAgencyProfile = async (uid) => {
  const snap = await getDoc(doc(db, "agencies", uid));
  return snap.exists() ? snap.data() : null;
};

export const logoutAgency = async () => {
  await signOut(auth);
};