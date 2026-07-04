import { createUserProfile, syncGoogleAuthUser } from "../services/user.service.js";
import { firebaseAdmin } from "../services/firebase.js";

const buildState = (payload = {}) => encodeURIComponent(Buffer.from(JSON.stringify(payload)).toString("base64url"));
const parseState = (state) => {
  try {
    if (!state) return {};
    return JSON.parse(Buffer.from(decodeURIComponent(state), "base64url").toString("utf8"));
  } catch {
    return {};
  }
};

export const startGoogleAuth = async (req, res, next) => {
  try {
    const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return res.status(500).json({
        success: false,
        message: "Google OAuth is not configured on the backend",
      });
    }

    const state = buildState({
      redirectTo: req.query.redirectTo || "/login",
      role: req.query.role || "user",
      frontendOrigin,
    });

    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.set("client_id", clientId);
    googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", "openid email profile");
    googleAuthUrl.searchParams.set("access_type", "offline");
    googleAuthUrl.searchParams.set("prompt", "consent");
    googleAuthUrl.searchParams.set("state", state);

    return res.redirect(googleAuthUrl.toString());
  } catch (error) {
    next(error);
  }
};

export const handleGoogleCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query || {};
    const payload = parseState(state);
    const frontendOrigin = payload.frontendOrigin || process.env.FRONTEND_ORIGIN || "http://localhost:5173";
    const redirectTo = payload.redirectTo || "/login";
    const role = payload.role || "user";

    if (!code) {
      return res.redirect(`${frontendOrigin}/login?googleAuth=failed`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(code),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      return res.redirect(`${frontendOrigin}/login?googleAuth=failed`);
    }

    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileResponse.json();
    if (!profileResponse.ok) {
      return res.redirect(`${frontendOrigin}/login?googleAuth=failed`);
    }

    const authUser = await syncGoogleAuthUser({
      uid: profile.sub,
      email: profile.email,
      displayName: profile.name || profile.email?.split("@")[0] || "User",
      photoURL: profile.picture || "",
      phoneNumber: profile.phone_number,
    });

    const displayName = authUser.displayName || profile.name || profile.email?.split("@")[0] || "User";
    const nameParts = displayName.split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || profile.email?.split("@")[0] || "User";
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    await createUserProfile({
      uid: authUser.uid,
      email: authUser.email || profile.email || "",
      firstName,
      middleName: "",
      lastName,
      contactNumber1: profile.phone_number || "",
      contactNumber2: "",
      displayName,
      role,
    });

    const customToken = await firebaseAdmin.auth().createCustomToken(authUser.uid);
    const targetUrl = new URL(`${frontendOrigin}${redirectTo}`);
    targetUrl.searchParams.set("googleAuth", "success");
    targetUrl.searchParams.set("customToken", customToken);

    return res.redirect(targetUrl.toString());
  } catch (error) {
    next(error);
  }
};
