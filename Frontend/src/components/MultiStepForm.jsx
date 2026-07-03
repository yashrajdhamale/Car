import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import { CalendarDays, UserRound, Baby, Sigma } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
  Button,
  Stepper,
  Step,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Timeline,
  TimelineItem,
  TimelineIcon,
  TimelineHeader,
  Popover
} from "@material-tailwind/react";
import { CogIcon, UserIcon, BuildingLibraryIcon, ChevronRightIcon, ChevronLeftIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { addDays, format } from "date-fns";
import { DayPicker } from "react-day-picker";
import 'react-day-picker/dist/style.css';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from 'firebase/firestore';
import { db, storage } from '@config/firebase';
import Invoice from '../holiday/Invoice';

import './multistep.css';

const MultiStepForm = ({ selectLocationData }) => {
  const navigate = useNavigate();
  const todayDate = new Date();

  const [date, setDate] = useState(null);
  const [datePick, setDatePick] = useState(null);
  const [dateDrop, setDateDrop] = useState(null);

  const [activeStep, setActiveStep] = useState(0);
  const [isLastStep, setIsLastStep] = useState(false);
  const [isFirstStep, setIsFirstStep] = useState(true);

  const [userData, setUserData] = useState({ userUPIID: '', transactionId: '' });
  const [FileUploadUrl, setFileUploadUrl] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneno: '',
    phoneno2: '',
    upi_id: '',
    transaction_id: '',
    guest_count: [0, 0],
    invoice_no: "20200669",
    booking_id: "25645321",
    booking_date: format(todayDate, "MM/dd/yyyy"),
    holiday_name: selectLocationData?.selectLocationData?.package_name || '',
    holiday_price: selectLocationData?.selectLocationData?.selectedplan?.Price || 0,
    final_amount: selectLocationData?.selectLocationData?.selectedplan?.Price || 0
  });

  const contentRef = useRef(null);

  // Generate random filename for Firebase storage
  const generateRandomName = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomName = '';
    for (let i = 0; i < 12; i++) {
      randomName += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return randomName;
  };

  const uploadImageToFirebaseStorage = async (file) => {
    const randomName = generateRandomName();
    const storageRef = ref(storage, `user_documents/image__${randomName}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const downloadURL = await uploadImageToFirebaseStorage(file);
      setFileUploadUrl(downloadURL);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChangeDate = (newDate, pickup, dropup) => {
    setDate(newDate);
    setDatePick(pickup);
    setDateDrop(dropup);
  };

  const validateStep1 = () => {
    if (!datePick || !dateDrop) {
      alert('Please select a valid pickup and drop date');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.upi_id || !formData.transaction_id) {
      alert('Please enter UPI ID and Transaction ID');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (activeStep === 0 && !validateStep1()) return;
    if (activeStep === 1 && !validateStep2()) return;

    setActiveStep(prev => prev + 1);
  };

  const handlePrev = () => setActiveStep(prev => Math.max(prev - 1, 0));

  const handleSubmit = async () => {
    try {
      const data = {
        ...formData,
        holidayID: selectLocationData.selectLocationData.location_id,
        selectedVechile: selectLocationData.selectLocationData.selectedplan,
        pickupDate: datePick,
        dropupDate: dateDrop,
        UserDocumnetLink: FileUploadUrl,
        submissionTime: format(new Date(), "MM/dd/yyyy"),
      };
      const docRef = await addDoc(collection(db, 'bookings'), data);
      console.log('Booking ID:', docRef.id);
      navigate('/bookingdone', { state: { formData: data } });
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };

  const steps = [
    <Step1Form
      formData={formData}
      handleChange={handleChange}
      date={date}
      dateDrop={dateDrop}
      handleChangeDate={handleChangeDate}
      selectLocationData={selectLocationData}
      handleFileUpload={handleFileUpload}
    />,
    <Step2Form
      formData={formData}
      handleChange={handleChange}
      pageData={{ price: formData.holiday_price, qrcode: '/qrCode.png' }}
    />,
    <Step3Form
      formData={formData}
      pageData={{ price: formData.holiday_price, packageName: formData.holiday_name }}
    />
  ];

  return (
    <Card className="w-full m-2 p-5 border-4 border-gray-200" style={{ background: 'white' }}>
      <CardHeader variant="gradient" className="w-full h-full m-0 px-5 pt-5 lg:px-20 pb-12 lg:pb-20 border-2 border-grey-300">
        <Stepper activeStep={activeStep} isLastStep={setIsLastStep} isFirstStep={setIsFirstStep}>
          <Step onClick={() => setActiveStep(0)}>
            <UserIcon className="h-5 w-5" />
            <Typography variant="h6" color={activeStep === 0 ? "blue-gray" : "gray"}>Step 1</Typography>
          </Step>
          <Step onClick={() => setActiveStep(1)}>
            <CogIcon className="h-5 w-5" />
            <Typography variant="h6" color={activeStep === 1 ? "blue-gray" : "gray"}>Step 2</Typography>
          </Step>
          <Step onClick={() => setActiveStep(2)}>
            <BuildingLibraryIcon className="h-5 w-5" />
            <Typography variant="h6" color={activeStep === 2 ? "blue-gray" : "gray"}>Step 3</Typography>
          </Step>
        </Stepper>
      </CardHeader>
      <CardBody className="px-0 lg:p-6 flex flex-col gap-4">{steps[activeStep]}</CardBody>
      <CardFooter className="flex justify-between">
        <Button onClick={handlePrev} disabled={isFirstStep}>Prev</Button>
        {isLastStep ? (
          <Button onClick={handleSubmit}>Submit</Button>
        ) : (
          <Button onClick={handleNext}>Next</Button>
        )}
      </CardFooter>
    </Card>
  );
};

/* ---------------- Step Forms ---------------- */

const Step1Form = ({ formData, handleChange, date, dateDrop, handleChangeDate, selectLocationData, handleFileUpload }) => {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(!open);
  const [highlightedDays, setHighlightedDays] = useState([]);
  const [showCutoff, setShowCutoff] = useState(false);

  const formatDate = (d) => `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;

  const handleSelectDate = (selectedDate) => {
    if (!selectedDate) return;
    const dropDate = addDays(selectedDate, selectLocationData.selectLocationData.duration[0]);
    handleChangeDate(selectedDate, formatDate(selectedDate), formatDate(dropDate));
    setHighlightedDays(Array.from({ length: 5 }, (_, i) => addDays(selectedDate, i + 1)));
    setShowCutoff((dropDate - new Date()) / (1000 * 60 * 60 * 24) <= 7);
  };

  return (
    <>
      <div className='flex flex-col gap-5'>
        <label>Name:</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} className="border p-2 rounded" />
        <label>Email:</label>
        <input type="text" name="email" value={formData.email} onChange={handleChange} className="border p-2 rounded" />
        <label>Phone No 1:</label>
        <input type="text" name="phoneno" value={formData.phoneno} onChange={handleChange} className="border p-2 rounded" />
        <label>Phone No 2:</label>
        <input type="text" name="phoneno2" value={formData.phoneno2} onChange={handleChange} className="border p-2 rounded" />
        <label>PickUp Date:</label>
        <input type="text" value={date ? format(date, "PPP") : "Choose a date"} readOnly onClick={handleOpen} className="border p-2 rounded cursor-pointer" />
        <label>DropUp Date:</label>
        <input type="text" value={dateDrop ? format(new Date(dateDrop), "PPP") : "Choose a date"} readOnly className="border p-2 rounded" />
        <label>Upload Government ID:</label>
        <input type="file" accept="image/*" onChange={handleFileUpload} />
      </div>

      <Dialog size="xs" open={open} handler={handleOpen}>
        <DialogHeader>Choose Pickup Date</DialogHeader>
        <DialogBody>
          <DayPicker mode="single" selected={date} onSelect={handleSelectDate} highlighted={highlightedDays} />
          {showCutoff && <p className="text-red-500 text-sm">*Booking is on request, confirmation in a few hours.</p>}
        </DialogBody>
        <DialogFooter>
          <Button variant="text" color="red" onClick={handleOpen}>Cancel</Button>
          <Button variant="gradient" color="green" onClick={handleOpen}>Confirm</Button>
        </DialogFooter>
      </Dialog>
    </>
  );
};

const Step2Form = ({ formData, handleChange, pageData }) => {
  return (
    <div className="flex flex-col lg:flex-row gap-5 items-center">
      <div className="flex flex-col gap-5">
        <label>Our UPI ID:</label>
        <input type="text" value="email.email@gmail.com" disabled className="border p-2 rounded" />
        <label>Your UPI ID:</label>
        <input type="text" name="upi_id" value={formData.upi_id} onChange={handleChange} className="border p-2 rounded" />
        <label>Transaction ID:</label>
        <input type="text" name="transaction_id" value={formData.transaction_id} onChange={handleChange} className="border p-2 rounded" />
        <label>Package Price: Rs. {pageData.price}</label>
      </div>
      <div>
        <img src={pageData.qrcode} alt="QR Code" />
      </div>
    </div>
  );
};

const Step3Form = ({ formData, pageData }) => {
  return (
    <div className="flex flex-col lg:flex-row gap-5">
      <div className="flex-1 text-black font-bold">
        <h2 className="text-2xl mb-4 text-center">Confirm Details</h2>
        <input type="text" value={`Package: ${pageData.packageName}`} disabled className="border p-2 rounded mb-2" />
        <input type="text" value={`Price: Rs. ${pageData.price}`} disabled className="border p-2 rounded mb-2" />
        <input type="text" value={`UPI ID: ${formData.upi_id}`} disabled className="border p-2 rounded mb-2" />
        <input type="text" value={`Transaction ID: ${formData.transaction_id}`} disabled className="border p-2 rounded mb-2" />
      </div>
      <Card className="flex-1 h-full">
        <CardBody>
          <h2 className="text-2xl mb-4 text-center">Instructions</h2>
          <ul className="list-disc ml-5">
            <li>We will verify and send you the final confirmation at the earliest.</li>
            <li>If the package is delayed for activation you can contact our support team.</li>
            <li>Your satisfaction is our priority. Contact support if needed.</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
};

export default MultiStepForm;
