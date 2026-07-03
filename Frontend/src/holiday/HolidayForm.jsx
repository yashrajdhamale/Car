import { Card } from '@material-tailwind/react';
import { ArrowRight, ChevronRight, Fingerprint, Home, MapPinned, Upload, MapPin, Car, BadgeCheck, Luggage } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, doc, addDoc, getDoc, serverTimestamp, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { findDriversForHoliday, sendHolidayRideRequests } from '../utils/holidayBooking';
import { db, storage } from '@config/firebase';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { CalendarDays, UserRound, Baby, Sigma } from 'lucide-react';
import { 
    CogIcon,
    UserIcon,
    BuildingLibraryIcon 
} from "@heroicons/react/24/outline";
import { PDFDownloadLink } from "@react-pdf/renderer";
import {
    Popover,
    PopoverHandler,
    PopoverContent,
    Button,
    Spinner,
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Timeline,
    TimelineItem,
    TimelineConnector,
    TimelineIcon,
    TimelineHeader,
} from "@material-tailwind/react";
import { addDays, format } from "date-fns";
import { DayPicker } from "react-day-picker";
import { ChevronRightIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import { ScrollToTop, TruncatedText } from '@components';
import 'react-day-picker/dist/style.css';
import '../assets/css/HolidayForm.css';

const HolidayForm = () => {
    // State management
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dataPrepared, setDataPrepared] = useState(false);
    const [selectLocationData, setSelectLocationData] = useState({});
    const [GuestCount, setGuestCount] = useState([1, 0]);
    const [date, setDate] = useState(null);
    const [datePick, setDatePick] = useState(null);
    const [dateDrop, setDateDrop] = useState(null);
    const [highlightedDays, setHighlightedDays] = useState([]);
    const [showCustomDropLocation, setShowCustomDropLocation] = useState(false);
    const [fileUploadUrl, setFileUploadUrl] = useState(null);
    const [fileUploadUrlPayment, setFileUploadUrlPayment] = useState(null);
    const [FilePreviewUrl, setFilePreviewUrl] = useState(null);
    const [FilePreviewUrlPayment, setFilePreviewUrlPayment] = useState(null);
    const [open, setOpen] = useState(false);
    const [ShowCutoff, setShowCutoff] = useState(false);
    const [buttonContent, setButtonContent] = useState('Submit Details');

    // Router hooks
    const location = useLocation();
    const navigate = useNavigate();
    const { state } = location;

    // Form handling
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({
        defaultValues: {
            message: null,
        }
    });

    // Format date as MM/DD/YYYY
    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    };

    // Handle date selection
    const handleSelectDate = (selectedDate) => {
        if (selectedDate) {
            setDate(selectedDate);
            const dropDate = new Date(selectedDate);
            dropDate.setDate(dropDate.getDate() + (selectLocationData.duration?.[0] || 1));
            
            setDatePick(formatDate(selectedDate));
            setDateDrop(formatDate(dropDate));
            
            // Set next 5 days
            const nextFiveDays = Array.from({ length: 5 }, (_, i) => addDays(selectedDate, i + 1));
            setHighlightedDays(nextFiveDays);
        }
    };

    // Handle file upload
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            setFileUploadUrl(file);
            setFilePreviewUrl(e.target.result);
        };
        reader.readAsDataURL(file);
    };

    // Upload image to Firebase Storage
    const uploadImageToFirebaseStorage = async (file, location) => {
        try {
            const storageRef = ref(storage, location);
            await uploadBytes(storageRef, file);
            return await getDownloadURL(storageRef);
        } catch (error) {
            console.error("Error uploading image:", error);
            throw error;
        }
    };

    // Function to get state from package data with improved detection
    const getStateFromPackage = (packageData) => {
        if (!packageData) return 'unknown';
        
        // Check if state is already in the package (root level)
        if (packageData.state) return packageData.state;
        
        // Check if state is in the location object
        if (packageData.location?.state) return packageData.location.state;
        
        // Check for common package name patterns
        const name = (packageData.name || '').toLowerCase();
        
        // Common destinations and their states
        const stateMappings = {
            // Kerala
            'munnar': 'Kerala',
            'alleppey': 'Kerala',
            'wayanad': 'Kerala',
            'thekkady': 'Kerala',
            'kovalam': 'Kerala',
            'kumarakom': 'Kerala',
            'varkala': 'Kerala',
            'kerala': 'Kerala',
            
            // Tamil Nadu
            'ooty': 'Tamil Nadu',
            'kodaikanal': 'Tamil Nadu',
            'kanyakumari': 'Tamil Nadu',
            'mahabalipuram': 'Tamil Nadu',
            'rameshwaram': 'Tamil Nadu',
            'tamil': 'Tamil Nadu',
            
            // Karnataka
            'coorg': 'Karnataka',
            'mysore': 'Karnataka',
            'hampi': 'Karnataka',
            'gokarna': 'Karnataka',
            'chikmagalur': 'Karnataka',
            'karnataka': 'Karnataka',
            'banglore': 'Karnataka',
            'bangalore': 'Karnataka',
            
            // Goa
            'goa': 'Goa',
            
            // Rajasthan
            'udaipur': 'Rajasthan',
            'jaipur': 'Rajasthan',
            'jodhpur': 'Rajasthan',
            'jaisalmer': 'Rajasthan',
            'rajasthan': 'Rajasthan',
            
            // Himachal Pradesh
            'manali': 'Himachal Pradesh',
            'shimla': 'Himachal Pradesh',
            'dharamshala': 'Himachal Pradesh',
            'spiti': 'Himachal Pradesh',
            'kullu': 'Himachal Pradesh',
            
            // Uttarakhand
            'rishikesh': 'Uttarakhand',
            'mussoorie': 'Uttarakhand',
            'nainital': 'Uttarakhand',
            'auli': 'Uttarakhand',
            'uttarakhand': 'Uttarakhand',
            'dehradun': 'Uttarakhand'
        };
        
        // Check if any of the known destinations are in the package name
        for (const [key, state] of Object.entries(stateMappings)) {
            if (name.includes(key)) {
                console.log(`Determined state '${state}' from package name: ${name}`);
                return state;
            }
        }
        
        // If we can't determine the state, log a warning and return 'unknown'
        console.warn('Could not determine state for package:', packageData);
        return 'unknown';
    };
    
    // Form submission handler
    const onSubmit = async (data) => {
        try {
            setButtonContent("Processing...");
            console.log('Form submission started with data:', data);
            
            // Debug: Log the complete structure of selectLocationData
            console.log('Current selectLocationData:', JSON.parse(JSON.stringify(selectLocationData || {})));
            console.log('selectLocationData keys:', Object.keys(selectLocationData || {}));
            
            // Check if we have valid location data
            let locationData = selectLocationData;
            
            // If no location data in state, try to get it from localStorage
            if (!locationData || Object.keys(locationData).length === 0) {
                console.log('No location data in state, checking localStorage...');
                const savedData = localStorage.getItem('holidayFormData');
                
                if (savedData) {
                    try {
                        const parsedData = JSON.parse(savedData);
                        console.log('Parsed localStorage data:', parsedData);
                        
                        if (parsedData.datasendLocation) {
                            locationData = parsedData.datasendLocation;
                            console.log('Setting location data from localStorage:', locationData);
                            setSelectLocationData(locationData);
                        } else if (parsedData.selectLocationData) {
                            // Handle case where data is stored with different property name
                            locationData = parsedData.selectLocationData;
                            console.log('Setting location data from localStorage (alt property):', locationData);
                            setSelectLocationData(locationData);
                        }
                    } catch (e) {
                        console.error('Error parsing saved data:', e);
                        throw new Error('Error loading saved location data');
                    }
                }
            }
            
            // If still no location data, show error and redirect
            if (!locationData || Object.keys(locationData).length === 0) {
                const errorMsg = 'No destination selected. Please select a destination first.';
                console.error(errorMsg);
                alert(errorMsg);
                navigate('/holidays');
                return;
            }
            
            console.log('Using location data:', locationData);

            const fileInput1 = document.querySelector('#PaymentID');
            const fileInput2 = document.querySelector('#govID');
            const hasFile1 = fileInput1?.files?.length > 0;
            const hasFile2 = fileInput2?.files?.length > 0;

            if (!hasFile1 && !hasFile2) {
                throw new Error('Please upload at least one file.');
            }

            if (!datePick) {
                throw new Error('Please select a pickup date.');
            }

            // Upload files
            let documentUrl, paymentUrl;
            try {
                documentUrl = hasFile1 
                    ? await uploadImageToFirebaseStorage(fileInput1.files[0], `documents/${Date.now()}`)
                    : null;
                
                paymentUrl = hasFile2 
                    ? await uploadImageToFirebaseStorage(fileInput2.files[0], `payments/${Date.now()}`)
                    : null;
            } catch (error) {
                console.error('Error uploading files:', error);
                throw new Error('Error uploading files. Please try again.');
            }

            // Get the state from location data or use the helper function
            const packageState = getStateFromPackage(locationData);
            console.log('Finding drivers for state:', packageState);
            
            let driverIds = [];
            if (packageState && packageState !== 'unknown') {
                try {
                    driverIds = await findDriversForHoliday(packageState);
                    console.log(`Found ${driverIds.length} available drivers for ${packageState}:`, driverIds);
                } catch (error) {
                    console.error('Error finding drivers:', error);
                    // Continue with empty driverIds to trigger manual assignment
                }
            } else {
                console.warn('No valid state found in package data, proceeding with manual assignment');
            }
            
            // Set driver status based on whether we found drivers
            const driverStatus = driverIds.length > 0 ? 'driver_assigned' : 'needs_manual_assignment';
            
            // Prepare form data with all necessary fields
            const formData = {
                ...data,
                documentUrl,
                paymentUrl,
                pickupDate: datePick,
                dropDate: dateDrop,
                guestCount: GuestCount,
                location: locationData,
                status: 'searching_driver',
                type: 'holiday',
                driverStatus: 'searching',
                state: packageState,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            
            // Add the booking to Firestore
            const docRef = await addDoc(collection(db, 'bookings'), formData);
            console.log('Booking created with ID:', docRef.id);
            
            // If we have drivers, send ride requests
            if (driverIds.length > 0) {
                try {
                    console.log('Sending ride requests to drivers:', driverIds);
                    await sendHolidayRideRequests({
                        ...formData,
                        bookingId: docRef.id,
                        state: packageState,
                        location: locationData,
                        guestCount: GuestCount,
                        pickupDate: datePick,
                        dropDate: dateDrop
                    }, driverIds);
                    console.log('Successfully sent ride requests');
                } catch (error) {
                    console.error('Error sending ride requests:', error);
                    // Continue with the booking even if sending requests fails
                }
            }
            
            // Create the package data for the booking confirmation page
            const packageData = {
                ...locationData,
                name: locationData.name || 'Holiday Package',
                price: locationData.price || '0',
                duration: locationData.duration || '3 Days / 2 Nights',
                state: packageState,
                location: {
                    ...(locationData.location || {}),
                    state: packageState
                },
                kmLimit: locationData.kmLimit || '300 km per day',
                itinerary: locationData.itinerary || []
            };
            
            // Navigate to booking confirmation page
            navigate('/booking-confirmation', { 
                state: { 
                    bookingId: docRef.id,
                    status: driverStatus === 'driver_assigned' ? 'pending' : 'pending_manual_assignment',
                    package: packageData,
                    message: driverStatus === 'driver_assigned' 
                        ? 'Your booking has been received and is being processed.'
                        : 'Your booking has been received and will be processed shortly.'
                } 
            });
            
        } catch (error) {
            console.error('Error in form submission:', error);
            alert(error.message || 'An error occurred while processing your booking. Please try again.');
        } finally {
            setButtonContent('Submit Booking');
        }
    };
    // End of onSubmit function

    // Load initial data
    useEffect(() => {
        console.log('Navigation State:', state);
        
        // Check if we have data in location state
        if (state?.datasendLocation) {
            console.log('Setting location data from navigation state:', state.datasendLocation);
            setSelectLocationData(state.datasendLocation);
            if (state.GuestCountDataSend) {
                console.log('Setting guest count from navigation state:', state.GuestCountDataSend);
                setGuestCount(state.GuestCountDataSend);
            }
            setIsLoading(false);
            return;
        }
        
        // Try to get data from localStorage if direct URL access
        const savedData = localStorage.getItem('holidayFormData');
        if (savedData) {
            try {
                const { datasendLocation, GuestCountDataSend } = JSON.parse(savedData);
                console.log('Setting location data from localStorage:', datasendLocation);
                if (datasendLocation) {
                    setSelectLocationData(datasendLocation);
                    if (GuestCountDataSend) {
                        console.log('Setting guest count from localStorage:', GuestCountDataSend);
                        setGuestCount(GuestCountDataSend);
                    }
                    setIsLoading(false);
                    return;
                }
            } catch (error) {
                console.error('Error parsing saved data:', error);
            }
        }
        
        // If no data found, show error and redirect
        console.error('No destination data found in navigation state or localStorage');
        setError('No destination selected. Please select a destination first.');
        setIsLoading(false);
        
        const timer = setTimeout(() => {
            console.log('Redirecting to /holidays');
            navigate('/holidays');
        }, 3000);
        
        return () => clearTimeout(timer);
    }, [state, navigate]);
    
    // Save data to localStorage when it changes
    useEffect(() => {
        if (selectLocationData && Object.keys(selectLocationData).length > 0) {
            localStorage.setItem('holidayFormData', JSON.stringify({
                datasendLocation: selectLocationData,
                GuestCountDataSend: GuestCount
            }));
        }
    }, [selectLocationData, GuestCount]);

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <Spinner className="h-12 w-12 text-blue-500" />
                <p className="mt-4 text-lg">Loading destination details...</p>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen p-4">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                    <p className="mt-2">Redirecting to holidays page...</p>
                </div>
            </div>
        );
    }

    // Main form render
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Book Your Holiday Package</h1>
                
                <Card className="p-6">
                    <h2 className="text-2xl font-semibold mb-6">
                        {selectLocationData.package_name || 'Holiday Package'}
                    </h2>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Personal Details Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Personal Information</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Full Name *
                                    </label>
                                    <input
                                        {...register('name', { required: 'Name is required' })}
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter your full name"
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        {...register('email', { 
                                            required: 'Email is required',
                                            pattern: {
                                                value: /\S+@\S+\.\S+/,
                                                message: 'Please enter a valid email address'
                                            }
                                        })}
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="your@email.com"
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone 1 *
                                    </label>
                                    <input
                                        type="tel"
                                        {...register('phone1', { 
                                            required: 'Phone number is required',
                                            pattern: {
                                                value: /^\d{10,}$/,
                                                message: 'Please enter a valid phone number'
                                            }
                                        })}
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter phone number"
                                    />
                                    {errors.phone1 && (
                                        <p className="mt-1 text-sm text-red-600">{errors.phone1.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone 2 *
                                    </label>
                                    <input
                                        type="tel"
                                        {...register('phone2', { 
                                            required: 'Secondary phone number is required',
                                            pattern: {
                                                value: /^\d{10,}$/,
                                                message: 'Please enter a valid phone number'
                                            },
                                            validate: value => 
                                                value !== watch('phone1') || 'Phone numbers must be different'
                                        })}
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter secondary phone number"
                                    />
                                    {errors.phone2 && (
                                        <p className="mt-1 text-sm text-red-600">{errors.phone2.message}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Document Upload Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Document Upload</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ID Proof *
                                    </label>
                                    <input
                                        type="file"
                                        id="govID"
                                        accept="image/*,.pdf"
                                        onChange={handleFileUpload}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    {FilePreviewUrl && (
                                        <div className="mt-2">
                                            <img 
                                                src={FilePreviewUrl} 
                                                alt="ID Proof Preview" 
                                                className="h-24 w-auto rounded border"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Payment Proof *
                                    </label>
                                    <input
                                        type="file"
                                        id="PaymentID"
                                        accept="image/*,.pdf"
                                        onChange={handleFileUpload}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    {FilePreviewUrlPayment && (
                                        <div className="mt-2">
                                            <img 
                                                src={FilePreviewUrlPayment} 
                                                alt="Payment Proof Preview" 
                                                className="h-24 w-auto rounded border"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Package Details Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Package Details</h3>
                            
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Package Name</p>
                                        <p className="font-medium">{selectLocationData.package_name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Duration</p>
                                        <p className="font-medium">
                                            {selectLocationData.duration ? 
                                                `${selectLocationData.duration[0]} Days / ${selectLocationData.duration[1]} Nights` : 
                                                'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Location</p>
                                        <p className="font-medium">{selectLocationData.location || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Guests</p>
                                        <p className="font-medium">
                                            {GuestCount ? 
                                                `${GuestCount[0]} Adults, ${GuestCount[1] || 0} Children` : 
                                                'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Date Selection */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Select Dates</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Pickup Date *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setOpen(true)}
                                        className="w-full px-3 py-2 border rounded-md text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {datePick || 'Select date'}
                                    </button>
                                    <input type="hidden" {...register('pickupDate', { required: 'Pickup date is required' })} value={datePick || ''} />
                                    {errors.pickupDate && (
                                        <p className="mt-1 text-sm text-red-600">{errors.pickupDate.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Drop-off Date
                                    </label>
                                    <div className="px-3 py-2 border rounded-md bg-gray-50">
                                        {dateDrop || 'Will be calculated based on duration'}
                                    </div>
                                </div>
                            </div>

                            {/* Date Picker Dialog */}
                            <Dialog open={open} handler={() => setOpen(!open)}>
                                <DialogHeader>Select Pickup Date</DialogHeader>
                                <DialogBody>
                                    <DayPicker
                                        mode="single"
                                        selected={date}
                                        onSelect={handleSelectDate}
                                        disabled={isDayDisabled}
                                        modifiers={{
                                            highlighted: highlightedDays
                                        }}
                                        modifiersClassNames={{
                                            selected: 'bg-blue-500 text-white',
                                            highlighted: 'bg-yellow-100',
                                            disabled: 'text-gray-300'
                                        }}
                                    />
                                </DialogBody>
                                <DialogFooter>
                                    <Button variant="text" color="red" onClick={() => setOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button variant="gradient" color="green" onClick={() => setOpen(false)}>
                                        Confirm
                                    </Button>
                                </DialogFooter>
                            </Dialog>
                        </div>

                        {/* Pickup Details Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Pickup Details</h3>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Pickup Address *
                                </label>
                                <textarea
                                    {...register('pickupAddress', { required: 'Pickup address is required' })}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="2"
                                    placeholder="Enter your pickup address"
                                />
                                {errors.pickupAddress && (
                                    <p className="mt-1 text-sm text-red-600">{errors.pickupAddress.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Pickup Time *
                                </label>
                                <input
                                    type="time"
                                    {...register('pickupTime', { required: 'Pickup time is required' })}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {errors.pickupTime && (
                                    <p className="mt-1 text-sm text-red-600">{errors.pickupTime.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Payment Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Payment Information</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        UPI ID *
                                    </label>
                                    <input
                                        type="text"
                                        {...register('upiId', { required: 'UPI ID is required' })}
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="yourname@upi"
                                    />
                                    {errors.upiId && (
                                        <p className="mt-1 text-sm text-red-600">{errors.upiId.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Transaction ID *
                                    </label>
                                    <input
                                        type="text"
                                        {...register('transactionId', { 
                                            required: 'Transaction ID is required' 
                                        })}
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter transaction ID"
                                    />
                                    {errors.transactionId && (
                                        <p className="mt-1 text-sm text-red-600">{errors.transactionId.message}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Terms and Conditions */}
                        <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input
                                    id="terms"
                                    type="checkbox"
                                    {...register('terms', { 
                                        required: 'You must accept the terms and conditions' 
                                    })}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="terms" className="font-medium text-gray-700">
                                    I agree to the <a href="/terms" className="text-blue-600 hover:underline">Terms and Conditions</a> and <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
                                </label>
                                {errors.terms && (
                                    <p className="mt-1 text-sm text-red-600">{errors.terms.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={buttonContent === 'Processing...'}
                                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${buttonContent === 'Processing...' ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {buttonContent === 'Processing...' ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    'Submit Booking'
                                )}
                            </button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default ScrollToTop(HolidayForm);
