import React, { useEffect, useState, useRef } from 'react';
import {
    IndianRupee, ChevronRight, Home, Car, Headset, ArrowRight, ReceiptText
} from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { db } from '@config/firebase.js';
import { collection, addDoc, query, getDocs, where } from "firebase/firestore";
import { Star } from 'lucide-react'
import {
    Carousel,
    IconButton,
    Card,
    CardBody,
    Textarea,
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
} from "@material-tailwind/react";

import { MultiStepForm } from '@components'
// import { useUser } from '../context/UserContext';
import { SpinnerComponent } from '@components'
import { ScrollToTop } from '@components';
import { BookOpenCheck } from 'lucide-react'
import { Menu, X, Check, MinusCircle, PlusCircle } from 'lucide-react'


const LocationDetails = () => {


    const [dataPrepared, setDataPrepared] = useState(false);

    const params = useParams();
    // const [packagename, setpackagename] = useState('');

    // useEffect(() => {
    //     const { packagenamep } = params;

    //     if (packagenamep) {
    //         console.log('Parameter from URL:', packagenamep);
    //         setpackagename(packagenamep);
    //     }
    // }, [params]);




    // const { userData } = useUser();

    const location = useLocation();
    const { state } = location;
    const navigate = useNavigate();





    




    let selectLocationData = state && state.selectedLocation;
    selectLocationData.toLowerCase;
    let GuestCountData = state && state.guestCountData;
    let images1 = selectLocationData.images;
    console.log('selectLocationData===', selectLocationData);
    console.log('pp===', GuestCountData);

  


    console.log('selectLocationData===', selectLocationData.itenary);
    const [isMenuOpen, setIsMenuOpen] = useState(true);

    const initializeFaqs = () => {
        return selectLocationData.itenary.map(faq => ({
            ...faq,
            isOpen: true
        }));
    };



    const scrollToDetails = (id) => {

        console.log('scrollToDetails', id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });
            element.classList.add('active-border');
            setTimeout(() => {
                element.classList.remove('active-border');
            }, 2000); // Remove the class after 2 seconds
        }
    };

    const [faqs, setFaqs] = useState(initializeFaqs);

    const toggleAllAnswers = () => {
        const newState = !isMenuOpen;
        setIsMenuOpen(newState);
        const updatedFaqs = faqs.map(faq => ({ ...faq, isOpen: newState }));
        setFaqs(updatedFaqs);
        console.log(";;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;");
        scrollToDetails("detailed-internary");
    };

    const toggleAnswer = (index) => {
        const updatedFaqs = faqs.map((faq, i) => {
            if (i === index) {
                return { ...faq, isOpen: !faq.isOpen };
            }
            return faq;
        });
        setFaqs(updatedFaqs);
    };


    const preloadImages = async () => {
        const promises = images1.map((imgUrl) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = imgUrl;
                img.onload = resolve;
                img.onerror = reject;
            });
        });

        try {
            console.log('entered')
            await Promise.all(promises);
            setDataPrepared(true);
        } catch (error) {
            console.error('Error preloading images:', error);
        }
    };



    useEffect(() => {

        console.log('FETCHING', selectLocationData);
        const fetchPackageData = async () => {
            try {
                const q = query(collection(db, "test"), where("package_name", "==", selectLocationData));
                const querySnapshot = await getDocs(q);
                const locations = [];
                querySnapshot.forEach((doc) => {
                    locations.push({ location_id: doc.id, ...doc.data() });
                });

                console.log("MAIN DATA", locations[0]);
                preloadImages();


            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchPackageData();
    }, []);



    useEffect(() => {
        const fetchHolidays = async () => {
            try {
                const q = query(collection(db, "holidays"));
                const querySnapshot = await getDocs(q);

                const locations = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();

                    if (!locations.includes(data.location)) {
                        locations.push(data.location);
                    }
                });
                // setUniqueLocations(locations);
                setDataPrepared(true);
            } catch (error) {
                console.error('Error fetching holidays:', error);
            }
        };


        fetchHolidays();
    }, []);










    const [isOpen, setIsOpen] = useState(Array.from({ length: 3 }).fill(false));

    // Function to toggle the visibility of answer content
    const images = [
        { url: 'https://a0.muscache.com/im/pictures/miso/Hosting-1074443584868984071/original/7f40d497-6831-4c82-8e50-3c653327125b.jpeg?im_w=960', alt: 'Image 1' },
        { url: 'https://a0.muscache.com/im/pictures/miso/Hosting-1074443584868984071/original/d84386cd-765a-4f1d-83b6-85abbd499b7c.jpeg?im_w=480', alt: 'Image 2' },
        { url: 'https://a0.muscache.com/im/pictures/miso/Hosting-1074443584868984071/original/81ad5901-e9aa-4307-9718-025e629d0e5a.jpeg?im_w=480', alt: 'Image 3' },
        { url: 'https://a0.muscache.com/im/pictures/miso/Hosting-1074443584868984071/original/0a139e7d-fe3f-4e7f-b5ab-4dfedd713eca.jpeg?im_w=480', alt: 'Image 3' },
        { url: 'https://a0.muscache.com/im/pictures/miso/Hosting-1074443584868984071/original/40f64163-5368-4881-ab68-8ae658385e61.jpeg?im_w=480', alt: 'Image 3' },
    ];

    const [name, setname] = useState('');
    const [phone, setphone] = useState('');
    const [message, setmessage] = useState('');
    const [address, setaddress] = useState('');
    const [packageName, setpackageName] = useState('');
    // const [vehicleName, setvehicleName] = useState('');
    // const [totalCost, settotalCost] = useState('');
    // const [locationId, setlocationId] = useState('');
    const [upiId, setupiId] = useState('');
    const [transactionId, settransactionId] = useState('');
    const [userid, setuserid] = useState('');




    const currentDate = new Date();










    const [isHovered, setIsHovered] = useState(false);

    const settings = {
        infinite: true,
        autoPlaySpeed: 3000,
        slidesToShow: 1,
        slidesToScroll: 1,
        perPage: 1,
        autoplay: true,
        pauseOnHover: true,
        gap: '0',
        pagination: false,
        arrows: false,
        breakpoints: {
            640: {
                perPage: 1,
            },
        },
    };


    const steps = ['Personal Information', 'Payment Method', 'Confirmation']



    const [pickupInputTupe, setPickupInputType] = useState("date");
    const pickupText = () => {
        setPickupInputType('text');
    }


    const pickupDate = () => {
        setPickupInputType('date');
    }

    const handlePickupDateChange = (e) => {
        setPickupInputType(e.target.value);
    };


    useEffect(() => {

        console.log('Pickup Date Value:', pickupInputTupe);
    }, [pickupInputTupe])


    const [dropoffInputTupe, setDropOffInputType] = useState("date");
    const dropoffText = () => {
        setDropOffInputType('text')
    }
    const dropOffDate = () => {
        setDropOffInputType('date')
    }


    const handleDropupDateChange = (e) => {
        setDropOffInputType(e.target.value);
    };

    useEffect(() => {

        console.log('Pickup Date Value:', dropoffInputTupe);
    }, [dropoffInputTupe])

    const [open, setOpen] = React.useState(false);

    const handleOpen = () => setOpen(!open);

    const proceespayment = () => {
        if (name !== '' && phone !== '' && address !== '' && pickupInputTupe !== 'date' && dropoffInputTupe !== 'date') {

            handleOpen();
        }
        else {
            alert("Fill Up Details")
        }
    }

    const [payemntDone, setPayemntDone] = useState(false);


    function truncateText(text, limit) {
        console.log('Truncating', text);

        const words = text.split(' ');
        if (words.length > limit) {
            console.log('Truncating', words.slice(0, limit).join(' ') + '...');
            return words.slice(0, limit).join(' ') + '...';
        }
        return text;
    }


    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768); // Adjust the breakpoint as needed
        };

        handleResize(); // Check initial size
        window.addEventListener('resize', handleResize); // Listen for window resize events

        return () => window.removeEventListener('resize', handleResize); // Clean up event listener
    }, []);

    // const [active, setActive] = useState(
    //     "https://images.unsplash.com/photo-1499696010180-025ef6e1a8f9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
    // );


    const [active, setActive] = useState(images1[0]);


    const [imageHover, setImageHover] = useState(false);


    useEffect(() => {
        const interval = setInterval(() => {
            if (!imageHover) {
                const currentIndex = images1.indexOf(active);
                const nextIndex = currentIndex === images1.length - 1 ? 0 : currentIndex + 1;
                setActive(images1[nextIndex]);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [active, images1, imageHover]);



    const handleSubmitBookNow = (e) => {
        if (!selectLocationData) {
            console.error('No location data available');
            return;
        }
        
        // Ensure we're passing the data with the correct property names
        const datasendLocation = selectLocationData;
        const GuestCountDataSend = GuestCountData || [1, 0]; // Default to 1 adult, 0 children if not set
        
        console.log('Navigating to holiday-form with data:', { datasendLocation, GuestCountDataSend });
        
        // Save to localStorage as fallback
        localStorage.setItem('holidayFormData', JSON.stringify({
            datasendLocation,
            GuestCountDataSend
        }));
        
        navigate('/holiday-form', { 
            state: { 
                datasendLocation, 
                GuestCountDataSend 
            } 
        });
    }


    const detailsRef = useRef(null); // Create a ref for the Detailed Itinerary section

    // const scrollToDetails = () => {
    //     detailsRef.current.scrollIntoView({ behavior: 'smooth' });
    // };




    return (

        <>

            <Dialog open={open} handler={handleOpen} size={"md"}>
                <DialogHeader>Make Payment</DialogHeader>
                <DialogBody>

                    {!payemntDone ?

                        <div className='overflow-scroll'>

                            <div className='m-2 p-1 shadow-sm bg-gray-100 rounded-xl flex items-center justify-center'>
                                <div className='shadow-sm'>
                                    <img
                                        className='w-[20rem] h-[20rem]'
                                        src="https://play-lh.googleusercontent.com/C6J7K6YilHnbqTUdWJQAALLRpxQdZJPLzaxb-5-PC8pHqlfpqIps69jekZ2fMq-Jzw"
                                        alt="Your Image"
                                    />
                                </div>
                            </div>


                            <div className="flex items-center justify-center bg-white px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
                                <div className="xl:mx-auto xl:w-full xl:max-w-sm 2xl:max-w-md">
                                    {/* <div className="mb-2">
                                <svg
                                    width="50"
                                    height="56"
                                    viewBox="0 0 50 56"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M23.2732 0.2528C20.8078 1.18964 2.12023 12.2346 1.08477 13.3686C0 14.552 0 14.7493 0 27.7665C0 39.6496 0.0986153 41.1289 0.83823 42.0164C2.12023 43.5449 23.2239 55.4774 24.6538 55.5267C25.9358 55.576 46.1027 44.3832 48.2229 42.4602C49.3077 41.474 49.3077 41.3261 49.3077 27.8158C49.3077 14.3055 49.3077 14.1576 48.2229 13.1714C46.6451 11.7415 27.1192 0.450027 25.64 0.104874C24.9497 -0.0923538 23.9142 0.00625992 23.2732 0.2528ZM20.2161 21.8989C20.2161 22.4906 18.9835 23.8219 17.0111 25.3997C15.2361 26.7803 13.8061 27.9637 13.8061 28.0623C13.8061 28.1116 15.2361 29.0978 16.9618 30.2319C18.6876 31.3659 20.2655 32.6479 20.4134 33.0917C20.8078 34.0286 19.871 35.2119 18.8355 35.2119C17.8001 35.2119 9.0233 29.3936 8.67815 28.5061C8.333 27.6186 9.36846 26.5338 14.3485 22.885C17.6521 20.4196 18.4904 20.0252 19.2793 20.4196C19.7724 20.7155 20.2161 21.3565 20.2161 21.8989ZM25.6893 27.6679C23.4211 34.9161 23.0267 35.7543 22.1391 34.8668C21.7447 34.4723 22.1391 32.6479 23.6677 27.9637C26.2317 20.321 26.5275 19.6307 27.2671 20.3703C27.6123 20.7155 27.1685 22.7864 25.6893 27.6679ZM36.0932 23.2302C40.6788 26.2379 41.3198 27.0269 40.3337 28.1609C39.1503 29.5909 31.6555 35.2119 30.9159 35.2119C29.9298 35.2119 28.9436 33.8806 29.2394 33.0424C29.3874 32.6479 30.9652 31.218 32.7403 29.8867L35.9946 27.4706L32.5431 25.1532C30.6201 23.9205 29.0915 22.7371 29.0915 22.5892C29.0915 21.7509 30.2256 20.4196 30.9159 20.4196C31.3597 20.4196 33.6771 21.7016 36.0932 23.2302Z"
                                        fill="black"
                                    />
                                </svg>
                            </div> */}
                                    <h2 className="text-2xl font-bold leading-tight text-black"> Pay and Fill Up form</h2>
                                    {/* <p className="mt-2text-sm text-gray-600 ">
                                    Don&apos;t have an account?{' '}
                                    <a
                                        href="#"
                                        title=""
                                        className="font-semibold text-black transition-all duration-200 hover:underline"
                                    >
                                        Create a free account
                                    </a>
                                </p> */}
                                    <form action="#" method="POST" className="mt-8">
                                        <div className="space-y-5">
                                            <div>
                                                <label htmlFor="" className="text-base font-medium text-gray-900">
                                                    {' '}
                                                    UPI ID{' '}
                                                </label>
                                                <div className="mt-2">
                                                    <input
                                                        className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                                        type="text"
                                                        placeholder="UPI ID"
                                                        value={upiId}
                                                        onChange={(e) => setupiId(e.target.value)}
                                                    ></input>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <label htmlFor="" className="text-base font-medium text-gray-900">
                                                        {' '}
                                                        Transaction ID{' '}
                                                    </label>
                                                    {/* <a href="#" title="" className="text-sm font-semibold text-black hover:underline">
                                                    {' '}
                                                    Forgot password?{' '}
                                                </a> */}
                                                </div>
                                                <div className="mt-2">
                                                    <input
                                                        className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                                        type="text"
                                                        placeholder="Transaction ID"
                                                        value={transactionId}
                                                        onChange={(e) => settransactionId(e.target.value)}
                                                    ></input>
                                                </div>
                                            </div>
                                            <div>
                                                <button
                                                    type="button"
                                                    className="inline-flex w-full items-center justify-center rounded-md bg-black px-3.5 py-2.5 font-semibold leading-7 text-white hover:bg-black/80"
                                                    onClick={() => HandleSubmitForm()}
                                                >
                                                    Submit Information <ArrowRight className="ml-2" size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </form>

                                </div>
                            </div>
                        </div>

                        : <div>
                            Your req i susbmitted, we will confirm your order n next few hours, be in touch
                        </div>

                    }
                </DialogBody>
                <DialogFooter>
                    {/* <Button
                        variant="text"
                        color="red"
                        onClick={handleOpen}
                        className="mr-1"
                    >
                        <span>Cancel</span>
                    </Button>
                    <Button variant="gradient" color="green" onClick={handleOpen}>
                        <span>Confirm</span>
                    </Button> */}
                </DialogFooter>
            </Dialog>


            {!dataPrepared ?
                <SpinnerComponent name={"Building your experience..."} />
                :
                <div className="mx-auto max-w-7xl px-4 md:px-8 2xl:px-16 pt-14">
                    <div className="pt-8">

                        <nav className="mb-8 flex" aria-label="Breadcrumb">
                            <ol className="inline-flex items-center space-x-1 md:space-x-3">
                                <li className="inline-flex items-center">
                                    <a
                                        href="/"
                                        className="ml-1 inline-flex text-sm font-medium text-gray-900 hover:underline md:ml-2"
                                    >
                                        <Home size={16} className="mr-2 text-gray-900" />
                                        Home
                                    </a>
                                </li>

                                <li className="inline-flex items-center">
                                    <ChevronRight size={16} className="mr-2 text-gray-600" />
                                    <a
                                        href={`/location/${selectLocationData.location}`}
                                        className="ml-1 inline-flex text-sm font-medium text-gray-900 hover:underline md:ml-2"
                                    >
                                        {/* {selectLocationData.location} */}
                                        {selectLocationData.location.charAt(0).toUpperCase() + selectLocationData.location.slice(1).toLowerCase()}
                                    </a>
                                </li>


                                <li className="inline-flex items-center">
                                    <ChevronRight size={16} className="mr-2 text-gray-600" />
                                    <a

                                        className="ml-1 inline-flex text-sm font-medium text-gray-900 hover:underline md:ml-2"
                                    >
                                        {!isMobile ?
                                            <>
                                                {selectLocationData.package_name}
                                            </>
                                            :
                                            <>
                                                {truncateText(selectLocationData.package_name, 5)}
                                            </>
                                        }
                                    </a>
                                </li>

                            </ol>
                        </nav>

                    </div>
                    <div className='lg:hidden'>
                        <h2 className="text-heading text-2xl  cursor-pointer font-bold"
                            onClick={(e) => handleSubmitBookNow(e)}
                        >
                            {selectLocationData.package_name}
                        </h2>
                    </div>
                    <div className="grid-cols-9 items-start gap-x-10 pb-10 pt-7 lg:grid lg:pb-14 xl:gap-x-14 2xl:pb-20">


                        {/* <div className="col-span-5 grid grid-cols-2 gap-2.5">
                        {images1.map((imageUrl, index) => (
                            <div key={index} className="col-span-1 transition duration-150 ease-in hover:opacity-90">
                                <img
                                    src={imageUrl}
                                    alt={`Image ${index}`}
                                    className="w-full h-full object-cover rounded"
                                />
                            </div>
                        ))}
                    </div> */}


                        <div className='col-span-5 gap-2.5'>
                            <div className={`grid p-2 gap-4 `}

                            >
                                <div
                                    className={`p-1 cursor-pointer
                             ${imageHover ? 'border-1 bg-yellow-300 rounded-md' : ''}
                        `}
                                    onMouseEnter={() => setImageHover(true)}
                                    onMouseLeave={() => setImageHover(false)}>

                                    {images1.length > 0 ?
                                        <img
                                            className="h-auto w-full max-w-full rounded-lg object-cover object-center md:h-[480px]"
                                            src={active}
                                            loading='lazy'
                                            alt=""
                                        />

                                        :

                                        <div className="h-auto w-full max-w-full rounded-lg animate-pulse">
                                            <div className="flex items-center justify-center h-auto w-full max-w-full
                                        rounded-lg
                                        bg-gray-300">
                                                <svg className="h-full w-full text-gray-200" aria-hidden="true"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="currentColor" viewBox="0 0 20 18">
                                                    <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
                                                </svg>
                                            </div>
                                        </div>

                                    }
                                </div>
                                <div className="flex gap-2 overflow-x-auto">
                                    {
                                // mages1.length > 0 ?

                                        images1.map((imgelink, index) => (
                                            <div key={index} onClick={() => setActive(imgelink)}>
                                                <img
                                                    src={imgelink}
                                                    className={`w-40 h-20 cursor-pointer rounded-lg object-cover object-center
                                             ${active === imgelink ? 'border-4 border-yellow-400' : ''}`}
                                                    loading='lazy'
                                                    alt="gallery-image"
                                                />
                                            </div>
                                        ))

                                        // :

                                        // <img
                                        //     src={"https://www.oncrawl.com/wp-content/uploads/2019/04/A-lazy-loading-primer-for-crawlability-indexing-success250px.png"}
                                        //     className={`w-40 h-20 cursor-pointer rounded-lg object-cover object-center
                                        //          ${active === imgelink ? 'border-4 border-yellow-400' : ''}`}
                                        //     loading='lazy'
                                        //     alt="gallery-image"
                                        // />
                                    }

                                </div>
                            </div>
                        </div>

                        <div className="col-span-4 pt-8 lg:pt-0">
                            <div className=" border-gray-300 pb-7">
                                <h2 className="text-heading mb-3.5 hover:text-blue-700 hover:underline cursor-pointer text-lg font-bold md:text-xl lg:text-2xl 2xl:text-3xl hidden lg:block"
                                    onClick={(e) => handleSubmitBookNow(e)}
                                >
                                    {selectLocationData.package_name}
                                </h2>
                                <p className="text-body text-sm leading-6  lg:text-base lg:leading-8">
                                    {/* Visiting Munnar with Alleppey and Kumarakom for a 4 nights 5 days trip offers a unique blend of experiences that showcase the diverse beauty and culture of Kerala, India. */}
                                    {selectLocationData.description}

                                    {/* {truncateText(selectLocationData.description, 40)} */}
                                </p>
                                <div className="mt-5 flex items-center ">
                                    <div className="flex text-heading pr-2 font-bold text-2xl  lg:pr-2 lg:text-3xl">
                                        <IndianRupee className='w-7 h-7 lg:w-9 lg:h-9 font-bold justify-between' /> {selectLocationData.selectedplan.Price}
                                    </div>
                                </div>
                            </div>


                            {/* <div className="flex border-b border-gray-300 pb-2 pt-2"> */}
                            <div className="flex items-center gap-2 mb-4">
                                <h3 className="text-heading text-base font-semibold capitalize md:text-xl">
                                    Choose Vehicle:
                                </h3>
                                <div className="">
                                    <button className="p-1 font-bold border-2 border-black bg-yellow-300 rounded-lg">
                                        {selectLocationData.selectedplan.VechileName}
                                    </button>
                                </div>
                            </div>

                            {/* <div className='w-full m-2'>
                            <button
                                type="button"
                                className="inline-flex items-center rounded-md bg-orange-400 px-3 py-2 text-sm font-semibold text-white hover:bg-black/80"
                            >
                                Book Now
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </button>
                        </div> */}

                            {/* </div> */}
                            <div className="shadow-sm">

                                <header className="flex cursor-pointer items-center justify-between border-t border-gray-300 py-5 transition-colors md:py-6">
                                    <h2 className="text-heading pr-2 text-sm font-semibold leading-relaxed md:text-base lg:text-lg">
                                        Internary:
                                    </h2>
                                </header>
                                <div>
                                    <Card className="bg-gray-100">
                                        <CardBody className="flex flex-col items-center justify-center">
                                            <Carousel
                                                {...settings}
                                                prevArrow={({ handlePrev }) => (
                                                    <IconButton
                                                        variant="text"
                                                        color="red"
                                                        size="sm"
                                                        onClick={handlePrev}
                                                    >
                                                        Prev
                                                    </IconButton>
                                                )}
                                                nextArrow={({ handleNext }) => (
                                                    <IconButton
                                                        variant="text"
                                                        color="white"
                                                        size="sm"
                                                        onClick={handleNext}
                                                    >
                                                        Next
                                                    </IconButton>
                                                )}
                                                renderButtonGroupOutside={true}
                                                customButtonGroup={({ next, previous }) => (
                                                    ""
                                                    // <div className="absolute bottom-4 left-2/4 z-50 -translate-x-2/4 gap-2 hidden">
                                                    //     <button onClick={previous}>Prev</button>
                                                    //     <button onClick={next}>Next</button>
                                                    // </div>
                                                )}
                                            >
                                                {selectLocationData.itenary.map((itenary, index) => (
                                                    <div key={index} className="rounded-lg">
                                                        <p className="text-md mb-3 font-bold text-gray-800">{itenary.header}</p>
                                                        {/* <p className="text-md text-gray-800">{itenary.description}</p> */}
                                                        <p className="text-md text-gray-800">{itenary.description.slice(0, 200)}</p>
                                                        <span
                                                            className="text-sm text-blue-700 underline focus:outline-none
                                                            cursor-pointer"
                                                            onClick={() => scrollToDetails(`internary-${index}`)}
                                                        >
                                                            {" "} .... view detailed
                                                        </span>
                                                    </div>
                                                ))}
                                            </Carousel>
                                        </CardBody>
                                    </Card>
                                </div>
                            </div>

                        </div>
                    </div>
                    <div className='flex justify-center items-center'>
                        {/* <MultiStepForm selectLocationData={selectLocationData} /> */}











                        <div className="border border-black  rounded-lg py-5 px-2 lg:py-10">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                                <div className="w-full pl-5 md:w-2/3 lg:w-1/2">
                                    <h2 className="text-xl lg:text-3xl font-bold text-black">Book Package Now</h2>
                                    <p className="mt-4 text-gray-600">
                                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam at ipsum eu nunc
                                        commodo posuere et sit amet ligula.
                                    </p>
                                    <div className="mt-4">
                                        <p className="font-semibold text-gray-800">
                                            Trusted by over 100,000+ businesses and individuals
                                        </p>
                                        <div className="mt-2 flex items-center">
                                            <div className="flex space-x-1">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} className="h-5 w-5 text-yellow-400" />
                                                ))}
                                            </div>
                                            <span className="ml-2 inline-block">
                                                <span className="text-sm font-semibold text-gray-800">4.8/5 . 3420 Reviews</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-10 w-full md:w-2/3 lg:mt-0 lg:w-1/2">
                                    <form className="flex lg:justify-center">
                                        <div className="flex flex-col justify-center items-center  w-full max-w-md  space-y-1">
                                            {/* <input
                                            className="flex h-10 w-full rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                            type="email"
                                            placeholder="Email"
                                        ></input> */}



                                            {/*
                                        <button
                                            type="button"
                                            className="w-full justify-center item-center rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                                            onClick={(e) => handleSubmitBookNow(e)}
                                        >
                                            <div className="flex gap-2 justify-center items-center">
                                                <ReceiptText />

                                                <span>
                                                    Proceed forward for Final booking
                                                </span>

                                            </div>
                                        </button>


                                        <p className='font-bold text-lg'>OR</p> */}


                                            <button
                                                type="button"
                                                className="w-full justify-center item-center rounded-md bg-orange-400 hover:bg-orange-300  px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                                                onClick={(e) => handleSubmitBookNow(e)}
                                            >
                                                <div className="flex gap-2 m-1 text-lg lg:text-xl font-bold justify-center items-center">
                                                    <ReceiptText />

                                                    <span>
                                                        Proceed Forward
                                                    </span>

                                                </div>


                                            </button>
                                        </div>
                                    </form>
                                    <p className="mt-2 lg:text-center">
                                        <span className="text-sm text-gray-600">
                                            Proceed forward for Final booking details
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>










                    </div>





                    <div ref={detailsRef} className="mx-auto max-w-7xl px-2 md:px-4">
                        <div className="mt-12 space-y-16 bg-gray-50 py-0">
                            <div className="mx-auto flex items-center justify-center px-4 sm:px-6 lg:px-8">
                                <div className="flex flex-col items-center space-y-6">
                                    <div className="space-y-4 justify-self-center">
                                        <p id="detailed-internary" className="text-center text-3xl font-bold leading-10 text-gray-900">
                                            Detailed Internary
                                        </p>
                                        <p className="text-center text-lg leading-loose text-gray-600">
                                            Everything you need to know about the product and billing.
                                        </p>
                                    </div>
                                    <div className="divide-y divide-gray-300">
                                        {faqs.map((faq, index) => (
                                            <div key={index} className="flex justify-between space-x-6 py-6 ">
                                                <div id={`internary-${index}`} className="inline-flex flex-col items-start justify-start space-y-2">
                                                    <p className="text-lg font-medium leading-7 text-gray-900">{faq.header}</p>
                                                    {faq.isOpen && <p className="text-base leading-normal text-gray-600">{faq.description}</p>}
                                                </div>
                                                <div onClick={() => toggleAnswer(index)}>
                                                    {faq.isOpen ? (
                                                        <MinusCircle className="h-6 w-6 text-gray-600" />
                                                    ) : (
                                                        <PlusCircle className="h-6 w-6 text-gray-600" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={toggleAllAnswers}
                                        className="text-lg hover:border-red-400 hover:text-red-500 text-gray-600
                                        border border-gray-400 rounded-full px-2 m-4
                                        ">
                                        {isMenuOpen ? 'Close All' : 'Open All'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>




                    {/* <div className="mx-auto w-full max-w-7xl bg-slate-100 py-2">
                    <div className="mx-auto my-4 max-w-2xl md:my-6">

                        <div className="overflow-hidden rounded-xl bg-white p-4 shadow">
                            <div className="mb-4 flex items-center rounded-lg py-2">
                                <div className="mr-2 rounded-full bg-gray-100  p-2 text-black">
                                    <Car size={25} />
                                </div>
                                <div className="flex flex-1">
                                    <p className="text-sm font-bold lg:text-lg">
                                        Confirm your Holiday Now
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="gap-1 hidden lg:flex rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                                >
                                    Custom Plan <Headset size={20} />
                                </button>
                            </div>

                            <p className="mt-6 mb-4 text-lg font-bold text-gray-900">Personal Info</p>
                            <div className="mt-6 gap-6 space-y-4 md:grid md:grid-cols-2 md:space-y-0">
                                <div className="w-full">
                                    <label
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        htmlFor="Name"
                                    >
                                        Name
                                    </label>
                                    <input
                                        className="flex h-10 w-full rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                        type="text"
                                        placeholder="Enter your first name"
                                        id="Name"
                                        value={name}
                                    ></input>
                                </div>

                                <div className="w-full">
                                    <label
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        htmlFor="EmailID"
                                    >
                                        Phone
                                    </label>
                                    <input
                                        className="flex h-10 w-full rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                        type="text"
                                        placeholder="Enter your Phone Number"
                                        id="phone"
                                        value={phone}
                                    ></input>
                                </div>



                                <div className="col-span-2 grid">
                                    <div className="w-full">
                                        <label
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            htmlFor="email"
                                        >
                                            Address
                                        </label>
                                        <input
                                            className="flex h-10 w-full rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                            type="text"
                                            placeholder="Enter your Address"
                                            id="text"
                                            value={address}
                                            onChange={(e) => setaddress(e.target.value)}
                                        ></input>
                                    </div>
                                </div>


                            </div>




                            <p className="mt-6 mb-4 text-lg font-bold text-gray-900">Choose Jounery Dates:</p>
                            <div className="mt-6 gap-6 space-y-4 md:grid md:grid-cols-2 md:space-y-0">
                                <div className="w-full">


                                    <input
                                        type={pickupInputTupe}
                                        placeholder="Pick Up Date"
                                        onFocus={pickupDate}
                                        className="flex h-10 w-full rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"

                                        onChange={handlePickupDateChange}
                                        value={pickupInputTupe}

                                        name="pickup-date"
                                    />

                                </div>
                                <div className="w-full">

                                    <input
                                        type={dropoffInputTupe}
                                        placeholder="Pick Up Date"
                                        onFocus={dropOffDate}
                                        className="flex h-10 w-full rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                        name="pickup-date"

                                        onChange={handleDropupDateChange}
                                        value={dropoffInputTupe}
                                    />
                                </div>
                            </div>
                            <p className="mt-6 mb-4 text-lg font-bold text-gray-900">Choose Vehicle:</p>
                            <div className="mt-6 gap-6 space-y-4 md:grid md:grid-cols-2 md:space-y-0">
                                <div className="w-full">
                                    <label
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        htmlFor="Name"
                                    >
                                        Choose Vehicle
                                    </label>
                                </div>

                                <div className="w-full">
                                    <label
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        htmlFor="EmailID"
                                    >
                                        Cost
                                    </label>
                                    <input
                                        className="flex h-10 w-full rounded-md border font-bold border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                        type="text"
                                        placeholder="Enter your Email Address"
                                        id="EmailID"
                                        disabled="disabled"
                                    ></input>
                                </div>
                            </div>
                            <p className="mt-6 mb-4 text-lg font-bold text-gray-900">Any Special Reuqest:</p>
                            <div className="">
                                <Textarea label="Message"
                                    value={message} // Bind the value to the state variable
                                    onChange={(e) => setmessage(e.target.value)}
                                />
                            </div>
                            <div className="mt-4 col-span-2 grid">
                                <button
                                    type="button"
                                    className="w-full  rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black

                                    bg-orange-400 hover:bg-orange-600"
                                    onClick={() => proceespayment()}
                                >
                                    Proceed for Payment
                                </button>
                                <p className='w-full  block lg:hidden  m-2 font-bold text-black'>OR</p>

                                <button
                                    type="button"
                                    className="w-full block lg:hidden  rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black

                                    bg-orange-400 hover:bg-orange-600"
                                >
                                    <div className='flex justify-center'>
                                        Custom Plan <Headset size={20} />
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div> */}







                    {/* <div className="mx-auto my-4 max-w-4xl md:my-6">
                <div className="overflow-hidden  rounded-xl shadow">
                    <div className="grid grid-cols-1 md:grid-cols-2">

                        <div className="px-5 py-6 text-gray-900 md:px-8">
                            <div className="flow-root">
                                <div className="-my-6 divide-y divide-gray-200">
                                    <div className="py-6">
                                        <form>
                                            <div className="mx-auto max-w-2xl px-4 lg:max-w-none lg:px-0">
                                                <div>
                                                    <h3
                                                        id="contact-info-heading"
                                                        className="text-lg font-semibold text-gray-900"
                                                    >
                                                        Confirm Holiday
                                                    </h3>

                                                    <div className="mt-4 w-full">
                                                        <label
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                            htmlFor="name"
                                                        >
                                                            Full Name
                                                        </label>
                                                        <input
                                                            className="flex h-10 w-full rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                                            type="text"
                                                            placeholder="Enter your name"
                                                            id="name"
                                                        ></input>
                                                    </div>
                                                </div>
                                                <hr className="my-8" />
                                                <div className="mt-10">
                                                    <h3 className="text-lg font-semibold text-gray-900">Payment details</h3>

                                                    <div className="mt-6 grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4">
                                                        <div className="col-span-3 sm:col-span-4">
                                                            <label
                                                                htmlFor="cardNum"
                                                                className="block text-sm font-medium text-gray-700"
                                                            >
                                                                Card number
                                                            </label>
                                                            <div className="mt-1">
                                                                <input
                                                                    className="flex h-10 w-full rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                                                    type="text"
                                                                    placeholder="4242 4242 4242 4242"
                                                                    id="cardNum"
                                                                ></input>
                                                            </div>
                                                        </div>
                                                        <div className="col-span-2 sm:col-span-3">
                                                            <label
                                                                htmlFor="expiration-date"
                                                                className="block text-sm font-medium text-gray-700"
                                                            >
                                                                Expiration date (MM/YY)
                                                            </label>
                                                            <div className="mt-1">
                                                                <input
                                                                    type="date"
                                                                    name="expiration-date"
                                                                    id="expiration-date"
                                                                    autoComplete="cc-exp"
                                                                    className="block h-10 w-full rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label
                                                                htmlFor="cvc"
                                                                className="block text-sm font-medium text-gray-700"
                                                            >
                                                                CVC
                                                            </label>
                                                            <div className="mt-1">
                                                                <input
                                                                    type="text"
                                                                    name="cvc"
                                                                    id="cvc"
                                                                    autoComplete="csc"
                                                                    className="flex h-10 w-full rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <hr className="my-8" />
                                                <div className="mt-10">
                                                    <h3 className="text-lg font-semibold text-gray-900">Shipping address</h3>

                                                    <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-3">
                                                        <div className="sm:col-span-3">
                                                            <label
                                                                htmlFor="address"
                                                                className="block text-sm font-medium text-gray-700"
                                                            >
                                                                Address
                                                            </label>
                                                            <div className="mt-1">
                                                                <input
                                                                    type="text"
                                                                    id="address"
                                                                    name="address"
                                                                    autoComplete="street-address"
                                                                    className="flex h-10 w-full rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label
                                                                htmlFor="city"
                                                                className="block text-sm font-medium text-gray-700"
                                                            >
                                                                City
                                                            </label>
                                                            <div className="mt-1">
                                                                <input
                                                                    type="text"
                                                                    id="city"
                                                                    name="city"
                                                                    autoComplete="address-level2"
                                                                    className="flex h-10 w-full rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label
                                                                htmlFor="region"
                                                                className="block text-sm font-medium text-gray-700"
                                                            >
                                                                State / Province
                                                            </label>
                                                            <div className="mt-1">
                                                                <input
                                                                    type="text"
                                                                    id="region"
                                                                    name="region"
                                                                    autoComplete="address-level1"
                                                                    className="flex h-10 w-full rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label
                                                                htmlFor="postal-code"
                                                                className="block text-sm font-medium text-gray-700"
                                                            >
                                                                Postal code
                                                            </label>
                                                            <div className="mt-1">
                                                                <input
                                                                    type="text"
                                                                    id="postal-code"
                                                                    name="postal-code"
                                                                    autoComplete="postal-code"
                                                                    className="flex h-10 w-full rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>



            <div className="mt-10 flex justify-end border-t border-gray-200 pt-6">
                <button
                    type="button"
                    className="rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                >
                    Make payment
                </button>
            </div>
        </div>
                                        </form >
                                    </div >
                                </div >
                            </div >
                        </div >
        < div className = "bg-gray-100 px-5 py-6 md:px-8" >
                            <div className="flow-root">
                                <ul className="-my-7 divide-y divide-gray-200">
                                    {products.map((product) => (
                                        <li
                                            key={product.id}
                                            className="flex items-stretch justify-between space-x-5 py-7"
                                        >
                                            <div className="flex flex-1 items-stretch">
                                                <div className="flex-shrink-0">
                                                    <img
                                                        className="h-20 w-20 rounded-lg border border-gray-200 bg-white object-contain"
                                                        src={product.imageSrc}
                                                        alt={product.imageSrc}
                                                    />
                                                </div>
                                                <div className="ml-5 flex flex-col justify-between">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold">{product.name}</p>
                                                        <p className="mt-1.5 text-sm font-medium text-gray-500">
                                                            {product.color}
                                                        </p>
                                                    </div>
                                                    <p className="mt-4 text-xs font-medium ">x 1</p>
                                                </div>
                                            </div>
                                            <div className="ml-auto flex flex-col items-end justify-between">
                                                <p className="text-right text-sm font-bold text-gray-900">{product.price}</p>
                                                <button
                                                    type="button"
                                                    className="-m-2 inline-flex rounded p-2 text-gray-400 transition-all duration-200 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
                                                >
                                                    <span className="sr-only">Remove</span>
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <hr className="mt-6 border-gray-200" />
                            <form action="#" className="mt-6">
                                <div className="sm:flex sm:space-x-2.5 md:flex-col md:space-x-0 lg:flex-row lg:space-x-2.5">
                                    <div className="flex-grow">
                                        <input
                                            className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                            type="text"
                                            placeholder="Enter coupon code"
                                        />
                                    </div>
                                    <div className="mt-4 sm:mt-0 md:mt-4 lg:mt-0">
                                        <button
                                            type="button"
                                            className="rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                                        >
                                            Apply Coupon
                                        </button>
                                    </div>
                                </div>
                            </form>
                            <ul className="mt-6 space-y-3">
                                <li className="flex items-center justify-between text-gray-600">
                                    <p className="text-sm font-medium">Sub total</p>
                                    <p className="text-sm font-medium">₹1,14,399</p>
                                </li>
                                <li className="flex items-center justify-between text-gray-900">
                                    <p className="text-sm font-medium ">Total</p>
                                    <p className="text-sm font-bold ">₹1,14,399</p>
                                </li>
                            </ul>
                        </ >
                    </div >
                </div >
            </div > * /}




    {/*
     // <div className="mx-auto grid w-full max-w-7xl items-center space-y-4 px-2 py-10 md:grid-cols-2 md:gap-6 md:space-y-0 lg:grid-cols-4">

        // <Slider {...settings}>
        //     {Array.from({ length: 4 }).map((_, i) => (
        //         <div key={i} className="rounded-md border">
        //             {/* Your card content goes here */}

                    {/* {
        //                 Array.from({ length: 4 }).map((_, i) => (
        //                     <div key={i} className="rounded-md border">
        //                         <img
        //                             src="https://images.unsplash.com/photo-1588099768523-f4e6a5679d88?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxjb2xsZWN0aW9uLXBhZ2V8NHwxMTM4MTU1NXx8ZW58MHx8fHw%3D&auto=format&fit=crop&w=800&q=60"
        //                             alt="Laptop"
        //                             className="aspect-[16/9] w-full rounded-md md:aspect-auto md:h-[300px] lg:h-[200px]"
        //                         />
        //                         <div className="p-4">
        //                             <h1 className="inline-flex items-center text-lg font-semibold">Nike Airmax v2</h1>
        //                             <p className="mt-3 text-sm text-gray-600">
        //                                 Lorem ipsum dolor sit amet consectetur adipisicing elit. Excepturi, debitis?
        //                             </p>
        //                             <div className="mt-4">
        //                                 <span className="mb-2 mr-2 inline-block rounded-full bg-gray-100 px-3 py-1 text-[10px] font-semibold text-gray-900">
        //                                     #Sneakers
        //                                 </span>
        //                                 <span className="mb-2 mr-2 inline-block rounded-full bg-gray-100 px-3 py-1 text-[10px] font-semibold text-gray-900">
        //                                     #Nike
        //                                 </span>
        //                                 <span className="mb-2 mr-2 inline-block rounded-full bg-gray-100 px-3 py-1 text-[10px] font-semibold text-gray-900">
        //                                     #Airmax
        //                                 </span>
        //                             </div>
        //                             <div className="mt-3 flex items-center space-x-2">
        //                                 <span className="block text-sm font-semibold">Colors : </span>
        //                                 <span className="block h-4 w-4 rounded-full border-2 border-gray-300 bg-red-400"></span>
        //                                 <span className="block h-4 w-4 rounded-full border-2 border-gray-300 bg-purple-400"></span>
        //                                 <span className="block h-4 w-4 rounded-full border-2 border-gray-300 bg-orange-400"></span>
        //                             </div>
        //                             <div className="mt-5 flex items-center space-x-2">
        //                                 <span className="block text-sm font-semibold">Size : </span>
        //                                 <span className="block cursor-pointer rounded-md border border-gray-300 p-1 px-2 text-xs font-medium">
        //                                     8 UK
        //                                 </span>
        //                                 <span className="block cursor-pointer rounded-md border border-gray-300 p-1 px-2 text-xs font-medium">
        //                                     9 UK
        //                                 </span>
        //                                 <span className="block cursor-pointer rounded-md border border-gray-300 p-1 px-2 text-xs font-medium">
        //                                     10 UK
        //                                 </span>
        //                             </div>
        //                             <button
        //                                 type="button"
        //                                 className="mt-4 w-full rounded-sm bg-black px-2 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        //                             >
        //                                 Add to Cart
        //                             </button>
        //                         </div>
        //                     </div>
        //                 ))}
        //             {/* </div> */}

                </div >
            }

        </>
    );
};

export default ScrollToTop(LocationDetails);
