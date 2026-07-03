import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, auth, db } from '../config/firebase';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { ScrollToTop } from '@components';
import {
  Camera,
  X,
  ArrowLeft,
  Upload,
  CheckCircle,
} from 'lucide-react';
import DriverAgreementStep from '../components/DriverAgreementStep';

const backgroundStyle = {
  backgroundImage:
    'url("https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1950&q=80")',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  minHeight: '100vh',
};

const COMPANY_NAME = 'Cab Route Services';
const COMPANY_ADDRESS = '';
const COMPANY_SIGNER_NAME = '';
const COMPANY_SIGNER_DESIGNATION = '';
const AGREEMENT_VERSION = 'v1';

const DRAFT_KEY = 'driver_registration_draft';
const STEP_KEY = 'driver_registration_step';

const DriverSignup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addNotification } = useNotification();

  const {
  register,
  handleSubmit,
  formState: { errors },
  watch,
  trigger,
  setValue,
  reset,
} = useForm({
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      driverName: '',
      primaryContact: '',
      secondaryContact: '',
      password: '',
      confirmPassword: '',
      email: '',
      homeAddress: '',
      officeAddress: '',
      vehicleType: '',
      customVehicleType: '',
      vehicleModel: '',
      vehicleColor: '',
      vehicleNumber: '',
      agreeToTerms: false,
      agreementDate: "",

      firmName: '',
      agreementAddress: '',
      aadhaarNumber: '',
      panNumber: '',
      paymentStructure: '',
      paymentCycle: '',
      agreementStartDate: '',
      agreementEndDate: '',
      driverSignatureName: '',
      declarationAccepted: false,
      femaleSafetyAccepted: false,
      noSolicitationAccepted: false,
      legalComplianceAccepted: false,
    },
  });
  const watchedValues = watch();

  useEffect(() => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify(watchedValues)
    );
  }, [watchedValues]);

  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);

    if (savedDraft) {
      try {
        reset(JSON.parse(savedDraft));
      } catch (err) {
        console.error("Unable to restore draft", err);
      }
    }
  }, [reset]);

  const [aadharFile, setAadharFile] = useState(null);
  const [panFile, setPanFile] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  const [rcBookFile, setRcBookFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [vehiclePhotos, setVehiclePhotos] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationError, setRegistrationError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    localStorage.setItem(
      STEP_KEY,
      currentStep.toString()
    );
  }, [currentStep]);

  useEffect(() => {
    const savedStep = localStorage.getItem(STEP_KEY);

    if (savedStep) {
      setCurrentStep(Number(savedStep));
    }
  }, []);

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [showCustomVehicleType, setShowCustomVehicleType] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [currentCameraStream, setCurrentCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [currentFileSetter, setCurrentFileSetter] = useState(null);

  const videoRef = useRef(null);


  useEffect(() => {
    if (location.state?.message) {
      addNotification(location.state.message, location.state.type || 'success');
      window.history.replaceState({}, document.title);
    }
  }, [location, addNotification]);

  useEffect(() => {
    return () => {
      if (currentCameraStream) {
        currentCameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [currentCameraStream]);

  const progress = currentStep === 1 ? 50 : 100;

  const firstName = watch('firstName');
  const middleName = watch('middleName');
  const lastName = watch('lastName');
  const homeAddress = watch('homeAddress');

  useEffect(() => {
    const parts = [firstName, middleName, lastName].filter(Boolean);
    const fullName = parts.join(' ').trim();

  }, [firstName, middleName, lastName, homeAddress, setValue, watch]);

  const startCamera = async (setter) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCurrentCameraStream(stream);
        setCurrentFileSetter(() => setter);
        setShowCamera(true);
        setCameraError('');
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraError('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (currentCameraStream) {
      currentCameraStream.getTracks().forEach((track) => track.stop());
      setCurrentCameraStream(null);
    }
    setShowCamera(false);
    setCurrentFileSetter(null);
  };

  const captureImage = () => {
    if (!videoRef.current || !currentFileSetter) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        const file = new File([blob], `capture_${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });

        currentFileSetter(file);
        stopCamera();
      },
      'image/jpeg',
      0.9
    );
  };

  const handleFileChange = (e, setFile) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleVehiclePhotos = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 6) {
      addNotification('You can only upload up to 6 vehicle photos.', 'error');
      return;
    }
    setVehiclePhotos(files);
  };

  const uploadFile = async (file, path) => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const getVehicleTypeValue = () => {
    const vehicleType = watch('vehicleType');
    const customVehicleType = watch('customVehicleType');
    return vehicleType === 'other' ? customVehicleType : vehicleType;
  };

  const fullName = [watch('firstName'), watch('middleName'), watch('lastName')]
    .filter(Boolean)
    .join(' ')
    .trim();

  const validateStepOne = async () => {
    const fieldsToValidate = [
      'firstName',
      'lastName',
      'primaryContact',
      'password',
      'confirmPassword',
      'email',
      'homeAddress',
      'vehicleType',
      'vehicleModel',
      'vehicleColor',
      'vehicleNumber',
      'agreeToTerms',
    ];

    const valid = await trigger(fieldsToValidate);

    if (!valid) {
      setRegistrationError('Please complete all required Step 1 fields correctly.');
      return false;
    }

    if (watch('vehicleType') === 'other' && !watch('customVehicleType')?.trim()) {
      setRegistrationError('Please specify your custom vehicle type.');
      return false;
    }

    if (!aadharFile || !panFile || !licenseFile || !rcBookFile) {
      setRegistrationError('Please upload all required documents before moving to Step 2.');
      return false;
    }

    if (!vehiclePhotos.length) {
      setRegistrationError('Please upload at least one vehicle photo before moving to Step 2.');
      return false;
    }

    setRegistrationError('');
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return true;
  };

  const onSubmit = async (data) => {
    if (isSubmitting) return;

    if (currentStep === 1) {
      await validateStepOne();
      return;
    }

    setIsSubmitting(true);
    setRegistrationError('');

    try {
      if (!data.declarationAccepted || !data.femaleSafetyAccepted || !data.legalComplianceAccepted) {
        throw new Error('Please accept all required agreement declarations.');
      }

      if (!data.aadhaarNumber || !/^\d{12}$/.test(data.aadhaarNumber)) {
        throw new Error('Please enter a valid 12-digit Aadhaar number.');
      }

      if (!data.panNumber || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(data.panNumber)) {
        throw new Error('Please enter a valid PAN number.');
      }

      if (!data.driverSignatureName?.trim()) {
        throw new Error('Driver signature name is required.');
      }

      if (!aadharFile || !panFile || !licenseFile || !rcBookFile) {
        throw new Error('Please upload all required documents.');
      }

      if (!vehiclePhotos.length) {
        throw new Error('Please upload at least one vehicle photo.');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const userId = userCredential.user.uid;

      await sendEmailVerification(userCredential.user);

      const uploadPromises = [
        uploadFile(
          aadharFile,
          `drivers/${userId}/documents/aadhar_${Date.now()}_${aadharFile.name}`
        ),
        uploadFile(
          panFile,
          `drivers/${userId}/documents/pan_${Date.now()}_${panFile.name}`
        ),
        uploadFile(
          licenseFile,
          `drivers/${userId}/documents/license_${Date.now()}_${licenseFile.name}`
        ),
        uploadFile(
          rcBookFile,
          `drivers/${userId}/documents/rcbook_${Date.now()}_${rcBookFile.name}`
        ),

        signatureFile
          ? uploadFile(
              signatureFile,
              `drivers/${userId}/documents/signature_${Date.now()}_${signatureFile.name}`
            )
          : Promise.resolve(""),

        ...vehiclePhotos.map((file, index) =>
          uploadFile(
            file,
            `drivers/${userId}/vehicle/photos/vehicle_${index}_${Date.now()}_${file.name}`
          )
        ),
      ];

      const [
        aadharUrl,
        panUrl,
        licenseUrl,
        rcBookUrl,
        signatureUrl,
        ...vehiclePhotoUrls
      ] = await Promise.all(uploadPromises);
      const agreementData = {
        agreementVersion: AGREEMENT_VERSION,
        companyName: COMPANY_NAME,
        companyAddress: COMPANY_ADDRESS,
        companySignerName: COMPANY_SIGNER_NAME,
        companySignerDesignation: COMPANY_SIGNER_DESIGNATION,
        agreementDate: data.agreementDate,
        driverName: fullName,
        firmName: data.firmName || '',
        address: data.agreementAddress,
        aadhaarNumber: data.aadhaarNumber,
        panNumber: data.panNumber,
        paymentStructure: data.paymentStructure,
        paymentCycle: data.paymentCycle,
        validityStartDate: data.agreementStartDate,
        validityEndDate: data.agreementEndDate,
        driverSignatureUrl: signatureUrl,
        declarationAccepted: true,
        femaleSafetyAccepted: !!data.femaleSafetyAccepted,
        noSolicitationAccepted: !!data.noSolicitationAccepted,
        legalComplianceAccepted: !!data.legalComplianceAccepted,
        acceptedAt: new Date().toISOString(),
      };

      const userProfile = {
        uid: userId,
        email: data.email,
        fullName,
        firstName: data.firstName,
        middleName: data.middleName || '',
        lastName: data.lastName,
        phone: data.primaryContact,
        primaryContact: data.primaryContact,
        secondaryContact: data.secondaryContact || '',
        address: data.homeAddress,
        officeAddress: data.officeAddress || '',
        role: 'driver',
        type: 'driver',
        status: 'pending',
        emailVerified: false,
        isDriver: true,
        agreementAccepted: true,
        agreementAcceptedAt: serverTimestamp(),
        agreementVersion: AGREEMENT_VERSION,
        agreementData,
        vehicle: {
          type: getVehicleTypeValue(),
          model: data.vehicleModel,
          color: data.vehicleColor,
          number: data.vehicleNumber.toUpperCase(),
          photos: vehiclePhotoUrls,
        },
        documents: {
          aadhar: aadharUrl,
          pan: panUrl,
          license: licenseUrl,
          rcBook: rcBookUrl,
          signature: signatureUrl,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: null,
      };

      const driverProfile = {
        ...userProfile,
        userId,
        isActive: false,
        isVerified: false,
        lastOnline: null,
      };

      await setDoc(doc(db, 'users', userId), userProfile, { merge: true });
      await setDoc(doc(db, 'drivers', userId), driverProfile, { merge: true });

      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(STEP_KEY);

      await signOut(auth);

      addNotification(
        'Registration submitted successfully. Please verify your email. Your driver account will be activated after review.',
        'success'
      );

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Registration error:', error);

      let errorMessage = 'Registration failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setRegistrationError(errorMessage);
      addNotification(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 px-3 py-2 transition duration-150 ease-in-out';

  const sectionTitleClass = 'text-lg font-semibold text-gray-900 mb-4';

  if (isSubmitting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Submitting registration...</p>
          <p className="text-sm text-gray-500 mt-2">
            Please wait while we create the driver account and save the agreement.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-cover bg-center bg-no-repeat" style={backgroundStyle}>
      <div className="absolute inset-0 bg-black bg-opacity-55"></div>
      <div className="pt-24"></div>

      <div className="relative max-w-5xl mx-auto bg-white bg-opacity-95 p-6 md:p-8 rounded-xl shadow-2xl backdrop-blur-sm mb-12">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => (currentStep === 2 ? setCurrentStep(1) : navigate(-1))}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {currentStep === 2 ? 'Back to Step 1' : 'Back'}
          </button>
        </div>

        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">Driver Registration</h2>
        <p className="text-center text-gray-600 mb-6">
          Complete your profile and accept the service agreement
        </p>

        <div className="mb-8">
          <div className="flex items-center justify-between text-sm font-medium mb-2">
            <span className={currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}>Step 1: Registration Form</span>
            <span className={currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}>Step 2: Agreement</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {registrationError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
            <p>{registrationError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {currentStep === 1 && (
            <>
              <div className="border-b border-gray-200 pb-6">
                <h3 className={sectionTitleClass}>Personal Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name *</label>
                    <input
                      type="text"
                      {...register('firstName', { required: 'First name is required' })}
                      className={inputClass}
                    />
                    {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Middle Name</label>
                    <input type="text" {...register('middleName')} className={inputClass} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                    <input
                      type="text"
                      {...register('lastName', { required: 'Last name is required' })}
                      className={inputClass}
                    />
                    {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Primary Contact Number *</label>
                    <input
                      type="tel"
                      {...register('primaryContact', {
                        required: 'Primary contact is required',
                        pattern: {
                          value: /^[0-9]{10}$/,
                          message: 'Please enter a valid 10-digit phone number',
                        },
                      })}
                      className={inputClass}
                    />
                    {errors.primaryContact && (
                      <p className="mt-1 text-sm text-red-600">{errors.primaryContact.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Secondary Contact Number</label>
                    <input
                      type="tel"
                      {...register('secondaryContact', {
                        pattern: {
                          value: /^[0-9]{10}$/,
                          message: 'Please enter a valid 10-digit phone number',
                        },
                      })}
                      className={inputClass}
                    />
                    {errors.secondaryContact && (
                      <p className="mt-1 text-sm text-red-600">{errors.secondaryContact.message}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Email Address *</label>
                  <input
                    type="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Please enter a valid email address',
                      },
                    })}
                    className={inputClass}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password *</label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters',
                        },
                      })}
                      className={inputClass}
                    />
                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      {...register('confirmPassword', {
                        validate: (value) => value === watch('password') || 'Passwords do not match',
                      })}
                      className={inputClass}
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Home Address *</label>
                    <textarea
                      {...register('homeAddress', { required: 'Home address is required' })}
                      rows={3}
                      className={inputClass}
                    />
                    {errors.homeAddress && (
                      <p className="mt-1 text-sm text-red-600">{errors.homeAddress.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Office Address</label>
                    <textarea {...register('officeAddress')} rows={3} className={inputClass} />
                  </div>
                </div>
              </div>

              <div className="border-b border-gray-200 pb-6">
                <h3 className={sectionTitleClass}>Vehicle Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vehicle Type *</label>
                    <select
                      {...register('vehicleType', {
                        required: 'Vehicle type is required',
                        onChange: (e) => {
                          setShowCustomVehicleType(e.target.value === 'other');
                          if (e.target.value !== 'other') {
                            setValue('customVehicleType', '');
                          }
                        },
                      })}
                      className={inputClass}
                    >
                      <option value="">Select vehicle type</option>
                      <option value="hatchback">Hatchback</option>
                      <option value="sedan">Sedan</option>
                      <option value="suv">SUV</option>
                      <option value="muv">MUV</option>
                      <option value="luxury">Luxury</option>
                      <option value="other">Other (Please specify)</option>
                    </select>

                    {showCustomVehicleType && (
                      <div className="mt-2">
                        <input
                          type="text"
                          {...register('customVehicleType')}
                          placeholder="Enter vehicle type"
                          className={inputClass}
                        />
                      </div>
                    )}

                    {errors.vehicleType && <p className="mt-1 text-sm text-red-600">{errors.vehicleType.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vehicle Model *</label>
                    <input
                      type="text"
                      {...register('vehicleModel', { required: 'Vehicle model is required' })}
                      placeholder="e.g., Swift Dzire"
                      className={inputClass}
                    />
                    {errors.vehicleModel && (
                      <p className="mt-1 text-sm text-red-600">{errors.vehicleModel.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vehicle Color *</label>
                    <input
                      type="text"
                      {...register('vehicleColor', { required: 'Vehicle color is required' })}
                      placeholder="e.g., White"
                      className={inputClass}
                    />
                    {errors.vehicleColor && (
                      <p className="mt-1 text-sm text-red-600">{errors.vehicleColor.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vehicle Registration Number *</label>
                    <input
                      type="text"
                      {...register('vehicleNumber', {
                        required: 'Vehicle number is required',
                        pattern: {
                          value: /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/i,
                          message: 'Please enter a valid vehicle number (e.g., MH01AB1234)',
                        },
                      })}
                      placeholder="e.g., MH01AB1234"
                      className={`${inputClass} uppercase`}
                      onChange={(e) => setValue('vehicleNumber', e.target.value.toUpperCase())}
                    />
                    {errors.vehicleNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.vehicleNumber.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-b border-gray-200 pb-6">
                <h3 className={sectionTitleClass}>Document Uploads</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Card File *</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, setAadharFile)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:border-blue-200 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {aadharFile && <p className="mt-2 text-sm text-green-600">{aadharFile.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PAN Card File *</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, setPanFile)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:border-blue-200 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {panFile && <p className="mt-2 text-sm text-green-600">{panFile.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Driver License File *</label>
                    <div className="flex gap-2">
                      <label className="flex-1 cursor-pointer text-center px-4 py-2 border rounded-md bg-white hover:bg-gray-50">
                        <Upload className="h-4 w-4 inline mr-2" />
                        Upload
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileChange(e, setLicenseFile)}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => startCamera(setLicenseFile)}
                        className="flex-1 px-4 py-2 border rounded-md bg-white hover:bg-gray-50"
                      >
                        <Camera className="h-4 w-4 inline mr-2" />
                        Camera
                      </button>
                    </div>
                    {licenseFile && <p className="mt-2 text-sm text-green-600">{licenseFile.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RC Book File *</label>
                    <div className="flex gap-2">
                      <label className="flex-1 cursor-pointer text-center px-4 py-2 border rounded-md bg-white hover:bg-gray-50">
                        <Upload className="h-4 w-4 inline mr-2" />
                        Upload
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileChange(e, setRcBookFile)}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => startCamera(setRcBookFile)}
                        className="flex-1 px-4 py-2 border rounded-md bg-white hover:bg-gray-50"
                      >
                        <Camera className="h-4 w-4 inline mr-2" />
                        Camera
                      </button>
                    </div>
                    {rcBookFile && <p className="mt-2 text-sm text-green-600">{rcBookFile.name}</p>}
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Photos * (up to 6)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleVehiclePhotos}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:border-blue-200 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {vehiclePhotos.length > 0 && (
                    <p className="mt-2 text-sm text-green-600">{vehiclePhotos.length} vehicle photo(s) selected</p>
                  )}
                </div>
              </div>

              <div className="border-b border-gray-200 pb-6">
                <h3 className={sectionTitleClass}>Confirmation</h3>
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    {...register('agreeToTerms', {
                      required: 'You must accept the terms and conditions',
                    })}
                    className="mt-1"
                  />
                  <span className="text-sm text-gray-700">
                    I confirm that the information and uploaded documents are correct, and I agree to the
                    registration terms.
                  </span>
                </label>
                {errors.agreeToTerms && (
                  <p className="mt-2 text-sm text-red-600">{errors.agreeToTerms.message}</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
                >
                  Continue to Step 2
                </button>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <DriverAgreementStep
                register={register}
                errors={errors}
                watch={watch}
                companyName={COMPANY_NAME}
                companyAddress={COMPANY_ADDRESS}
                companySignerName={COMPANY_SIGNER_NAME}
                companySignerDesignation={COMPANY_SIGNER_DESIGNATION}
                fullName={fullName}
              />

              <div className="flex flex-col sm:flex-row gap-3 justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
                >
                  Back to Step 1
                </button>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700"
                >
                  Submit Registration
                </button>
              </div>
            </>
          )}
        </form>

        {showCamera && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-4 max-w-lg w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Capture Document</h3>
                <button onClick={stopCamera} type="button">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {cameraError ? (
                <p className="text-red-600 text-sm">{cameraError}</p>
              ) : (
                <>
                  <video ref={videoRef} className="w-full rounded-lg bg-black" autoPlay playsInline muted />
                  <div className="mt-4 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-4 py-2 border rounded-md text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={captureImage}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md"
                    >
                      Capture
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {showSuccessModal && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
              <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Registration Submitted</h3>
              <p className="text-gray-600 mb-4">
                Your driver registration and agreement have been submitted successfully.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Please verify your email first. Your account will remain pending until reviewed by admin.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
                >
                  Go to Login
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
                >
                  Go to Home
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScrollToTop(DriverSignup);