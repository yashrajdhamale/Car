import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
// import { ASideBar, ANavBar } from '../components';
import { BarChart, Wallet, Newspaper, BellRing, Paperclip, LogIn, RotateCcw, BookOpenCheck, CircleUserRound, Smile, MessageSquareQuote, Plus } from 'lucide-react'
import {
    Drawer, Button, Typography, IconButton, Dialog, DialogHeader, DialogBody, DialogFooter, ButtonGroup, Card, Alert, Spinner, CardHeader, Input, CardBody, Chip, CardFooter, Tabs, TabsHeader, Tab, Avatar, Tooltip,
    Timeline,
    TimelineItem,
    TimelineConnector,
    TimelineIcon,
    TimelineHeader,
    Popover,
    PopoverHandler,
    PopoverContent
} from "@material-tailwind/react";

import {
    BellIcon,
    ArchiveBoxIcon, MinusCircleIcon,
    CurrencyDollarIcon, ClockIcon, WalletIcon, CircleStackIcon, BookOpenIcon, ForwardIcon, ClipboardDocumentListIcon
} from "@heroicons/react/24/solid";

import { MagnifyingGlassIcon, ChevronUpDownIcon, } from "@heroicons/react/24/outline";
import { PencilIcon, UserPlusIcon } from "@heroicons/react/24/solid";
import { Bell, ArrowRightSquare, Diff, BadgePlus } from 'lucide-react'
import { db, auth, storage } from '@config/firebase.js';
import { collection, query, where, getDocs, getDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { format } from 'date-fns'; // Import format function from date-fns
import { onAuthStateChanged } from 'firebase/auth';
import { AuthCheck } from '@components';

// NOTIFICATION
import { useNotification } from '../context/NotificationContext';

// IMPORTS USER CONTEXT
import { UserContext } from '../context/UserContext';



const AdminHolidayPackages = () => {

    // USER CONTEXT
    const { userDataContext, setUserDataContext } = useContext(UserContext);
    const { addNotification } = useNotification();


    const location = useLocation();
    const { state } = location;
    const navigate = useNavigate();


    const [FileUploadUrl, setFileUploadUrl] = useState("https://media.istockphoto.com/id/1222357475/vector/image-preview-icon-picture-placeholder-for-website-or-ui-ux-design-vector-illustration.jpg?s=612x612&w=0&k=20&c=KuCo-dRBYV7nz2gbk4J9w1WtTAgpTdznHu55W9FjimE=");
    const [Cutoff, setCutoff] = useState(null);
    const [uploadData, setuploadData] = useState(false);

    const [HolidayPackageData, setHolidayPackageData] = useState([]);
    const [dataPrepared, setDataPrepared] = useState(false);



    const fetchPackageData = async () => {
        try {
            const q = query(collection(db, "test"));
            const querySnapshot = await getDocs(q);

            const HolidayPackageDatalocal = [];

            querySnapshot.forEach((doc) => {
                // Extract data from each document along with document ID
                const bookingDataWithId = { id: doc.id, ...doc.data() };
                HolidayPackageDatalocal.push(bookingDataWithId);
            });


            console.log(HolidayPackageDatalocal);
            setHolidayPackageData(HolidayPackageDatalocal);
            setDataPrepared(true);
        } catch (error) {
            console.error("Error fetching pending bookings:", error);
        }
    };


    const fetchDocumentData = async () => {
        try {
            const docRef = doc(db, "users", "WIsJf0LjU8DKG23GiXhC");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                console.log("Document data:", docSnap.data());

                const QrCode = docSnap.data().qrcode_holidays;
                const Cutoff = docSnap.data().cutoffDate_Holidays;
                // console.log("DATA", QrCode);
                setFileUploadUrl(QrCode);
                setCutoff(Cutoff);
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

    useEffect(() => {
        // console.log("ADMIN-H-PACKAGES", userDataContext.data.qrcode_holidays);

        // if (!userDataContext) {
        //     console.log("DATA NOT AVAIBLE");
        // } else {
        fetchPackageData();
        fetchDocumentData();
        // }        
    }, []);


    const OnRefreshClick = () => {
        setDataPrepared(false);
        fetchPackageData();
    }


    const handleNavigation = (link) => {
        navigate(link);
    }

    const ViewPackageData = (id) => {


        let packageItem = HolidayPackageData.find(item => item.id === id);

        console.log(packageItem);

        navigate('/admin/holiday/editpackage', { state: { packageItem } });
    }



    const generateRandomName = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let randomName = '';
        for (let i = 0; i < 20; i++) {
            randomName += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return randomName;
    };

    // Generate a random name for the image



    const uploadImageToFirebaseStorage = async (file) => {
        try {
            // Create a storage reference
            const randomName = generateRandomName();
            const storageRef = ref(storage, `Holiday_Docs/image_${randomName}`);

            // Upload the file to Firebase Storage
            await uploadBytes(storageRef, file);

            // Get the download URL of the uploaded image
            const downloadURL = await getDownloadURL(storageRef);

            addNotification("OR CODE Updated", "success")
            // Return the download URL
            return downloadURL;
        } catch (error) {
            console.error("Error uploading image to Firebase Storage: ", error);
            throw error; // Rethrow the error
        }
    };


    const getPathFromUrl = (url) => {
        const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/carzi-00x.appspot.com/o/';
        const pathWithParams = url.split(baseUrl)[1];
        const path = pathWithParams.split('?')[0];
        return decodeURIComponent(path);
    };

    const deleteFileFromFirebase = (filePath) => {
        const storageRef = ref(storage, filePath);

        deleteObject(storageRef).then(() => {
            console.log('File deleted successfully');
        }).catch((error) => {
            console.error('Error deleting file:', error);
        });
    };



    const RemoveImage = async (imageLink) => {
        const filePath = await getPathFromUrl(imageLink);
        await deleteFileFromFirebase(filePath);
    };

    const updateQRCodeHolidays = async (newQRCodeHolidaysValue) => {
        try {
            const documentRef = doc(db, "users", userDataContext.id);
            await updateDoc(documentRef, {
                qrcode_holidays: newQRCodeHolidaysValue
            });
            console.log("Document successfully updated!");
        } catch (error) {
            console.error("Error updating document: ", error);
        }
    };

    const updateDetailsHolidays = async (value) => {
        try {
            const documentRef = doc(db, "users", "WIsJf0LjU8DKG23GiXhC");
            await updateDoc(documentRef, {
                cutoffDate_Holidays: value
            });
            console.log("Document successfully updated!");
            return true;
        } catch (error) {
            console.error("Error updating document: ", error);
            return false;
        }
    };


    const updateDocFirebase = async () => {

        // console.log("Updating", Cutoff);
        let cutofflocal = Cutoff;
        if (updateDetailsHolidays(cutofflocal)) {

            addNotification("Details Updated", "success");
        }

        else {
            alert("Please Error occured. Please try again");
        }
    }

    const handleFileUpload = async (event) => {
        const OldImage = FileUploadUrl;
        const file = event.target.files[0];
        try {
            setuploadData(true);
            const downloadURL = await uploadImageToFirebaseStorage(file);
            updateQRCodeHolidays(downloadURL);
            // Use the downloadURL for displaying the preview or any other purpose
            console.log("Image uploaded. Preview URL:", downloadURL);
            // Set the preview URL to state or display it in the UI
            setFileUploadUrl(downloadURL);
            setuploadData(false);
            setIsOpenImage(false);
            RemoveImage(OldImage);
            OnRefreshClick();

        } catch (error) {
            console.error("Error uploading image: ", error);
            // Handle error, e.g., display an error message to the user
        }
    };




    const [isOpenImage, setIsOpenImage] = useState(false);





    return (
        <>



            <Dialog size={"xs"} open={isOpenImage} handler={() => setIsOpenImage(false)} className="overflow-auto">
                <DialogHeader className="text-black text-xl font-semibold">
                    <div className="flex gap-2 justify-center items-center">
                        <BadgePlus className='w-8 h-8' />
                        <span>Upload QR-CODE</span>
                    </div>

                </DialogHeader>
                <DialogBody className="px-6 py-4">




                    <label htmlFor="questionInput" className="block text-lg font-bold text-black mb-2">Image Link

                    </label>


                    {/* <input
                        id="questionInput"
                        type="text"
                        placeholder="Enter Image Link"
                        value={selectedImage.image_link || ''}
                        onChange={e => setSelectedImage({ ...selectedImage, image_link: e.target.value })}
                        className="w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 mb-4 focus:outline-none focus:border-blue-500"
                    /> */}



                    <input
                        type="file"
                        id="fileUpload"
                        name="fileUpload"
                        accept="image" // Accept only image files
                        onChange={handleFileUpload}
                    />

                    <p> {uploadData == true ?
                        <span className='text-lg text-red-600 animate-blink'>
                            Please wait the file is Uploading.</span>
                        :
                        ""}</p>

                </DialogBody>
                <DialogFooter className="px-6 py-4 bg-gray-50 flex justify-end rounded-lg">
                    <Button
                        variant="text"
                        color="red"
                        onClick={() => setIsOpenImage(false)}
                        className="px-4 py-2 rounded-md bg-red-500 text-white mr-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        Cancel
                    </Button>
                    {/* <Button
                        variant="gradient"
                        color="green"
                        onClick={()=>setIsOpenImage(false)}
                        className="px-4 py-2 rounded-md text-black hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        Confirm
                    </Button> */}
                </DialogFooter>
            </Dialog>



            {!dataPrepared ? <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
                <div className="rounded-full p-8 bg-white shadow-lg">
                    <Spinner className="h-16 w-16 text-blue-500 animate-spin" />
                </div>
                <p className="mt-4 text-gray-700 text-lg font-semibold">Preparing your data...</p>
            </div> :

                <>

                    <div className='w-full'>
                        <div className="flex lg:items-center justify-between lg:flex-row flex-col sm:mb-1 lg:mb-1">
                            <div className="flex justify-center items-center">
                                <h1 className="p-1 m-2 lg:m-7 rounded-md text-xl font-semibold lg:text-3xl">Holiday Packages</h1>
                            </div>

                            <div className='flex  justify-center items-center'>


                                <button
                                    type="button"
                                    onClick={() => handleNavigation('/admin/holiday/addpackage')}
                                    className="header-button"
                                >
                                    Create New Package
                                    <Plus size={20} />
                                </button>

                                {/* <button
                                    type="button"
                                    // onClick={EditPackage}
                                    className="bg-green-400 mr-10 text-white  flex items-center gap-2 px-3 py-2 rounded-lg  transition-transform duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-md"

                                >
                                    ADD New Location
                                    <Plus size={20} />
                                </button> */}
                            </div>
                        </div>

                        {/* holiday packages */}
                        <div className="p-1 m-2 border mb-4 rounded-md bg-gray-100 lg:mx-10">
                            <section className="mx-auto w-full px-4 lg:px-10 py-4">
                                <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                                    <div className='flex w-full justify-between'>
                                        <h1 className="text-xl font-semibold lg:text-3xl">Active Holiday Packages</h1>

                                        <button
                                            type="button"
                                            className="rounded-md  flex gap-2 justify-between bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                                            onClick={OnRefreshClick}
                                        >
                                            <span className='hidden lg:block'>
                                                Refresh
                                            </span>
                                            <RotateCcw className='h-4 w-4' />
                                        </button>
                                    </div>





                                </div>





                                <div className="mt-6 flex flex-col">
                                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                                        <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                                            <div className="overflow-hidden border border-red-200 md:rounded-lg">


                                                <table className="w-full table-auto text-left border-collapse">
                                                    <thead>
                                                        <tr>
                                                            <th className="border-b border-blue-gray-300 bg-blue-gray-100 p-4">
                                                                <Typography
                                                                    variant="small"
                                                                    color="blue-gray"
                                                                    className="font-semibold leading-none"
                                                                >
                                                                    Package Name
                                                                </Typography>
                                                            </th>
                                                            <th className="border-b border-blue-gray-300 bg-blue-gray-100 p-4">
                                                                <Typography
                                                                    variant="small"
                                                                    color="blue-gray"
                                                                    className="font-semibold leading-none"
                                                                >
                                                                    Location
                                                                </Typography>
                                                            </th>

                                                            <th className="border-b border-blue-gray-300 bg-blue-gray-100 p-4 ">
                                                                <Typography
                                                                    variant="small"
                                                                    color="blue-gray"
                                                                    className="font-semibold leading-none"
                                                                >

                                                                    <span className='text-[16px]'>
                                                                        Duration
                                                                    </span>

                                                                </Typography>
                                                            </th>

                                                            <th className="border-b border-blue-gray-300 bg-blue-gray-100 p-4 ">
                                                                <Typography
                                                                    variant="small"
                                                                    color="blue-gray"
                                                                    className="font-semibold leading-none"
                                                                >
                                                                    <span className='text-[16px]'>
                                                                        Vechiles
                                                                    </span>
                                                                </Typography>
                                                            </th>



                                                            <th className="border-b border-blue-gray-300 bg-blue-gray-100 p-4">
                                                                <Typography
                                                                    variant="small"
                                                                    color="blue-gray"
                                                                    className="font-semibold leading-none"
                                                                >
                                                                    Action
                                                                </Typography>
                                                            </th>

                                                        </tr>
                                                    </thead>
                                                    <tbody>



                                                        {

                                                            HolidayPackageData.length === 0 ? (

                                                                <tr>
                                                                    <td className="p-4 border-b border-blue-gray-300">
                                                                        <Typography variant="small" color="blue-gray" className="font-normal">



                                                                            NA
                                                                        </Typography>
                                                                    </td>
                                                                    <td className={`p-4 border-b border-blue-gray-300 bg-blue-gray-50/95`}>
                                                                        <Typography variant="small" color="blue-gray" className="font-normal">
                                                                            NA
                                                                        </Typography>
                                                                    </td>

                                                                    <td className={`p-4 border-b border-blue-gray-300`}>
                                                                        <Typography variant="small" color="blue-gray" className="font-normal">
                                                                            NA
                                                                        </Typography>
                                                                    </td>

                                                                    <td className={`p-4 border-b border-blue-gray-300 bg-blue-gray-50/95 `}>
                                                                        <Typography variant="small" color="blue-gray" className="font-normal">
                                                                            NA
                                                                        </Typography>
                                                                    </td>
                                                                    <td className={`p-4 border-b border-blue-gray-300  `}>
                                                                        <Typography variant="small" color="blue-gray" className="font-normal">
                                                                            NA
                                                                        </Typography>
                                                                    </td>
                                                                    <td className={`p-4 border-b border-blue-gray-300 `}>
                                                                        <Typography variant="small" color="blue-gray" className="font-normal">
                                                                            NA
                                                                        </Typography>
                                                                    </td>

                                                                </tr>
                                                            ) : (

                                                                HolidayPackageData.map(({ id, location, location_id, duration, vehicle, package_name }, index) => {
                                                                    const isLast = index === HolidayPackageData.length - 1;
                                                                    const classes = isLast ? "p-4" : "p-4 border-b border-blue-gray-300";

                                                                    // const formattedDate = pickupDate ? format(pickupDate.toDate(), "MMMM d, yyyy 'at' h:mm:ss a 'UTC'XXX") : "";

                                                                    return (
                                                                        <tr key={id}>
                                                                            <td className={classes}>
                                                                                <Typography variant="small" color="blue-gray" className="font-normal">
                                                                                    <span className='text-[16px] font-semibold'>
                                                                                        {package_name}
                                                                                    </span>
                                                                                </Typography>
                                                                            </td>
                                                                            <td className={`${classes} bg-blue-gray-50/95`}>
                                                                                <Typography variant="small" color="blue-gray" className="font-normal">

                                                                                    <span className='text-[16px]'> {location} </span>
                                                                                </Typography>
                                                                            </td>

                                                                            <td className={`${classes}`}>
                                                                                <Typography variant="small" color="blue-gray" className="font-normal">
                                                                                    <span className='text-[16px]'>  {duration[0] + ' DAYS ' + duration[1] + ' NIGHTS '} </span>
                                                                                </Typography>
                                                                            </td>

                                                                            <td className={`${classes} bg-blue-gray-50/95 `}>
                                                                                <Typography variant="small" color="blue-gray" className="font-normal">
                                                                                    <span className='text-[16px]'>
                                                                                        {vehicle.length}
                                                                                    </span>
                                                                                </Typography>
                                                                            </td>


                                                                            <td className={`${classes} bg-blue-gray-50/50 font-normal cursor-pointer hover:bg-yellow-200`}
                                                                                onClick={() => ViewPackageData(id)}
                                                                            >
                                                                                <div className="w-max">
                                                                                    <Chip
                                                                                        size="sm"
                                                                                        // variant="ghost"
                                                                                        value={'EDIT DETAILS'}
                                                                                        color={"green"}
                                                                                        className="text-sm font-normal hover:font-semibold"
                                                                                    />
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })

                                                            )
                                                        }

                                                    </tbody>
                                                </table>




                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>



                        <div className='flex flex-col-reverse lg:flex-row gap-1'>

                            {/* QR CODE */}
                            <div className="w-full lg:w-1/2 border p-1 mb-4 rounded-md bg-gray-100 lg:mb-4 lg:m-10">

                                <section className="mx-auto w-full px-4 lg:px-10 py-4">

                                    <h1 className="text-xl font-semibold lg:text-3xl">
                                        Details:
                                    </h1>

                                    <div class="w-full max-w-xs">
                                        <form class="px-8 pt-6 pb-8 mb-4">
                                            <div class="mb-4">
                                                <label className="block text-gray-800 text-md mb-2 font-bold">
                                                    Cutoff Date:
                                                </label>

                                                <div className='flex items-center gap-2'>
                                                    <input class="shadow appearance-none border rounded w-1/2 py-2 px-3
                                                     text-gray-700 leading-tight focus:outline-none font-semibold
                                         focus:shadow-outline"
                                                        id="username"
                                                        type="number"
                                                        value={Cutoff}
                                                        onChange={(e) => setCutoff(e.target.value)}
                                                        placeholder="Cutoff Date" />

                                                    <span className="text-xl">Days</span>
                                                </div>
                                            </div>

                                            <div class="flex items-center justify-between">
                                                <button
                                                    type="button"
                                                    className="rounded-md mt-2  flex gap-1 justify-between
                                             bg-black px-3 py-2 text-sm font-semibold
                                              text-white shadow-sm hover:bg-black/80
                                               focus-visible:outline focus-visible:outline-2
                                                focus-visible:outline-offset-2 focus-visible:outline-black"
                                                    onClick={updateDocFirebase}
                                                >
                                                    Update Details
                                                </button>

                                            </div>
                                        </form>

                                    </div>
                                </section>
                            </div>
                            {/*  */}



                            {/* QR CODE */}
                            <div className="p-1 m-2 w-full lg:w-1/2 border mb-4 rounded-md bg-gray-100 lg:mb-4 lg:m-10">
                                <section className="mx-auto w-full px-4 lg:px-10 py-4">
                                    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                                        <div className='flex w-full justify-between'>
                                            <h1 className="text-xl font-semibold lg:text-3xl">
                                                QR CODE
                                            </h1>

                                            <button
                                                type="button"
                                                className="rounded-md  flex gap-1 justify-between
                                             bg-black px-3 py-2 text-sm font-semibold
                                              text-white shadow-sm hover:bg-black/80
                                               focus-visible:outline focus-visible:outline-2
                                                focus-visible:outline-offset-2 focus-visible:outline-black"
                                                onClick={() => setIsOpenImage(true)}
                                            >
                                                Upload New <Plus className='h-5 w-5' />
                                            </button>
                                        </div>



                                    </div>


                                    <div className="mt-6 flex flex-col">


                                        <div className='flex flex-col mb-4 gap-3'>

                                            {/* {FilePreviewUrl && ( */}
                                            <div className="mb-4 w-max">
                                                <label className="block text-md mb-2 font-bold">Current QR Preview:</label>
                                                <img src={FileUploadUrl}
                                                    alt="QR-CODE"
                                                    className="w-90 h-60 rounded-md border-gray-800 border-2
                                                focus:border-black p-2
                                                object-contain" />
                                            </div>
                                            {/* )} */}
                                        </div>

                                    </div>
                                </section>
                            </div>
                            {/*  */}
                        </div>



                    </div>


                    {/* <div className='w-full'>

                        <div className="p-1 m-2 border mb-4 rounded-md bg-gray-100 lg:mb-4 lg:m-10">
                            <section className="mx-auto w-full px-4 lg:px-10 py-4">
                                <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                                    <div className='flex w-full justify-between'>
                                        <h1 className="text-xl font-semibold lg:text-3xl">SERACH Holiday Packages </h1>

                                    </div>
                                </div>





                                <div className="mt-6 flex flex-col">
                                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                                        <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                                            <div className="overflow-hidden border border-red-200 md:rounded-lg">


                                                <table className="w-full table-auto text-left border-collapse">
                                                    <thead>
                                                        <tr>
                                                            <th className="border-b border-blue-gray-300 bg-blue-gray-100 p-4">
                                                                <Typography
                                                                    variant="small"
                                                                    color="blue-gray"
                                                                    className="font-semibold leading-none"
                                                                >
                                                                    Serach By


                                                                </Typography>
                                                            </th>
                                                            <th className="border-b border-blue-gray-300 bg-blue-gray-100 p-4">
                                                                <Typography
                                                                    variant="small"
                                                                    color="blue-gray"
                                                                    className="font-semibold leading-none"
                                                                >
                                                                    Value
                                                                </Typography>
                                                            </th>

                                                            <th className="border-b border-blue-gray-300 bg-blue-gray-100 p-4">
                                                                <Typography
                                                                    variant="small"
                                                                    color="blue-gray"
                                                                    className="font-semibold leading-none"
                                                                >
                                                                    Action
                                                                </Typography>
                                                            </th>

                                                        </tr>
                                                    </thead>
                                                    <tbody>



                                                        {

                                                            ConfirmedBookings.length === 0 ? (

                                                                <tr>
                                                                    <td className="p-4 border-b border-blue-gray-300">
                                                                        <Typography variant="small" color="blue-gray" className="font-normal">



                                                                            NA
                                                                        </Typography>
                                                                    </td>
                                                                    <td className={`p-4 border-b border-blue-gray-300 bg-blue-gray-50/95`}>
                                                                        <Typography variant="small" color="blue-gray" className="font-normal">
                                                                            NA
                                                                        </Typography>
                                                                    </td>

                                                                    <td className={`p-4 border-b border-blue-gray-300`}>
                                                                        <Typography variant="small" color="blue-gray" className="font-normal">
                                                                            NA
                                                                        </Typography>
                                                                    </td>

                                                                    <td className={`p-4 border-b border-blue-gray-300 bg-blue-gray-50/95 `}>
                                                                        <Typography variant="small" color="blue-gray" className="font-normal">
                                                                            NA
                                                                        </Typography>
                                                                    </td>
                                                                    <td className={`p-4 border-b border-blue-gray-300  `}>
                                                                        <Typography variant="small" color="blue-gray" className="font-normal">
                                                                            NA
                                                                        </Typography>
                                                                    </td>
                                                                   

                                                                </tr>
                                                            ) : (

                                                                ConfirmedBookings.map(({ }, index) => {
                                                                    const isLast = index === ConfirmedBookings.length - 1;
                                                                    const classes = isLast ? "p-4" : "p-4 border-b border-blue-gray-300";


                                                                    return (
                                                                        <tr>
                                                                            <td className={classes}>
                                                                                <Typography variant="small" color="blue-gray" className="font-normal">
                                                                                    <select name="" className="w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 mb-4 focus:outline-none focus:border-blue-500">
                                                                                        <option value="">UserName</option>
                                                                                        <option value="">Contact</option>
                                                                                        <option value="">Location</option>
                                                                                        <option value="">PackageName</option>
                                                                                        <option value="">Transaction-ID</option>
                                                                                        <option value="">UPI-ID</option>
                                                                                    </select>
                                                                                </Typography>
                                                                            </td>
                                                                            <td className={`${classes} bg-blue-gray-50/95`}>
                                                                                <Typography variant="small" color="blue-gray" className="font-normal">
                                                                                    <input
                                                                                        type="text"
                                                                                        placeholder="Enter your value to serach by"
                                                                                        // value={holidayData ? holidayData.package_name : ''}
                                                                                        // onChange={e => setholidayData(prevState => ({ ...prevState, location: e.target.value }))}
                                                                                        className="w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 mb-4 focus:outline-none focus:border-blue-500"
                                                                                    />
                                                                                </Typography>
                                                                            </td>





                                                                            <td className={`${classes} bg-blue-gray-50/50 cursor-pointer hover:bg-yellow-200`}
                                                                                onClick={() => ViewPackageData(id)}
                                                                            >
                                                                                <div className="w-max">
                                                                                    <Chip
                                                                                        size="sm"
                                                                                        variant="ghost"
                                                                                        value={'SERACH RECORD'}
                                                                                        color={"green"}
                                                                                    />
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })

                                                            )
                                                        }

                                                    </tbody>
                                                </table>




                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>











                    </div> */}












                </>

            }
        </>
    );
};

export default AuthCheck(AdminHolidayPackages);
