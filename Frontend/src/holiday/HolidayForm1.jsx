import { Card } from '@material-tailwind/react'
import { ArrowRight, ChevronRight, Fingerprint, Home, MapPinned, Upload, MapPin, Car, BadgeCheck, Luggage } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, doc, addDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { findDriversForHoliday, sendHolidayRideRequests } from '../utils/holidayBooking';
import { db, storage } from '@config/firebase';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { CalendarDays, UserRound, Baby, Sigma } from 'lucide-react'
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
} from "@material-tailwind/react";
import { addDays, format } from "date-fns";
import { DayPicker } from "react-day-picker";
import { ChevronRightIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import { ScrollToTop, TruncatedText } from '@components';

import 'react-day-picker/dist/style.css';
import { SpinnerComponent } from '@components'
import { Spinner } from "@material-tailwind/react";

import {
    BellIcon,
    ArchiveBoxIcon, MinusCircleIcon,
    CurrencyDollarIcon, ClockIcon, WalletIcon, CircleStackIcon, BookOpenIcon, ForwardIcon, ClipboardDocumentListIcon
} from "@heroicons/react/24/solid";

import {
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

import '../assets/css/HolidayForm.css';


import img4 from '@assetsImages/bg4-holidayfrom.jpg';
import img5 from '@assetsImages/bg5-holidayfrom.jpg';
// import { truncateText } from '../functions/truncateText.js';

const HolidayForm = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const formattedDate = mm + '/' + dd + '/' + yyyy;

    const [dataPrepared, setDataPrepared] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const location = useLocation();
    const { state } = location;
    const navigate = useNavigate();

    // State for form data with proper initialization
    const [selectLocationData, setSelectLocationData] = useState({});
    const [GuestCount, setGuestCount] = useState([1, 0]); // Default to 1 adult, 0 children

    // Handle direct URL access or missing state
    useEffect(() => {
        if (!state?.datasendLocation) {
            console.error('No location data found in navigation state');
            setError('No destination selected. Please select a destination first.');
            setIsLoading(false);
            // Optional: Redirect after a delay
            const timer = setTimeout(() => {
                navigate('/holidays');
            }, 3000);
            return () => clearTimeout(timer);
        } else {
            setSelectLocationData(state.datasendLocation);
            if (state.GuestCountDataSend) {
                setGuestCount(state.GuestCountDataSend);

    const params = useParams();
    // const [packagenameparams, setpackagename] = useState('');

    // useEffect(() => {
    //     const { packagenamep } = params;

    //     if (packagenamep) {
    //         console.log('Parameter from URL:', packagenamep);
    //         setpackagename(packagenamep);
    //     }
    // }, [params]);


    // useEffect(() => {
    //     if (state.GuestCountDataSend != undefined) {
    //         GuestCount = state && state.GuestCountDataSend;
    //     } else {
    //         GuestCount[0] = 1;
    //         GuestCount[1] = 0;
    //     }
    // }, []);

    console.log("GuestCount= ", GuestCount);
    console.log(selectLocationData);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({

        defaultValues: {
            message: null,
        }
    })

    const [DataSubmitted, setDataSubmitted] = useState(false);

    const [showCustomDropLocation, setShowCustomDropLocation] = useState(false);
    const [fileUploadUrl, setFileUploadUrl] = useState(null);
    const [fileUploadUrlPayment, setFileUploadUrlPayment] = useState(null);

    const [FilePreviewUrl, setFilePreviewUrl] = useState(null);
    const [FilePreviewUrlPayment, setFilePreviewUrlPayment] = useState(null);

    const handleDropLocationChange = (event) => {
        setShowCustomDropLocation(event.target.value === 'Other drop location');
    };

    const generateRandomName = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let randomName = '';
        for (let i = 0; i < 12; i++) {
            randomName += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return randomName;
    };


    const uploadImageToFirebaseStorage = async (file, location) => {
        try {
            // const randomName = generateRandomName();
            const storageRef = ref(storage, location);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            return downloadURL;
        } catch (error) {
            console.error("Error uploading image to Firebase Storage: ", error);
            throw error;
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = (e) => {
            // Set the file preview URL
            setFileUploadUrl(file);
            setFilePreviewUrl(e.target.result);
        };

        if (file) {
            reader.readAsDataURL(file); // Read the file as a data URL
        }
    };

    const handleFileUploadPayment = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = (e) => {
            // Set the file preview URL
            setFileUploadUrlPayment(file);
            setFilePreviewUrlPayment(e.target.result);

        };

        if (file) {
            reader.readAsDataURL(file); // Read the file as a data URL
        }
    };



    const validationRules = {
        name: {
            required: 'Name is required',
            minLength: {
                value: 10,
                message: 'Name must be at least 10 characters long',
            }
        },
        email: {
            required: 'Email is required',
            pattern: {
                value: /\S+@\S+\.\S+/,
                message: 'Invalid email address',
            }
        },
        phone1: {
            required: 'Phone 1 is required',
            pattern: {
                value: /^\d{10,}$/,
                message: 'Phone must be at least 10 digits',
            }
        },
        phone2: {
            required: 'Phone 2 is required',
            pattern: {
                value: /^\d{10,}$/,
                message: 'Phone must be at least 10 digits',
            },
            validate: {
                notEqualToPhone1: value => value !== watch('phone1') || 'Phone 2 should be different from Phone 1',
            }
        },
        pickupLocation: {
            required: 'Pickup location is required'
        },
        pickupDate: {
            required: 'Pickup date is required'
        },
        pickupTime: {
            required: 'Pickup time is required'
        },
        dropLocation: {
            required: 'Drop location is required'
        },
        upiid: {
            required: 'UPI ID  is required'
        },
        transactionid: {
            required: 'Transactionid ID  is required'
        },
        pickupAdress: {
            required: 'pickupAdress  is required'
        },
        customDropLocation: {
            required: showCustomDropLocation ? 'Custom drop location is required' : ''
        }
    };

    const [ButtonContent, setButtonContent] = useState('Submit Details')


    const verifyDuplicateRecords = async () => {



        try {
            const q = query(collection(db, "bookigs"), where("transactionid", "==", packagename));
            const querySnapshot = await getDocs(q);
            const locations = [];
            querySnapshot.forEach((doc) => {
                locations.push({ location_id: doc.id, ...doc.data() });
            });

            console.log("MAIN DATA", locations[0]);


        } catch (error) {
            console.error('Error fetching data:', error);



        }
    }




    const onSubmit = async (data) => {

        try {

            const fileInput1 = document.querySelector('#PaymentID');
            const fileInput2 = document.querySelector('#govID');
            const hasFile1 = fileInput1.files.length > 0;
            const hasFile2 = fileInput2.files.length > 0;



            setTimeout(() => {
                window.scrollTo({
                    top: window.innerHeight / 1.2, // Scroll to half of the viewport height
                    behavior: 'smooth' // Smooth scrolling transition
                });
            }, 100); // Adjust the delay as needed



            // setformData(prevFormData => ({
            //     ...prevFormData,  // Spread the existing fields
            //     RegNumber1: generateRegName(selectLocationData.package_name)  // Add the new field
            // }));




            if (!hasFile1 && !hasFile2) {
                alert("Please select a file to upload.");
                return false; // Prevent form submission if no file is uploaded
            }

            if (datePick == null) {
                alert("Please select a PickUp Date.");
                return false;
            }

            setButtonContent("Submiting Details ...");

            // UPLOAD GOV DOCUMNET-ID PROOF ON FIREBASE
            const randomName = generateRandomName();
            const DocumentProof = `user_documents/image_${randomName}`
            const downloadURL = await uploadImageToFirebaseStorage(fileUploadUrl, DocumentProof);
            console.log('downloadURL = ', downloadURL);

            // UPLOAD PAYMENT PROOF PROOF ON FIREBASE
            const randomNamePayment = generateRandomName();
            const PaymentProof = `user_payment/image_${randomNamePayment}`
            const downloadURLPayment = await uploadImageToFirebaseStorage(fileUploadUrlPayment, PaymentProof);
            console.log('downloadURLPayment = ', downloadURLPayment);


            const formData = {
                ...data,
                DocumentProofUrl: downloadURL,
                PaymentProof: downloadURLPayment,
                PickUpDate: datePick,
                DropUpDate: dateDrop,
                GuestCountData: GuestCount,
                LocationData: selectLocationData,
                apporval: "pending",
                BookedDate: formattedDate,
                RegNumber1: generateRegName(selectLocationData.package_name),
                OnRequest: ShowCutoff,
            };

            console.log('finaldata = ', formData);

            // const docRef = await addDoc(collection(db, 'taxibooking'), formData);




            let send_Data = {
                selectLocationData: selectLocationData,
                formData: formData,
            };

            console.log('send_Data = ', send_Data);

            addDoc(collection(db, 'bookings'), formData)
                .then((docRef) => {
                    console.log('Document written with ID: ', docRef.id);


                    setTimeout(() => {
                        // navigate('/bookingdone', { state: { send_Data } });

                        navigate('/pdf', { state: { send_Data, flag: "1" } });
                    }, 1000);

                })
                .catch((error) => {
                    console.error('Error adding document: ', error);
                });


        } catch (error) {
            console.error("Error adding document: ", error);
        }
    };



    // 1
    const [date, setDate] = useState(null);

    const [datePick, setDatePick] = useState(null); // Set default selected date to 8th day from today
    const [dateDrop, setDateDrop] = useState(null); // Set default selected date to 8th day from today


    const handleChangeDate = (newDate, pickup, dropup) => {
        setDate(newDate);
        // setDatePick(`${monthh}/${dayy}/${yearr}`);

        // const dropup_day = Number(dayy) + Number(selectLocationData.duration[0]);
        // setDateDrop(`${monthh}/${dropup_day}/${yearr}`);
        console.log("handleChangeDate", pickup, dropup);
        setDatePick(pickup);
        setDateDrop(dropup);
        // console.log(dropup_day);
    };



    function getRandomNumberBetween4And9() {
        return Math.floor(Math.random() * (10 - 4)) + 4;
    }

    function generateRegName(packageName) {
        // Get the current date
        const currentDate = new Date();

        // Get the current month and year
        const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUNE", "JULY", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const currentMonth = monthNames[currentDate.getMonth()];
        const currentYear = currentDate.getFullYear();

        // Generate a random 4-character string
        const randomString = Math.random().toString(36).substring(2, getRandomNumberBetween4And9()).toUpperCase();

        // Format the final string
        const formattedString = `${'HL'}/${currentMonth}-${currentYear}/${randomString}`;

        return formattedString;
    }





    const [formData, setformData] = useState({
        name: 'prayag',
        email: 'pp@gmail.com',
        phoneno: '9079574578',
        phoneno2: '9079574578',
        upi_id: 'pp@oksbi',
        transaction_id: 'u28ec82cn8-8cu9cuu9c',
        guest_count: [0, 0],
        invoice_no: "20200669",
        booking_id: "25645321",
        booking_date: formattedDate,
        holiday_name: "3 Days not 3 nights",
        holiday_price: 179.25,
        final_amount: 209.15,
    });






    // 2

    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(!open);


    const [DatePicked, setDatePicked] = useState(new Date());




    const daysDuration = selectLocationData.duration[0];
    // console.log(date);
    // const [DropUpDate, setDateDropUp] = useState(addDays(date, (7 + selectLocationData.duration[0])));
    const [DropUpDate, setDateDropUp] = useState(null);

    const formatDate = (date) => {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    };

    // setDateDrop(formatDate(DropUpDate));
    // setDatePick(formatDate(date));

    const [selectedDay, setSelectedDay] = useState(new Date());

    const footer = selectedDay ? (
        <p>You selected {format(selectedDay, 'PPP')}.</p>
    ) : (
        <p>Please pick a day.</p>
    );



    const [highlightedDays, setHighlightedDays] = useState([]);

    const [ShowCutoff, setShowCutoff] = useState(false);
    const [ShowNumberCutoff, setShowNumberCutoff] = useState(7);




    const [QRCode, setQRCode] = useState("https://media.istockphoto.com/id/1222357475/vector/image-preview-icon-picture-placeholder-for-website-or-ui-ux-design-vector-illustration.jpg?s=612x612&w=0&k=20&c=KuCo-dRBYV7nz2gbk4J9w1WtTAgpTdznHu55W9FjimE=");

    const fetchDocumentData = async () => {
        try {
            const docRef = doc(db, "users", "WIsJf0LjU8DKG23GiXhC");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                console.log("Document data:", docSnap.data());

                const QrCode = docSnap.data().qrcode_holidays;
                const Cutoff = docSnap.data().cutoffDate_Holidays;
                // console.log("DATA", QrCode);
                setQRCode(QrCode);
                setShowNumberCutoff(Cutoff);
                // return { id: docSnap.id, data: docSnap.data() };
                // return { id: docSnap.id, data: docSnap.data() };
            } else {
                console.log("No such document!");
                return null;
            }
        } catch (error) {
            console.error("Error fetching document:", error);
            throw error;
        }
    };


    // Function to check if a day should be disabled
    const isDayDisabled = (day) => {
        const today = new Date();
        // const sevenDaysFromToday = addDays(today, 6);
        // return day <= today || (day >= today && day <= sevenDaysFromToday);
        // return day < today;
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1); // Get yesterday's date

        // Disable if the day is before yesterday
        return day < yesterday;
    };

    // Function to handle date selection
    const handleSelectDate = (selectedDate) => {
        console.log(selectedDate);
        // Check if the selected date is not disabled
        if (!isDayDisabled(selectedDate)) {
            // Set the selected date
            // setDate(selectedDate);




            // Convert selected date to a Date object
            const selectedDateObj = new Date(selectedDate);

            // Get today's date
            const today = new Date();

            // Calculate the difference in milliseconds between the selected date and today's date
            const differenceInMs = selectedDateObj.getTime() - today.getTime();

            // Convert the difference to days
            const differenceInDays = Math.ceil(differenceInMs / (1000 * 60 * 60 * 24));

            // Check if the difference is less than or equal to 7 days
            // const isWithin7Days = differenceInDays <= 7;
            const isWithin7Days = differenceInDays < ShowNumberCutoff;

            console.log(isWithin7Days);

            // Set showcutoff based on whether the selected date is within 7 days from today
            setShowCutoff(isWithin7Days);







            console.log("selectedDate = ", selectLocationData.duration[0]);


            const dropDate = new Date(selectedDate);



            dropDate.setDate(dropDate.getDate() + (selectLocationData.duration[0] + selectLocationData.duration[1]));
            setDateDropUp(selectedDate + (selectLocationData.duration[0]));

            // Format both pickup date and drop date to mm/dd/yyyy format
            const formattedPickupDate = formatDate(selectedDate);
            const formattedDropDate = formatDate(dropDate);

            console.log("Pickup Date:", formattedPickupDate);
            console.log("Drop Date:", formattedDropDate);



            // const today = new Date();
            // const formattedDate = `${selectedDate.getMonth() + 1}/${selectedDate.getDate()}/${selectedDate.getFullYear()}`;
            // console.log(formattedDate);


            // handleChangeDate(selectedDate, selectedDate.getMonth() + 1, selectedDate.getDate(), selectedDate.getFullYear());
            handleChangeDate(selectedDate, formattedPickupDate, formattedDropDate);

            // Get the next 5 days from the selected date
            const nextFiveDays = Array.from({ length: 5 }, (_, i) =>
                addDays(selectedDate, i + 1)
            );

            // Store the next 5 days in state
            setHighlightedDays(nextFiveDays);


        }
    };

    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const images = [img3, img5
        // "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7",
        // "https://plus.unsplash.com/premium_photo-1661920471538-d4b17c13f74b",
        // "https://plus.unsplash.com/premium_photo-1697729438401-fcb4ff66d9a8",
        // "https://images.unsplash.com/photo-1566371486490-560ded23b5e4",
        // "https://images.unsplash.com/photo-1517984211099-444b8decd034",
    ];


    // const preloadImages = () => {
    //     images.forEach(imageUrl => {
    //         const img = new Image();
    //         img.src = imageUrl;
    //     });
    // };


    // useEffect(() => {
    //     preloadImages();
    // }, []);





    useEffect(() => {
        // const intervalId = setInterval(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        fetchDocumentData();
        // }, 5000);

        // return () => clearInterval(intervalId);
    }, []);




    const demo = () => {

        window.scrollTo({
            top: window.innerHeight / 1.5, // Scroll to half of the viewport height
            behavior: 'smooth' // Smooth scrolling transition
        });


        let send_Data = {
            "selectLocationData": {
                "location_id": "3euhrdvECmZnJV6KN3Qu",
                "package_name": "Munnar Weekend Break",
                "km_limit": "450",
                "itenary": [
                    {
                        "description": "On arrival at Amritsar Airport, drive to Dalhousie ( Approximately 5 Hours ) . Dalhousie is a high-altitude town spread across 5 hills near the Dhauladhar mountain range in the north Indian state of Himachal Pradesh. Rich in Colonial Architecture ,with beautul churches ,Tibetan culture.",
                        "header": "Day 1: Amritsar to Dalhousie :"
                    },
                    {
                        "header": "Day 2 : Dalhousie :",
                        "description": "On arrival at Dalhousie, check inn to hotel. Later proceed for local sightseeing . Visit to khajjiar Valley , Chamera Lake etc.    Also visit to Daikund Hill Top, Kalatop Khajjiar Sanctuary ,Chamba Jot ,visit Punjpula Waterfall, Sathdhara Fall  Bhulwani Mata Temple, Bhalei  Temple ,Mall Road, St. Patrick’s church etc. Later back to hotel for overnight stay."
                    },
                    {
                        "description": "In the morning, check out from hotel and drive through beautiful valley to Dharamshala. (Approximately 120 km. / 2. 30 hours). On the way enjoy a picturistic mountains views and take breaks in between for beautiful photos.  Later reach to Dharamshala. Dharamshala is a city in the Indian state of Himachal Pradesh. Surrounded by cedar forests on the edge of the Himalayas, this hillside city is home to the Dalai Lama and the Tibetan government-in-exile. The Thekchen Chöling Temple Complex is a spiritual center for Tibetan Buddhism, while the Library of Tibetan Works and Archives houses thousands of precious manuscripts. Overnight stay in Dharamshala.",
                        "header": "Day 3: Dalhousie To Dharamshala :"
                    },
                    {
                        "description": "In the morning get ready to visit the Tsuglagkhang Complex Dalai Lama Temple, HPCA Cricket Stadium, Gyuto Monastery, Naddi View Point. Visit to one of most beautiful Kangra Valley, Kalachakra Temple, Tibetan Museum, Chamunda Nandikeshwar Temple and McLeod Ganj . It is known as \"Little Lhasa\" or \"Dhasa\" as the Tibetan government-in-exile is headquartered here and there is a significant population of Tibetans in the region.",
                        "header": "Day 4 : Dharamshala :"
                    },
                    {
                        "header": "Day 5 : Dharamshala To Manali :",
                        "description": "In the morning, check out from hotel and drive to Manali. (Approximately 110 km. / 2.30 hours ) . On the way visit to beautiful river views and Himalaya’s mountain ranges."
                    },
                    {
                        "description": "Beyond the beautiful Chandra Khani Pass lies an unique village Malana which is famous for its distinct culture and the temple of Jamlu devta. ((Breakfast+Dinner) . Later in the evening, go for a jaunt along the Mall Road to shop, eat and enjoy the pleasant weather.Overnight stay in Manali Hotel.",
                        "header": "Day 6 : Manali :"
                    },
                    {
                        "description": "After breakfast, you can go on a sightseeing tour of Manali to visit its prominent attractions. You may start your tour with a visit to the famous Hadimba Temple. This shrine is dedicated to Goddess Hidimba, who was the wife of Bhima, a mythological character from the great Hindu epic – Mahabharata. Set amidst a lush green deodar forest, this temple has an exquisite structure, with its doorway featuring carvings of symbols and legendary figures. Built in AD 1533, this temple has a pagoda-shaped four-tiered roof. Thereafter, visit the Vashist village, which is popular for its hot water springs and several revered shrines. Another must-visit place at this destination is Nehru Kund, which is named after the first Prime Minister of India – Pandit Jawaharlal Nehru.  Later, back to hotel for overnight stay.",
                        "header": "Day 7 : Manali: "
                    },
                    {
                        "description": "In the morning, check out from hotel and drive to Mandi. (Approximately 125 km. / 4 hours ). Lord Shiva as the main deity of Bhootnath, Trilokinath, Panchvaktra and other important temples has ordained Mandi as the 'Varanasi of the Hills' as 'Choti Kashi'. For its temple architecture, old palace and rich traditions, Mandi is so often considered as the cultural capital of the state.     In mandi visit the beautiful places like Prashar Lake , Bada Dev - Kamrunag Temple, Panchvaktra Temple, Rewalsar Lake, Baba Bhootnath Mandir, Sunken Garden, Clock Tower. Etc. Later drive to Kasauli for Overnight stay.",
                        "header": "Day 8 : Manali - Mandi – Kasauli : "
                    },
                    {
                        "header": "Day 9 : Kasauli : ",
                        "description": "After having breakfast, visit to Monkey Point, Timber Trail Cable ride, beautiful Kasauli Sunset Point etc.       Overnight stay in Kasauli."
                    },
                    {
                        "header": "Day 10 : Kasauli –Chandigarh :",
                        "description": "In the morning, check out from the hotel and drive to Chandigarh. On arrival visit to Rose Garden,Rock Garden, Sukhna Lake, Chhatbir Zoo etc    . Later drop to Airport."
                    }
                ],
                "itinerary": [
                    {
                        "header": "Day 1: Amritsar to Dalhousie :",
                        "description": "On arrival at Amritsar Airport, drive to Dalhousie ( Approximately 5 Hours ) . Dalhousie is a high-altitude town spread across 5 hills near the Dhauladhar mountain range in the north Indian state of Himachal Pradesh. Rich in Colonial Architecture ,with beautul churches ,Tibetan culture.1111"
                    },
                    {
                        "header": "Day 2 : Dalhousie :",
                        "description": "On arrival at Dalhousie, check inn to hotel. Later proceed for local sightseeing . Visit to khajjiar Valley , Chamera Lake etc.    Also visit to Daikund Hill Top, Kalatop Khajjiar Sanctuary ,Chamba Jot ,visit Punjpula Waterfall, Sathdhara Fall  Bhulwani Mata Temple, Bhalei  Temple ,Mall Road, St. Patrick’s church etc. Later back to hotel for overnight stay."
                    },
                    {
                        "description": "In the morning, check out from hotel and drive through beautiful valley to Dharamshala. (Approximately 120 km. / 2. 30 hours). On the way enjoy a picturistic mountains views and take breaks in between for beautiful photos.  Later reach to Dharamshala. Dharamshala is a city in the Indian state of Himachal Pradesh. Surrounded by cedar forests on the edge of the Himalayas, this hillside city is home to the Dalai Lama and the Tibetan government-in-exile. The Thekchen Chöling Temple Complex is a spiritual center for Tibetan Buddhism, while the Library of Tibetan Works and Archives houses thousands of precious manuscripts. Overnight stay in Dharamshala.",
                        "header": "Day 3: Dalhousie To Dharamshala :"
                    },
                    {
                        "description": "In the morning get ready to visit the Tsuglagkhang Complex Dalai Lama Temple, HPCA Cricket Stadium, Gyuto Monastery, Naddi View Point. Visit to one of most beautiful Kangra Valley, Kalachakra Temple, Tibetan Museum, Chamunda Nandikeshwar Temple and McLeod Ganj . It is known as \"Little Lhasa\" or \"Dhasa\" as the Tibetan government-in-exile is headquartered here and there is a significant population of Tibetans in the region.",
                        "header": "Day 4 : Dharamshala :"
                    },
                    {
                        "description": "In the morning, check out from hotel and drive to Manali. (Approximately 110 km. / 2.30 hours ) . On the way visit to beautiful river views and Himalaya’s mountain ranges.11",
                        "header": "Day 5 : Dharamshala To Manali :111"
                    },
                    {
                        "description": "Beyond the beautiful Chandra Khani Pass lies an unique village Malana which is famous for its distinct culture and the temple of Jamlu devta. ((Breakfast+Dinner) . Later in the evening, go for a jaunt along the Mall Road to shop, eat and enjoy the pleasant weather.Overnight stay in Manali Hotel.",
                        "header": "Day 6 : Manali :"
                    },
                    {
                        "header": "Day 7 : 111Manali: ",
                        "description": "After breakfast, you can go on a sightseeing tour of Manali to visit its prominent attractions. You may start your tour with a visit to the famous Hadimba Temple. This shrine is dedicated to Goddess Hidimba, who was the wife of Bhima, a mythological character from the great Hindu epic – Mahabharata. Set amidst a lush green deodar forest, this temple has an exquisite structure, with its doorway featuring carvings of symbols and legendary figures. Built in AD 1533, this temple has a pagoda-shaped four-tiered roof. Thereafter, visit the Vashist village, which is popular for its hot water springs and several revered shrines. Another must-visit place at this destination is Nehru Kund, which is named after the first Prime Minister of India – Pandit Jawaharlal Nehru.  Later, back to hotel for overnight stay."
                    },
                    {
                        "header": "Day 8 : Manali - Mandi – Kasauli : ",
                        "description": "In the morning, check out from hotel and drive to Mandi. (Approximately 125 km. / 4 hours ). Lord Shiva as the main deity of Bhootnath, Trilokinath, Panchvaktra and other important temples has ordained Mandi as the 'Varanasi of the Hills' as 'Choti Kashi'. For its temple architecture, old palace and rich traditions, Mandi is so often considered as the cultural capital of the state.     In mandi visit the beautiful places like Prashar Lake , Bada Dev - Kamrunag Temple, Panchvaktra Temple, Rewalsar Lake, Baba Bhootnath Mandir, Sunken Garden, Clock Tower. Etc. Later drive to Kasauli for Overnight stay."
                    },
                    {
                        "description": "After having breakfast, visit to Monkey Point, Timber Trail Cable ride, beautiful Kasauli Sunset Point etc.       Overnight stay in Kasauli.",
                        "header": "Day 9 : Kasauli : "
                    },
                    {
                        "description": "In the morning, check out from the hotel and drive to Chandigarh. On arrival visit to Rose Garden,Rock Garden, Sukhna Lake, Chhatbir Zoo etc    . Later drop to Airport.",
                        "header": "Day 10 : Kasauli –Chandigarh :"
                    }
                ],
                "vehicle": [
                    {
                        "price": "12600",
                        "guest_count": "4",
                        "vehicle_name": "A/C Swift D’zire / Etios"
                    },
                    {
                        "vehicle_name": "A/C Innova",
                        "guest_count": "6",
                        "price": "16200"
                    },
                    {
                        "guest_count": "12",
                        "price": "23800",
                        "vehicle_name": "A / C 12-Seater Tempo Traveler"
                    },
                    {
                        "vehicle_name": "A/C 17-Seater Tempo Traveler",
                        "price": "26220",
                        "guest_count": "17"
                    }
                ],
                "description": "Indulge in a refreshing weekend escape to Munnar, surrounded by misty hills, lush tea gardens, and cascading waterfalls. Rejuvenate amidst nature's embrace on this perfect two-day retreat.",
                "include": "All Toll, Parking, Driver Allowns, Taxes",
                "images": [
                    "https://firebasestorage.googleapis.com/v0/b/carzi-00x.appspot.com/o/Holiday_Images%2Fimage_5ywavf8HD5CzEZD6fE9B?alt=media&token=bfedaaea-acf4-4d5b-abc6-990d0bedfd3d",
                    "https://firebasestorage.googleapis.com/v0/b/carzi-00x.appspot.com/o/Holiday_Images%2Fimage_F9QLwn9m8NEeh0lS3b9K?alt=media&token=c149fcbb-c8c2-420c-92e3-90f9b4b8c6ae",
                    "https://firebasestorage.googleapis.com/v0/b/carzi-00x.appspot.com/o/Holiday_Images%2Fimage_oLoSRHAtwj27UxRi4qL2?alt=media&token=71eed36c-f1c9-43c5-8eed-e20592595eab",
                    "https://firebasestorage.googleapis.com/v0/b/carzi-00x.appspot.com/o/Holiday_Images%2Fimage_hW0hqfIG1MtHkPrtmdGK?alt=media&token=da9d9b73-b753-4917-a63e-2b87b1daae97",
                    "https://firebasestorage.googleapis.com/v0/b/carzi-00x.appspot.com/o/Holiday_Images%2Fimage_mX5DlvweLLt6lX1i8Cgw?alt=media&token=90d9b483-d2ff-4644-8bf4-c492900affa0",
                    "https://firebasestorage.googleapis.com/v0/b/carzi-00x.appspot.com/o/Holiday_Images%2Fimage_ZXzGtvGqvuSji4GWORSF?alt=media&token=1abe9a29-1ab6-4e3a-8044-9438704727e8"
                ],
                "location": "kochi",
                "location_description": "enter location description",
                "duration": [
                    3,
                    4
                ],
                "selectedplan": {
                    "VechileName": "A / C 12-Seater Tempo Traveler",
                    "Price": "23800",
                    "GuestCount": "12"
                }
            },
            "formData": {
                "name": "prayag",
                "email": "pp@gmail.com",
                "phoneno": "9079574578",
                "phoneno2": "9079574578",
                "upi_id": "pp@oksbi",
                "transaction_id": "u28ec82cn8-8cu9cuu9c",
                "guest_count": [
                    0,
                    0
                ],
                "invoice_no": "20200669",
                "booking_id": "25645321",
                "booking_date": "06/06/2024",
                "holiday_name": "3 Days not 3 nights",
                "holiday_price": 179.25,
                "final_amount": 209.15
            }
        };

        // navigate('/pdf', { state: { send_Data } });
    }


    return (
        <>

            <Dialog size={"xs"} open={open} handler={handleOpen}>
                <DialogHeader>

                    <div className="flex px-2 gap-2 items-center">
                        <CalendarDays className='w-6 h-6' />
                        <span>Choose Pickup Date:</span>
                    </div>
                </DialogHeader>
                <DialogBody>

                    <div className=''>
                        {/* <p className='text-red-500 text-sm'>*cutoff day applied of 7 Days</p> */}
                        {/* 
                    <DayPicker
                        mode="single"
                        selected={selectedDay}
                        onSelect={setSelectedDay}
                        footer={footer}
                    /> */}


                        <Popover className=''>


                            <DayPicker
                                mode="single"
                                selected={date}
                                onSelect={handleSelectDate}
                                // showOutsideDays
                                className="border-0 z-99"
                                disabled={isDayDisabled}
                                highlighted={highlightedDays}
                                classNames={{
                                    caption: "flex justify-center py-2 mb-4 relative items-center",
                                    caption_label: "text-sm font-medium text-gray-900",
                                    nav: "flex items-center",
                                    nav_button:
                                        "h-6 w-6 bg-transparent hover:bg-red-500 p-1 rounded-md transition-colors duration-300",
                                    nav_button_previous: "absolute left-1.5",
                                    nav_button_next: "absolute right-1.5",
                                    table: "w-full border-collapse",
                                    head_row: "flex font-medium text-gray-900",
                                    head_cell: "m-0.5 w-9 font-normal text-sm",
                                    row: "flex w-full mt-2",
                                    cell: "text-gray-600 rounded-md h-9 w-9 text-center text-sm p-0 m-0.5 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-gray-900/20 [&:has([aria-selected].day-outside)]:text-white [&:has([aria-selected])]:bg-gray-900/50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                    day: "h-9 w-9 p-0 font-normal hover:bg-red-200",
                                    day_range_end: "day-range-end",
                                    day_outside:
                                        "day-outside text-gray-500 opacity-50 aria-selected:bg-gray-500 aria-selected:text-gray-900 aria-selected:bg-opacity-10",
                                    day_hidden: "invisible",
                                    day_disabled: "text-red-500 opacity-50",
                                    // day_today: "rounded-md bg-yellow-700 text-red-800",
                                    day_selected: `font-bold
                                    ${ShowCutoff == false ? "rounded-md bg-green-500 text-white" : "rounded-md bg-yellow-300 text-red-200"}
                                    `,
                                    day_hovered: "hover:bg-blue-200 text-gold-500",
                                }}
                                components={{
                                    IconLeft: ({ ...props }) => (
                                        <ChevronLeftIcon {...props} className="h-4 w-4 stroke-2" />
                                    ),
                                    IconRight: ({ ...props }) => (
                                        <ChevronRightIcon {...props} className="h-4 w-4 stroke-2" />
                                    ),
                                }}
                            />

                        </Popover>
                        {/* <p>pickup up date: {ShowNumberCutoff}</p> */}
                        {ShowCutoff === true ?

                            <p className='text-red-500 text-sm animate-blink'>*your booking is on request, will be confirmed in few hours</p>
                            : " "
                        }
                    </div>

                </DialogBody>
                <DialogFooter>
                    <Button
                        variant="text"
                        color="red"
                        onClick={handleOpen}
                        className=""
                    >
                        <span>Close</span>
                    </Button>
                    <Button variant="gradient" color="green" onClick={handleOpen}>
                        <span>Confirm</span>
                    </Button>
                </DialogFooter>
            </Dialog >

            {/*
            https://images.unsplash.com/photo-1566371486490-560ded23b5e4
            https://images.unsplash.com/photo-1519641471654-76ce0107ad1b 
            https://images.unsplash.com/photo-1517984211099-444b8decd034
            */}



            <div className='relative flex flex-col items-center'>



                <div className="flex flex-col justify-center w-full space-y-2 pb-10 pl-10 lg:pl-20 md:pt-0 h-[20rem] lg:h-[28rem]"
                    style={{
                        backgroundImage: "linear-gradient(to right, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.4))," +
                            `url('${images[1]}')`,

                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        transition: "opacity 1s ease-in-out",
                    }}
                    // "url('https://images.unsplash.com/photo-1517984211099-444b8decd034')",

                >
                    <nav className="mb-8 flex text-white" aria-label="Breadcrumb">
                        <ol className="inline-flex items-center space-x-1 md:space-x-3">
                            <li className="inline-flex items-center">
                                <a
                                    href={`/location/${selectLocationData.location}`}
                                    className="ml-1 inline-flex text-sm font-medium text-white hover:underline md:ml-2"
                                >
                                    <MapPinned size={16} className="mr-2 text-white" />
                                    Holidays
                                </a>
                            </li>

                            <li className="inline-flex items-center">
                                <ChevronRight size={16} className="mr-2 text-white" />
                                <a
                                    // href={`/location/${selectedLocation}`}
                                    className="ml-1 inline-flex text-sm font-medium text-white hover:underline md:ml-2"
                                >
                                    {/* {selectLocationData.package_name} */}
                                    <TruncatedText packagename={selectLocationData.package_name} words={5} />
                                </a>
                            </li>
                        </ol>
                    </nav>
                    <p className="text-3xl p-5 font-bold text-white md:text-5xl md:leading-10 ">
                        <div className='flex gap-2 justify-center items-center'>
                            <BadgeCheck className='h-12 w-12 text-amber-300	 ' />
                            <span className='text-lg lg:p-0 md:text-3xl lg:text-4xl'>
                                {selectLocationData.package_name}
                            </span>
                        </div>
                    </p>
                </div>


                <Card className="h-full w-full lg:w-[85%]  my-10 overflow-auto -translate-y-20 lg:p-4 lg:shadow-2xl">
                    <form onSubmit={handleSubmit(onSubmit)} className="p-10 text-black">
                        <div className='flex gap-10 flex-col sm:flex-row'>
                            <div className='flex-1'>
                                <h2 className='text-3xl font-bold mb-5'>Personal Details</h2>

                                <div className="mb-4">
                                    <label className="block  text-md font-bold mb-2">Name</label>
                                    <input {...register("name", validationRules.name)}
                                        className="shadow appearance-none border rounded w-full py-2 px-3  
                                        focus:border-black
                                        leading-tight focus:outline-none focus:shadow-outline" />
                                    {errors.name && <span className="text-red-500">{errors.name.message}</span>}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-md font-bold mb-2">Email</label>
                                    <input type="email" {...register("email", validationRules.email)}
                                        className="shadow appearance-none border rounded w-full py-2 px-3
                                        focus:border-black
                                        leading-tight focus:outline-none focus:shadow-outline" />
                                    {errors.email && <span className="text-red-500">{errors.email.message}</span>}
                                </div>

                                <div className='flex gap-6 mb-4 flex-col sm:flex-row'>
                                    <div className="w-full">
                                        <label className="block text-md font-bold mb-2">Phone 1</label>
                                        <input {...register("phone1", validationRules.phone1)}
                                            type="tel"
                                            className="shadow appearance-none border rounded w-full py-2 px-3
                                            focus:border-black
                                            leading-tight focus:outline-none focus:shadow-outline" />
                                        {errors.phone1 && <span className="text-red-500">{errors.phone1.message}</span>}
                                    </div>
                                    <div className="w-full">
                                        <label className="block text-md font-bold mb-2">Phone 2</label>
                                        <input {...register("phone2", validationRules.phone2)}
                                            type="tel"
                                            className="shadow appearance-none border rounded w-full py-2 px-3
                                            focus:border-black
                                            leading-tight focus:outline-none focus:shadow-outline" />
                                        {errors.phone2 && <span className="text-red-500">{errors.phone2.message}</span>}
                                    </div>
                                </div>

                                <div className='flex flex-col mb-4 gap-3'>
                                    <div className={`mb-4 overflow-auto ${fileUploadUrl ? "w-xl" : "w-xl"}`}>
                                        <label className="text-md font-bold my-2">Upload Image</label>
                                        <input type="file" accept="image/*"
                                            id="govID"
                                            onChange={handleFileUpload}
                                            className="w-full font-semibold text-md bg-white border 
                                            focus:border-black
                                            file:cursor-pointer cursor-pointer file:border-0 file:py-3 file:px-4 file:mr-4 file:bg-gray-100 file:hover:bg-gray-200 file:text-gray-500 rounded" />
                                        <p className="text-xs mt-2">PNG, JPG, SVG, WEBP, and GIF are Allowed.</p>
                                    </div>
                                    {FilePreviewUrl && (
                                        <div className="mb-4 w-max">
                                            <label className="block text-md font-bold">Preview</label>
                                            <img src={FilePreviewUrl} alt="Uploaded"
                                                className="w-40 h-40 rounded-md border-gray-800 border-2
                                                focus:border-black
                                                object-contain" />
                                        </div>
                                    )}
                                </div>

                            </div>

                            <div className='flex-1'>
                                <h2 className='text-3xl font-bold mb-5'>Holiday Details</h2>

                                <div className="PackageSlected mb-4">
                                    <label className="block  text-md font-bold mb-2 overflow-auto">Package Selected</label>
                                    <input
                                        className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-200 
                                     focus:border-black
                                        leading-tight focus:outline-none focus:shadow-outline"
                                        value={selectLocationData.package_name}
                                        disabled={true}
                                    />
                                    <span className="text-red-500 text-sm"
                                        id="PackageSlectedSpan">unchanged</span>

                                </div>


                                <div className="GuestCount mb-4">
                                    <label className="block  text-md font-bold mb-2">Guest Count</label>
                                    <input
                                        className="shadow appearance-none border rounded w-full py-2 px-3
                                        focus:border-black
                                        bg-gray-200
                                    leading-tight focus:outline-none focus:shadow-outline"
                                        value={`${GuestCount[0] + ' Adults,' + ' ' +

                                            (GuestCount[0] > 0 ? GuestCount[1] : 0) + ' Infals'}`}
                                    />
                                    <span className="text-red-500 text-sm"
                                        id="GuestCountSpan">unchanged</span>

                                </div>


                                <div className='flex lg:gap-3 mt-4 flex-col sm:flex-row'>

                                    <div className="mb-4 lg:w-4/6">
                                        <label className="block text-md font-bold mb-2">Pickup Date</label>

                                        <div className="flex gap-1  mb-4">

                                            <input type='text'
                                                id="pickup_date"
                                                name="pickup_date"
                                                // value={format(date, "PPP")}
                                                value={date ? format(date, "PPP") : "Choose a date"}
                                                className='border-2 rounded p-2 w-full
                                                focus:border-black'
                                                disabled={true}
                                                onClick={handleOpen}
                                            />
                                            <Button className='rounded-md justify-center items-center' onClick={handleOpen} variant="gradient">
                                                Change
                                            </Button>

                                        </div>

                                    </div>

                                    <div className="mb-4 w-3/4 lg:w-2/6">
                                        <label className="block  text-md font-bold mb-2">Pickup Time</label>
                                        <input type="time" {...register("pickupTime", validationRules.pickupTime)}
                                            className="shadow appearance-none border rounded w-full py-2 px-3
                                            focus:border-black
                                            leading-tight focus:outline-none focus:shadow-outline" />
                                        {errors.pickupTime && <span className="text-red-500">{errors.pickupTime.message}</span>}
                                    </div>
                                </div>

                                <div className="mb-4 w-full">
                                    <label className="block text-md font-bold mb-2">Pickup Address</label>
                                    <input type="text"
                                        {...register("pickupAdress", validationRules.pickupAdress)}
                                        className="shadow appearance-none border rounded w-full py-2 px-3  
                                        focus:border-black
                                        leading-tight focus:outline-none focus:shadow-outline" />
                                    {errors.pickupAdress && <span className="text-red-500">{errors.pickupAdress.message}</span>}
                                </div>




                                <div className="DropOffLocation mb-4">
                                    <label className="block text-md font-bold mb-2">Drop Location</label>
                                    {/* <select {...register("dropLocation", validationRules.dropLocation)} onChange={handleDropLocationChange} className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline">
                                        <option value="Location 1">Location 1</option>
                                        <option value="Location 2">Location 2</option>
                                        <option value="Other drop location">Other drop location</option>
                                    </select> */}
                                    {/* <label className="block  text-md font-bold mb-2">Package Selected</label> */}
                                    <input
                                        className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-200 
                                        focus:border-black
                                     leading-tight focus:outline-none focus:shadow-outline"
                                        value={dateDrop ? format(dateDrop, "PPP") : "Choose pick date "}
                                        disabled={true}
                                    />
                                    <span className="text-red-500 text-sm"
                                        id="DropOffLocationSpan">unchanged</span>
                                </div>

                                {showCustomDropLocation && (
                                    <div className="mb-4">
                                        <label className="block text-md font-bold mb-2">Custom Drop Location</label>
                                        <input {...register("customDropLocation", validationRules.customDropLocation)}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 
                                            focus:border-black
                                            leading-tight focus:outline-none focus:shadow-outline" />
                                        {errors.customDropLocation && <span className="text-red-500">{errors.customDropLocation.message}</span>}
                                    </div>
                                )}


                                {/* <div className="mb-4">
                                    <label className="block  text-md font-bold mb-2">Flight Number</label>
                                    <input {...register("flightNumber")} className="shadow appearance-none border rounded w-full py-2 px-3  leading-tight focus:outline-none focus:shadow-outline" />
                                </div> */}







                            </div>
                        </div>

                        <hr className="border-t-2 border-gray-200 my-10" />
                        {/* <div>Hello World Next</div> */}




                        {/* PAYEMNT && INSTRUCTION START */}

                        <div className='flex gap-10 flex-col  sm:flex-row'>
                            <div className='flex-1'>
                                <h2 className='text-3xl font-bold mb-5'>Payment Details</h2>

                                <div className="mb-4">
                                    <label className="block  text-md font-bold mb-2">Enter UPI ID :</label>
                                    <input
                                        type='text'
                                        placeholder='enter upi id'
                                        {...register("upiid", validationRules.upiid)}
                                        className="shadow appearance-none border rounded w-full py-2 px-3  
                                        focus:border-black
                                        leading-tight focus:outline-none focus:shadow-outline" />
                                    {errors.upiid && <span className="text-red-500">{errors.upiid.message}</span>}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-md font-bold mb-2">Enter Transaction ID :</label>
                                    <input type="text"
                                        placeholder='enter transaction ID'
                                        {...register("transactionid", validationRules.transactionid)}
                                        className="shadow appearance-none rounded w-full py-2 px-3  
                                        border focus:border-black
                                        leading-tight focus:outline-none focus:shadow-outline" />
                                    {errors.transactionid && <span className="text-red-500">{errors.transactionid.message}</span>}
                                </div>



                                <div className='flex flex-col mb-4 gap-3'>
                                    <div className={`mb-4 overflow-auto ${fileUploadUrlPayment ? "w-max" : "w-full"}`}>
                                        <label className="text-md font-bold">Upload Payment Image:</label>
                                        <input type="file" accept="image/*" onChange={handleFileUploadPayment}
                                            id="PaymentID"
                                            className="w-full font-semibold text-md bg-white border 
                                            file:cursor-pointer cursor-pointer file:border-0 file:py-3 file:px-4 file:mr-4 file:bg-gray-100 file:hover:bg-gray-200 file:text-gray-500 rounded" />
                                        <p className="text-xs mt-2">PNG, JPG, SVG, WEBP, and GIF are Allowed.</p>
                                    </div>


                                    {FilePreviewUrlPayment && (
                                        <div className="mb-4 w-max">
                                            <label className="block text-md font-bold">Preview</label>
                                            <img src={FilePreviewUrlPayment} alt="Uploaded" className="w-40 h-40 rounded-md border-gray-800 border-2 object-contain" />
                                        </div>
                                    )}
                                </div>



                                <div className='flex-1'>
                                    <div className="mb-4">
                                        <label className="block  text-md font-bold mb-2">Any Request/Message: </label>
                                        <textarea
                                            {...register("message", { required: false })}
                                            rows="3"
                                            className="shadow appearance-none w-full py-2 px-3 
                                            leading-tight
                                            border border-gray-300 rounded
                                            "
                                        />
                                        {/* {errors.name && <span className="text-red-500">{errors.name.message}</span>} */}
                                    </div>



                                </div>

                            </div>

                            <div className='flex-1'>
                                <h2 className='text-3xl font-bold mb-5 opacity-0 hidden lg:block'>-</h2>

                                <div className="mb-8">
                                    <p className="block text-2xl font-bold mb-2 ">
                                        Package Price: 30000
                                    </p>

                                    <img
                                        className='my-5 w-70 h-60 '
                                        src={QRCode} />
                                    <p className="text-sm">*complete the payment and fill details correctly</p>

                                </div>



                                <div className="mb-4">
                                    <p className="block text-2xl font-bold mb-2 ">
                                        Instructions
                                    </p>

                                    <ul className="text-md list-disc p-2 pl-5 leading-relaxed list-outside text-left">
                                        <li>
                                            We will verify and send you the final confirmation at the earliest.
                                        </li>
                                        <li>
                                            If the package is delayed for activation you can contact our support team.
                                        </li>
                                        <li>

                                            Your satisfaction is our priority. If you have any questions, feel free to reach out.
                                        </li>

                                    </ul>



                                </div>
















                            </div>


                        </div>

                        <hr className="border-t-2 border-gray-200 my-10" />

                        {/* MESSAGE */}



                        {/* <button type="submit" className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Submit Details</button> */}

                        <button
                            type="submit"
                            className={`inline-flex gap-1  justify-center items-center rounded-md px-3.5 py-2.5 font-semibold leading-7 text-white hover:bg-black/80 relative
                                                
    ${(ButtonContent === "Submit Details") ? "bg-orange-400" : "bg-gray-800"}
                                                
    `}
                            onClick={(e) => handleSubmit(e)}
                            disabled={(ButtonContent === "Submit Details") ? false : true}
                        >
                            {ButtonContent}

                            {ButtonContent === "Submit Details" ?
                                // <ArrowRight className="ml-2" size={23} />

                                <Luggage className="w-7 h-7" />
                                :
                                <Luggage className="w-7 h-7" />

                            }

                            {/* Add animation element */}
                            {ButtonContent === "Submiting Details ..." && (
                                <div className="absolute inset-0 bg-black opacity-50 rounded-md"></div>
                            )}
                            {ButtonContent === "Submiting Details ..." && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                                </div>
                            )}
                        </button>



                    </form>

                </Card>

                {(ButtonContent != "Submit Details") ?
                    <div className="flex flex-col h-full w-full absolute items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm ">

                        <div className="rounded-full p-4 bg-white shadow-xl animate-bounce">
                            <Spinner className="h-16 w-16 text-blue-500 animate-spin" />
                        </div>
                        <p className="text-black text-lg lg:text-xl font-semibold animate-pulse">{"Submiting your Details...."}</p>
                    </div>
                    : ""}

            </div>


            {/* <button onClick={demo}>demo</button> */}


        </>

    )
}


export default ScrollToTop(HolidayForm);