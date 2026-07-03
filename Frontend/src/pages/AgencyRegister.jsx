import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  registerAgency,
  resendAgencyEmailVerification,
} from "../services/agencyAuthService";
import "./AgencyRegister.css";

const initialForm = {
  agencyName: "",
  natureOfBusiness: "Travel Agency",
  country: "India",
  primaryMobile: "",
  secondaryMobile: "",
  businessType: "",
  fax: "",
  city: "",
  hearAboutUs: "Google",
  timeZone: "Asia/Kolkata",
  agencyEmail: "",
  preferredCurrency: "INR",
  website: "",
  firstName: "",
  lastName: "",
  address: "",
  telephone: "",
  pincode: "",
  designation: "",
  iataStatus: "not_approved",
  username: "",
  password: "",
  confirmPassword: "",
  selfieFile: null,
  profilePhotoFile: null,
  companyRegistrationFile: null,
  companyPanFile: null,
};


const cities = ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Pune", "Kolkata"];
const businessTypes = ["Proprietorship", "Partnership", "Private Limited", "LLP", "Other"];
const hearAboutOptions = ["Google", "Facebook", "Instagram", "Reference", "YouTube", "Other"];
const currencyOptions = ["INR", "USD", "EUR", "GBP"];
const countryOptions = ["India", "UAE", "USA", "UK", "Singapore"];
const timeZoneOptions = ["Asia/Kolkata", "Asia/Dubai", "Europe/London", "America/New_York"];
const natureOptions = ["Travel Agency", "Tour Operator", "Car Rental", "Corporate Travel", "Other"];

export default function AgencyRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [registeredUid, setRegisteredUid] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [selfiePreview, setSelfiePreview] = useState("");
  const [profilePhotoPreview, setProfilePhotoPreview] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);


  const passwordChecks = useMemo(() => {
    const value = form.password || "";
    return {
      length: value.length >= 8 && value.length <= 15,
      lower: /[a-z]/.test(value),
      upper: /[A-Z]/.test(value),
      number: /\d/.test(value),
      special: /[^A-Za-z0-9]/.test(value),
    };
  }, [form.password]);

  const passwordValid = Object.values(passwordChecks).every(Boolean);

  const onChange = (e) => {
  const { name, value, type, files } = e.target;

  if (type === "file") {
    const file = files?.[0] || null;

    setForm((prev) => ({
      ...prev,
      [name]: file,
    }));

    if (name === "profilePhotoFile") {
      if (profilePhotoPreview) {
        URL.revokeObjectURL(profilePhotoPreview);
      }
      setProfilePhotoPreview(file ? URL.createObjectURL(file) : "");
    }

    return;
  }

  setForm((prev) => ({
    ...prev,
    [name]: value,
  }));
};

  const addSecondaryPhone = () => {
    setForm((prev) => ({
      ...prev,
      secondaryMobile: prev.secondaryMobile || "",
    }));
  };

  const removeSecondaryPhone = () => {
    setForm((prev) => ({
      ...prev,
      secondaryMobile: "",
    }));
  };

  const validateInternationalPhone = (phone) => /^\+\d{10,15}$/.test(phone);

  const stopCamera = () => {
  if (streamRef.current) {
    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }
  setCameraOpen(false);
    setCameraReady(false);
};

const startCamera = async () => {
  console.log("STEP 1: startCamera called");

  try {
    setCameraError("");
    setCameraReady(false);

    console.log("STEP 2: Opening camera UI");
    setCameraOpen(true);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });

    console.log("STEP 3: Stream received", stream);

    streamRef.current = stream;

    setTimeout(async () => {
      console.log("STEP 4: videoRef =", videoRef.current);

      if (!videoRef.current) {
        console.error("STEP 5 FAILED: video element not found");
        setCameraError("Video element not found.");
        return;
      }

      try {
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = async () => {
          console.log("STEP 6: Metadata loaded");
          console.log(
            "Width:",
            videoRef.current.videoWidth,
            "Height:",
            videoRef.current.videoHeight
          );

          try {
            await videoRef.current.play();

            console.log("STEP 7: Video playing");
            setCameraReady(true);
          } catch (playError) {
            console.error("PLAY ERROR:", playError);
            setCameraError("Unable to start video.");
          }
        };
      } catch (err) {
        console.error("VIDEO ATTACH ERROR:", err);
      }
    }, 300);
  } catch (err) {
    console.error("CAMERA ERROR:", err);
    setCameraError(err.message || "Unable to access camera.");
  }
};

const captureSelfie = () => {
  console.log("CAPTURE CLICKED");

  const video = videoRef.current;
  const canvas = canvasRef.current;

  console.log("video =", video);
  console.log("canvas =", canvas);

  if (video) {
    console.log("videoWidth =", video.videoWidth);
    console.log("videoHeight =", video.videoHeight);
    console.log("readyState =", video.readyState);
    console.log("srcObject =", video.srcObject);
  }

  if (!video || !canvas) {
    console.error("Video or canvas missing");
    setCameraError("Video or canvas not available.");
    return;
  }

  if (!video.videoWidth || !video.videoHeight) {
    console.error("Video dimensions are 0");
    setCameraError(
      "Camera not ready yet. Please wait a moment and try again."
    );
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");

  ctx.drawImage(
    video,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const dataUrl = canvas.toDataURL("image/png");

  console.log("CAPTURE SUCCESS");

  setSelfiePreview(dataUrl);

  canvas.toBlob(
    (blob) => {
      if (!blob) {
        console.error("Blob creation failed");
        return;
      }

      const file = new File(
        [blob],
        `live-selfie-${Date.now()}.png`,
        {
          type: "image/png",
        }
      );

      setForm((prev) => ({
        ...prev,
        selfieFile: file,
      }));

      console.log("Selfie file created:", file);
    },
    "image/png"
  );

  stopCamera();
};

const retakeSelfie = async () => {
  setSelfiePreview("");
  setForm((prev) => ({
    ...prev,
    selfieFile: null,
  }));
  await startCamera();
};
useEffect(() => {
  return () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (profilePhotoPreview) {
      URL.revokeObjectURL(profilePhotoPreview);
    }
  };
}, [profilePhotoPreview]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (
      !form.agencyName ||
      !form.primaryMobile ||
      !form.businessType ||
      !form.city ||
      !form.agencyEmail ||
      !form.firstName ||
      !form.lastName ||
      !form.address ||
      !form.telephone ||
      !form.pincode ||
      !form.designation ||
      !form.username ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError("Please fill all required fields.");
      return;
    }

    if (!validateInternationalPhone(form.primaryMobile)) {
      setError("Primary mobile must be in international format, for example +919876543210");
      return;
    }

    if (form.secondaryMobile && !validateInternationalPhone(form.secondaryMobile)) {
      setError("Secondary mobile must be in international format, for example +919876543210");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!passwordValid) {
      setError("Password does not meet the required format.");
      return;
    }

    if (
      !form.selfieFile ||
      !form.profilePhotoFile ||
      !form.companyRegistrationFile ||
      !form.companyPanFile
    ) {
      setError(
        "Please upload selfie, passport photo, company registration document and PAN card."
      );
    }

    try {
      setLoading(true);

      const user = await registerAgency({
        agencyName: form.agencyName,
        ownerName: `${form.firstName} ${form.lastName}`.trim(),
        officeEmail: form.agencyEmail,
        phone: form.primaryMobile,
        password: form.password,

        natureOfBusiness: form.natureOfBusiness,
        country: form.country,
        primaryMobile: form.primaryMobile,
        secondaryMobile: form.secondaryMobile,
        businessType: form.businessType,
        fax: form.fax,
        city: form.city,
        hearAboutUs: form.hearAboutUs,
        timeZone: form.timeZone,
        preferredCurrency: form.preferredCurrency,
        website: form.website,
        firstName: form.firstName,
        lastName: form.lastName,
        address: form.address,
        telephone: form.telephone,
        pincode: form.pincode,
        designation: form.designation,
        iataStatus: form.iataStatus,
        username: form.username,
        selfieFileName: form.selfieFile?.name || "",
        profilePhotoFileName: form.profilePhotoFile?.name || "",
        selfieFile: form.selfieFile,
        profilePhotoFile: form.profilePhotoFile,
        companyRegistrationFile: form.companyRegistrationFile,
        companyPanFile: form.companyPanFile,
      });

      navigate(`/agency-verify-email?uid=${user.uid}`);
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setLoading(true);
      setError("");
      await resendAgencyEmailVerification();
      setMessage("Verification email sent again.");
    } catch (err) {
      setError(err.message || "Failed to resend email verification.");
    } finally {
      setLoading(false);
    }
  };

  const passwordRuleClass = (ok) =>
    `agency-register__password-rule ${ok ? "is-valid" : ""}`;

  return (
    <div className="agency-register">
      <div className="agency-register__shell">
        <div className="agency-register__hero">
          <p className="agency-register__eyebrow">Cab Route Partner Desk</p>
          <h1>Agency Registration</h1>
          <p>
            Complete your agency onboarding form. Email verification and phone
            verification are mandatory before the agency becomes fully active.
          </p>
        </div>

        <form className="agency-register__form" onSubmit={onSubmit}>
          {message ? <div className="agency-register__alert is-success">{message}</div> : null}
          {error ? <div className="agency-register__alert is-error">{error}</div> : null}

          <section className="agency-section">
            <div className="agency-section__header">Personal Details</div>
            <div className="agency-section__body agency-grid agency-grid--3">
              <div className="agency-field">
                <label>Agency Name *</label>
                <input
                  name="agencyName"
                  value={form.agencyName}
                  onChange={onChange}
                  placeholder="Test Travel Agency"
                />
              </div>

              <div className="agency-field">
                <label>Nature of Business *</label>
                <select name="natureOfBusiness" value={form.natureOfBusiness} onChange={onChange}>
                  {natureOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="agency-field">
                <label>Country *</label>
                <select name="country" value={form.country} onChange={onChange}>
                  {countryOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="agency-field agency-field--span-2">
                <label>Mobile Numbers *</label>
                <input
                  name="primaryMobile"
                  value={form.primaryMobile}
                  onChange={onChange}
                  placeholder="+919876543210"
                />
                <small>OTP will be sent only to this primary number.</small>

                {!form.secondaryMobile ? (
                  <button
                    type="button"
                    className="agency-chip-button"
                    onClick={addSecondaryPhone}
                  >
                    + Add another mobile number
                  </button>
                ) : (
                  <div className="agency-inline-phone">
                    <input
                      name="secondaryMobile"
                      value={form.secondaryMobile}
                      onChange={onChange}
                      placeholder="+919123456789"
                    />
                    <button
                      type="button"
                      className="agency-remove-button"
                      onClick={removeSecondaryPhone}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="agency-field">
                <label>Business Type *</label>
                <select name="businessType" value={form.businessType} onChange={onChange}>
                  <option value="">Select</option>
                  {businessTypes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="agency-field">
                <label>Company Registration Document *</label>

                <input
                  type="file"
                  name="companyRegistrationFile"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={onChange}
                />

                <small>
                  Upload Shop Act / Company Registration Certificate
                </small>

                {form.companyRegistrationFile && (
                  <small>
                    Selected: {form.companyRegistrationFile.name}
                  </small>
                )}
              </div>

              <div className="agency-field">
                <label>Company PAN Card Copy *</label>

                <input
                  type="file"
                  name="companyPanFile"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={onChange}
                />

                {form.companyPanFile && (
                  <small>
                    Selected: {form.companyPanFile.name}
                  </small>
                )}
              </div>

              <div className="agency-field">
                <label>Fax</label>
                <input
                  name="fax"
                  value={form.fax}
                  onChange={onChange}
                  placeholder="020123456"
                />
              </div>

              <div className="agency-field">
                <label>City *</label>
                <select name="city" value={form.city} onChange={onChange}>
                  <option value="">Select city</option>
                  {cities.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="agency-field">
                <label>How did you hear about us?</label>
                <select name="hearAboutUs" value={form.hearAboutUs} onChange={onChange}>
                  {hearAboutOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="agency-field">
                <label>Time Zone *</label>
                <select name="timeZone" value={form.timeZone} onChange={onChange}>
                  {timeZoneOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="agency-field">
                <label>Agency Email *</label>
                <input
                  name="agencyEmail"
                  type="email"
                  value={form.agencyEmail}
                  onChange={onChange}
                  placeholder="agency@example.com"
                />
              </div>

              <div className="agency-field">
                <label>Preferred Currency *</label>
                <select
                  name="preferredCurrency"
                  value={form.preferredCurrency}
                  onChange={onChange}
                >
                  {currencyOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="agency-field">
                <label>Website</label>
                <input
                  name="website"
                  value={form.website}
                  onChange={onChange}
                  placeholder="https://youragency.com"
                />
              </div>

              <div className="agency-field">
              <label>First Name *</label>
              <input
                name="firstName"
                value={form.firstName}
                onChange={onChange}
                placeholder="First name"
              />
            </div>

            <div className="agency-field">
              <label>Last Name *</label>
              <input
                name="lastName"
                value={form.lastName}
                onChange={onChange}
                placeholder="Last name"
              />
            </div>

            <div className="agency-field agency-field--span-2">
              <label>Address *</label>
              <textarea
                name="address"
                value={form.address}
                onChange={onChange}
                rows={3}
                placeholder="Office address"
              />
            </div>

            <div className="agency-field">
              <label>Telephone *</label>
              <input
                name="telephone"
                value={form.telephone}
                onChange={onChange}
                placeholder="02212345678"
              />
            </div>

              <div className="agency-field">
                <label>Pincode / Zipcode / Postcode *</label>
                <input
                  name="pincode"
                  value={form.pincode}
                  onChange={onChange}
                  placeholder="400001"
                />
              </div>

              <div className="agency-field">
                <label>Designation *</label>
                <input
                  name="designation"
                  value={form.designation}
                  onChange={onChange}
                  placeholder="Manager"
                />
              </div>

              <div className="agency-field">
              <label>IATA Status</label>
              <div className="agency-radio-group agency-radio-group--cards">
                <label
                  className={`agency-radio-card ${
                    form.iataStatus === "not_approved" ? "is-active" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="iataStatus"
                    value="not_approved"
                    checked={form.iataStatus === "not_approved"}
                    onChange={onChange}
                  />
                  <span>Not Approved</span>
                </label>

                <label
                  className={`agency-radio-card ${
                    form.iataStatus === "approved" ? "is-active" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="iataStatus"
                    value="approved"
                    checked={form.iataStatus === "approved"}
                    onChange={onChange}
                  />
                  <span>Approved</span>
                </label>
              </div>
            </div>
            </div>
          </section>

          <section className="agency-section">
            <div className="agency-section__header">Agent Registration</div>
            <div className="agency-section__body agency-grid agency-grid--2">
              <div className="agency-stack">
                <div className="agency-field">
                  <label>User Name *</label>
                  <input
                    name="username"
                    value={form.username}
                    onChange={onChange}
                    placeholder="testagencyuser"
                  />
                </div>

                <div className="agency-field">
                  <label>Password *</label>
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={onChange}
                    placeholder="Create password"
                  />
                </div>

                <div className="agency-field">
                  <label>Confirm Password *</label>
                  <input
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={onChange}
                    placeholder="Confirm password"
                  />
                </div>
              </div>

              <div className="agency-password-card">
                <h3>Password Must Contain:</h3>
                <ul>
                  <li className={passwordRuleClass(passwordChecks.length)}>
                    Between 8 to 15 characters
                  </li>
                  <li className={passwordRuleClass(passwordChecks.lower)}>
                    One lowercase letter
                  </li>
                  <li className={passwordRuleClass(passwordChecks.upper)}>
                    One uppercase letter
                  </li>
                  <li className={passwordRuleClass(passwordChecks.number)}>
                    One numeric digit
                  </li>
                  <li className={passwordRuleClass(passwordChecks.special)}>
                    One special character
                  </li>
                  <li className={passwordRuleClass(passwordValid)}>
                    A strong secure combination for office access
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section className="agency-section">
            <div className="agency-section__header">Identity Capture</div>
            <div className="agency-section__body agency-grid agency-grid--2">
              <div className="agency-field">
                <label>Live Selfie *</label>

                <div className="agency-camera-box">
                  {!cameraOpen && !selfiePreview ? (
                    <button
                      type="button"
                      className="agency-secondary-btn agency-camera-trigger"
                      onClick={startCamera}
                    >
                      Turn On Camera
                    </button>
                  ) : null}

                  {cameraError ? <p className="agency-camera-error">{cameraError}</p> : null}

                  {cameraOpen ? (
                    <div className="agency-camera-live">
                      <video
                        ref={(el) => {
                          console.log("VIDEO ELEMENT CREATED:", el);
                          videoRef.current = el;
                        }}
                        autoPlay
                        playsInline
                        muted
                        className="agency-camera-video"
                      />
                      <div className="agency-camera-actions">
                        <button
                          type="button"
                          className="agency-primary-btn agency-camera-action-btn"
                          onClick={captureSelfie}
                        >
                          Capture Selfie
                        </button>
                        <button
                          type="button"
                          className="agency-secondary-btn agency-camera-action-btn"
                          onClick={stopCamera}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {selfiePreview ? (
                    <div className="agency-camera-preview-wrap">
                      <img src={selfiePreview} alt="Selfie preview" className="agency-camera-preview" />
                      <div className="agency-camera-actions">
                        <button
                          type="button"
                          className="agency-secondary-btn agency-camera-action-btn"
                          onClick={retakeSelfie}
                        >
                          Retake Selfie
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <canvas ref={canvasRef} hidden />
                </div>
              </div>

              <div className="agency-field">
              <label>Passport-size Profile Photo *</label>
              <label className="agency-upload-box">
                <input
                  type="file"
                  name="profilePhotoFile"
                  accept="image/*"
                  onChange={onChange}
                  hidden
                />
                {profilePhotoPreview ? (
                  <div className="agency-upload-preview-wrap">
                    <img
                      src={profilePhotoPreview}
                      alt="Passport size preview"
                      className="agency-upload-preview"
                    />
                    <span>{form.profilePhotoFile?.name}</span>
                  </div>
                ) : (
                  <span>Click to upload passport-size profile photo</span>
                )}
              </label>
            </div>
            </div>
          </section>

          <section className="agency-section">
            <div className="agency-section__header">Verification Flow</div>
            <div className="agency-section__body">
              <div className="agency-status-card">
                <p>
                  Step 1: submit registration details and create pending agency profile.
                </p>
                <p>Step 2: verify office email.</p>
                <p>Step 3: verify primary mobile number.</p>
                <p>
                  Final status becomes active only after both email and phone are verified.
                </p>
              </div>
            </div>
          </section>

          <div className="agency-register__actions">
            <button type="submit" className="agency-primary-btn" disabled={loading}>
              {loading ? "Please wait..." : "Register Agency"}
            </button>

            

            <p className="agency-login-link">
              Already registered?
              <span onClick={() => navigate("/agency-login")}> Login</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}