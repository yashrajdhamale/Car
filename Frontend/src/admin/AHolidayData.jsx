import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '@config/firebase.js';
import { collection, doc, getDoc, setDoc, getDocs, query, where, updateDoc } from "firebase/firestore";
import { ArrowBigRightDash, IndianRupee } from 'lucide-react'


import {
    Drawer, Button, Typography, IconButton, Dialog, DialogHeader, DialogBody, DialogFooter, ButtonGroup, Card, Alert, Spinner, CardHeader, Input, CardBody, Chip, CardFooter, Tabs, TabsHeader, Tab, Avatar, Tooltip,
    Timeline,
    TimelineItem,
    TimelineConnector,
    TimelineIcon,
    TimelineHeader,
    Popover,
    PopoverHandler,
    PopoverContent,
} from "@material-tailwind/react";


import {
    BellIcon,
    ArchiveBoxIcon, MinusCircleIcon,
    CurrencyDollarIcon, ClockIcon, WalletIcon, CircleStackIcon, BookOpenIcon, ForwardIcon, ClipboardDocumentListIcon
} from "@heroicons/react/24/solid";

import { AuthCheck } from '@components';



function AHolidayData() {



    // useEffect(() => {
    //     // Add an authentication observer
    //     const unsubscribe = onAuthStateChanged(auth, (user) => {
    //         if (user) {
    //             // User is signed in
    //             // setUser(user);
    //             // console.log(user);
    //         } else {
    //             // User is signed out
    //             setUser(null);
    //             navigate('/admin/login')
    //         }
    //     });

    //     return () => unsubscribe();
    // }, []);



    const location = useLocation();
    const { state } = location;
    const navigate = useNavigate();

    let PackageUserData = state && state.packageItem;
    let FunctionData = state && state.functionName;
    console.log(FunctionData);

    console.log('Package', PackageUserData);


    const docId = PackageUserData.id;

    const [holidayData, setHolidayData] = useState(null); // Initialize state


    const [dataPrepared, setDataPrepared] = useState(false);
    
    useEffect(() => {
        const fetchAllTestData = async () => {
            try {
                const docRef = doc(db, "bookings", docId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    // Update state with fetched data
                    setHolidayData(docSnap.data());


                    setDataPrepared(true);
                    // console.log('Updated', docSnap.data());
                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchAllTestData();
    }, []);



    const UpdateHolidayRecord = async () => {

        const today = new Date();
        const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
        // Define the data you want to update in the document

        const newData = {
            apporval: "Confirmed",
            confirmation_Date: formattedDate,
        };

        // Get a reference to the document
        const docRef = doc(db, "bookings", docId);

        // Update the document with the new data
        try {
            await updateDoc(docRef, newData);
            console.log("Document successfully updated!");
            navigate('/admin/holiday');

        } catch (error) {
            console.error("Error updating document: ", error);
        }
    }




    // function Nextphase(){}
    //HANDLE CURRENT EXAM CLICK:
    const [CurrentPackageOpen, setCurrentPackageOpen] = useState(false);
    const [CurrentPackageOpenData, setCurrentPackageOpenData] = useState([]);








    const HandleCurrentPackageOpen = () => setCurrentPackageOpen(!CurrentPackageOpen);

    const HandleStartExamPopUp = () => {
        setCurrentPackageOpen(!CurrentPackageOpen);
        // alert(id);

        // Nextphase();
    };


    const HandleCurrentPackageOpenExamPage = () => {
        // console.log('Current', CurrentPackageOpenData);
        // alert(CurrentPackageOpenData.testid);
        // const features = 'width=800,height=600,top=100,left=100,toolbar=no,location=no,menubar=no,status=no,resizable=yes,scrollbars=yes';




        // navigate('/exammode');
    }


    function formatStringDate(dateString) {
        // Create a Date object from the string
        const date = new Date(dateString);

        // Get the day, month, and year components
        const day = date.getDate();
        const month = date.getMonth(); // Months are zero-indexed (January = 0)
        const year = date.getFullYear();

        // Convert month number to month name (April)
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        const monthName = monthNames[month];

        // Format the date in the desired format
        return `${day} ${monthName} ${year}`;
    }

    function convertTo12HourFormat(time24) {
        // Split the time string into hours and minutes
        const [hour, minute] = time24.split(':').map(Number);

        // Determine if it's AM or PM
        const period = hour >= 12 ? 'PM' : 'AM';

        // Convert the hour from 24-hour format to 12-hour format
        const hour12 = hour % 12 || 12; // Converts "00" to "12" and handles "12" as noon/midnight correctly

        // Return the formatted time
        return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
    }


    return (
        <>




            {/* CURRENT EXAM START */}
            <Dialog
                open={CurrentPackageOpen}
                size={"sm"} //xs
                handler={HandleCurrentPackageOpen}
            >
                <DialogHeader className='flex gap-2 m-3 lg:m-5 lg:text-3xl'>

                    <ClipboardDocumentListIcon className='w-8 h-8' />

                    Holiday Confirmation:
                </DialogHeader>
                <DialogBody>
                    {/* The key to more success is to have a lot of pillows. Put it this way,
                    it took me twenty five years to get these plants, twenty five years of
                    blood sweat and tears, and I&apos;m never giving up, I&apos;m just
                    getting started. I&apos;m up to something. Fan luv. */}
                    <div className="">
                        <Timeline>
                            {/* <TimelineItem className="h-28">
                                <TimelineConnector className="!w-[78px]" />
                                <TimelineHeader className="relative rounded-xl border border-blue-gray-50 bg-white py-3 pl-4 pr-8 shadow-lg shadow-blue-gray-900/5">
                                    <TimelineIcon className="p-3" variant="ghost">
                                        <WalletIcon className="h-5 w-5" />
                                    </TimelineIcon>
                                    <div className="flex flex-col gap-1">
                                        <Typography variant="h6" color="blue-gray">
                                            Package: {CurrentPackageOpenData.package_name}

                                    </div>
                                </TimelineHeader>
                            </TimelineItem> */}
                            <TimelineItem className="h-28 ">
                                <TimelineConnector className="!w-[78px]" />
                                <TimelineHeader className="relative hover:bg-yellow-100 rounded-xl border border-blue-gray-50 bg-white py-3 pl-4 pr-8 shadow-lg shadow-blue-gray-900/5">
                                    <TimelineIcon className="p-3" variant="ghost" color="red">
                                        <CircleStackIcon className="h-5 w-5" />
                                    </TimelineIcon>
                                    <div className="flex flex-col gap-1">
                                        <Typography variant="h6" color="blue-gray">
                                            Package Name: 3 DAYS 4 NIGHTS
                                        </Typography>
                                        {/* <Typography variant="small" color="gray" className="font-normal">
                                            21 DEC 11 PM
                                        </Typography> */}
                                    </div>
                                </TimelineHeader>
                            </TimelineItem>
                            <TimelineItem className="h-28">
                                <TimelineConnector className="!w-[78px]" />

                                <TimelineHeader
                                    className="relative hover:bg-yellow-100 rounded-xl border border-blue-gray-50 bg-white py-3 pl-4 pr-8 shadow-lg shadow-blue-gray-900/5">
                                    <TimelineIcon className="p-3" variant="ghost" color="green">
                                        <ClockIcon className="h-5 w-5" />
                                    </TimelineIcon>
                                    <div className="flex flex-col gap-1">
                                        <Typography variant="h6" color="blue-gray">
                                            UserName:  {holidayData ? holidayData.name : "Loading..."}
                                        </Typography>
                                        {/* <Typography variant="small" color="gray" className="font-normal">
                                            20 DEC 2:20 AM
                                        </Typography> */}
                                    </div>
                                </TimelineHeader>
                            </TimelineItem>
                            <TimelineItem className="h-28">
                                {/* <TimelineConnector className="!w-[78px]" /> */}

                                <TimelineHeader
                                    className="relative hover:bg-yellow-100 rounded-xl border border-blue-gray-50 bg-white py-3 pl-4 pr-8 shadow-lg shadow-blue-gray-900/5">

                                    {/* // className="relative rounded-xl border border-blue-gray-50 bg-white py-3 pl-4 pr-8 shadow-lg shadow-blue-gray-900/5"> */}
                                    <TimelineIcon className="p-3" variant="ghost" color="orange">
                                        <BookOpenIcon className="h-5 w-5" />
                                    </TimelineIcon>
                                    <div className="flex flex-col gap-1">
                                        <Typography variant="h6" color="blue-gray">
                                            Final Cost:  {holidayData ? holidayData.LocationData.selectedplan.Price : "Loading..."}
                                        </Typography>

                                    </div>
                                </TimelineHeader>
                            </TimelineItem>






                        </Timeline>
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button
                        variant="text"
                        color="red"
                        onClick={() => HandleCurrentPackageOpen(null)}
                        className="mr-1"
                    >
                        <span>Cancel</span>
                    </Button>
                    <Button
                        variant="gradient"
                        color="green"
                        // onClick={() => HandleCurrentPackageOpenExamPage()}
                        onClick={UpdateHolidayRecord}
                    >
                        <span>Proceed Now</span>
                    </Button>
                </DialogFooter>
            </Dialog>



            {!dataPrepared ? <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
                <div className="rounded-full p-8 bg-white shadow-lg">
                    <Spinner className="h-16 w-16 text-blue-500 animate-spin" />
                </div>
                <p className="mt-4 text-gray-700 text-lg font-semibold">Preparing your data...</p>
            </div> :


                <div className='flex justify-center items-center'>






                    <div className="overflow-hidden  w-full m-10" >
                        {/* <div className="mb-4 flex items-center rounded-lg py-2">
                    <div className="flex flex-1">
                        <p className="text-2xl font-bold ">
                            Test Details
                        </p>
                    </div>
                </div> */}




















                        <div className="my-5 flex items-center justify-between lg:flex-row flex-col py-2">
                            <div className="flex">
                                <p className="text-3xl font-bold ">
                                    Holiday Details Submitted By User:


                                </p>
                            </div>


                            {(FunctionData == "APPROVE") ?  
                            <button
                                type="button"
                                // onClick={UpdateHolidayRecord}
                                onClick={(e) => HandleStartExamPopUp()}
                                    className="bg-green-400 text-white  flex items-center gap-2 px-3 py-2 
                                rounded-lg  transition-transform duration-200 hover:-translate-x-1 
                                text-xl hover:bg-green-700
                                hover:-translate-y-1 hover:shadow-md"

                            >
                                Approve Holiday <ArrowBigRightDash />
                                {/* <Plus size={20} /> */}
                            </button>
                                :


                                <button
                                    type="button"
                                    // onClick={UpdateHolidayRecord}
                                    // onClick={(e) => HandleStartExamPopUp()}
                                    className="bg-black text-white text-lg  flex items-center gap-2 px-3 py-2 rounded-lg  transition-transform duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-md"

                                >
                                    Confirmated Date: {formatStringDate(PackageUserData.confirmation_Date)}
                                    {/* {PackageUserData.confirmation_Date} */}
                                    {/* <Plus size={20} /> */}
                                </button>
                            }
                        </div>

                        <div className='border-2 p-10 shadow-md'>
                            <table className="w-full border border-black">
                                <tbody>
                                    {/* Personal Details Section */}
                                    <tr>
                                        <th colSpan="2" className="p-2 text-lg lg:text-2xl font-bold border border-black bg-gray-200">
                                            <div className="flex gap-5 justify-center text-center items-center">

                                                <span>
                                                    Registration Number -
                                                    <span className="underline mx-2">
                                                        {holidayData.RegNumber1}
                                                    </span>
                                                </span>

                                                <span className={`bg-yellow-200 p-1 rounded-lg m-2 text-lg
                                        ${holidayData.OnRequest == true ? '' : 'hidden'}
                                        `}>
                                                    {(holidayData.OnRequest == true) ? "Booking-OnRequest" : ""}
                                                </span>
                                            </div>

                                        </th>
                                    </tr>

                                    <tr>
                                        <th colSpan="2" className="p-2 text-lg lg:text-2xl font-bold border border-black bg-gray-200">
                                            Personal Details
                                        </th>
                                    </tr>


                                    <tr className='hover:bg-yellow-100'>
                                        <th className="p-2 text-lg font-bold border border-black">Name</th>
                                        <td className="text-lg font-bold border border-black w-1/2 text-center">
                                            {holidayData ? holidayData.name : "Loading..."}
                                        </td>
                                    </tr>

                                    <tr className='hover:bg-yellow-100'>
                                        <th className="p-2 text-lg font-bold border border-black">User Guest Count</th>
                                        <td className="text-lg font-bold border border-black w-1/2 text-center">
                                            {holidayData ? (
                                                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                                                    <p style={{ marginBottom: '10px' }}>
                                                        <span style={{ fontWeight: 'bold' }}>ADULT: </span>

                                                        <span className='border-2 text-xl border-gray-400 px-2'>
                                                            {holidayData.GuestCountData[0]}
                                                        </span> &nbsp; {' + '} &nbsp;

                                                        <span style={{ fontWeight: 'bold' }}>Child: </span>

                                                        <span className='border-2 text-xl border-gray-400 px-2'>
                                                            {holidayData.GuestCountData[1]}
                                                        </span>

                                                        &nbsp; {' = '} &nbsp;

                                                        <span className='bg-yellow-200 text-xl text-center px-2'>
                                                            <span style={{ fontWeight: 'bold' }}>Total: </span>
                                                            {holidayData.GuestCountData[0] + holidayData.GuestCountData[1]}
                                                        </span>
                                                    </p>
                                                </div>
                                            ) : "Loading..."}

                                        </td>
                                    </tr>

                                    <tr className='hover:bg-yellow-100'>
                                        <th className="p-2 text-lg font-bold border border-black">Address</th>
                                        <td className="text-lg font-bold border text-center border-black w-1/2 p-3">
                                            {holidayData ? holidayData.pickupAdress : "Loading..."}
                                        </td>
                                    </tr>

                                    <tr>
                                        <th colSpan="2"
                                            className="p-2 text-lg lg:text-xl font-bold border border-black bg-gray-200">
                                            Contact
                                        </th>
                                    </tr>


                                    <tr className='hover:bg-yellow-100'>
                                        <th className="p-2 text-lg font-bold border border-black">Phone1</th>
                                        <td className="text-lg font-bold border border-black w-1/2 text-center">
                                            {holidayData ? holidayData.phone1 : "Loading..."}
                                        </td>
                                    </tr>
                                    <tr className='hover:bg-yellow-100'>
                                        <th className="p-2 text-lg font-bold border border-black">Phone2</th>
                                        <td className="text-lg font-bold border border-black w-1/2 text-center">
                                            {holidayData ? holidayData.phone2 : "Loading..."}
                                        </td>
                                    </tr>

                                    <tr className='hover:bg-yellow-100'>
                                        <th className="p-2 text-lg font-bold border border-black">Email</th>
                                        <td className="text-lg font-bold border border-black w-1/2 text-center">
                                            {holidayData ? holidayData.email : "Loading..."}
                                        </td>
                                    </tr>

                                    <tr className='hover:bg-yellow-100'>
                                        <th className="p-2 text-lg font-bold border border-black">Booked date (by user)</th>
                                        <td className="text-lg font-bold border border-black w-1/2 text-center">
                                            {holidayData ? formatStringDate(holidayData.BookedDate) : "Loading..."}
                                        </td>
                                    </tr>

                                    <tr>
                                        <th colSpan="2"
                                            className="p-2 text-lg font-bold border border-black lg:text-xl bg-gray-200">
                                            Pickup & Dropup Dates 

                                        </th>
                                    </tr>





                                    <tr className='hover:bg-yellow-100'>
                                        <th className="p-2 text-lg font-bold border border-black">PickUp date</th>
                                        <td className="text-lg font-bold border border-black w-1/2 text-center">
                                            {holidayData ? convertTo12HourFormat(holidayData.pickupTime) + " - " + formatStringDate(holidayData.PickUpDate) : "Loading..."}
                                        </td>
                                    </tr>

      <tr className='hover:bg-yellow-100'>
                                        <th className="p-2 text-lg font-bold border border-black">PickUp date</th>
                                        <td className="text-lg font-bold border border-black w-1/2 text-center">
                                            {holidayData ? convertTo12HourFormat(holidayData.pickupTime) + " - " + formatStringDate(holidayData.PickUpDate) : "Loading..."}
                                        </td>
                                    </tr>

                                    <tr className='hover:bg-yellow-100'>
                                        <th className="p-2 text-lg font-bold border border-black">DropUp date</th>
                                        <td className="text-lg font-bold border border-black w-1/2 text-center">
                                            {/* {holidayData ? formatStringDate(holidayData.dropupDate) : "Loading..."} */}
                                            {/* {holidayData ? holidayData.dropupDate : "Loading..."} */}
                                            {holidayData ? formatStringDate(holidayData.DropUpDate) : "Loading..."}
                                        </td>
                                    </tr>

                                    {/* Payment Section */}
                                    <tr>
                                        <th colSpan="2"
                                            className="p-2 text-lg lg:text-xl font-bold border border-black bg-gray-200">
                                            Payment
                                        </th>
                                    </tr>





                                    {/* Contact Section */}

                                    <tr className='hover:bg-yellow-100'>
                                        <th className="p-2 text-lg font-bold border border-black">UPI ID</th>
                                        <td className="text-lg font-bold border border-black w-1/2 text-center">
                                            {holidayData ? holidayData.upiid : "Loading..."}
                                        </td>
                                    </tr>

                                    <tr className='hover:bg-yellow-100'>
                                        <th className="p-2 text-lg font-bold border border-black">Transaction ID</th>
                                        <td className="text-lg font-bold border border-black w-1/2 text-center">
                                            {holidayData ? holidayData.transactionid : "Loading..."}
                                        </td>
                                    </tr>

                                    <tr>
                                        <th colSpan="2"
                                            className="p-2 text-lg lg:text-xl font-bold border border-black bg-gray-200">
                                            Any Special Request ?
                                        </th>
                                    </tr>


                                    <tr className='hover:bg-yellow-100'>
                                        <th className="p-2 text-lg font-bold border border-black">Message</th>
                                        <td className="text-lg font-bold border text-center border-black w-1/2 p-3">
                                            {holidayData ? (holidayData.message == "" ? "NA" : holidayData.message) : "Loading..."}

                                        </td>
                                    </tr>
                                </tbody>
                            </table>


                        </div>

                        <br />


                        <div className="my-5 flex items-center justify-between lg:flex-row flex-col py-2">
                            <div className="flex">
                                <p className="text-2xl font-bold ">
                                    Vehicle Details
                                </p>
                            </div>
                        </div>


                        <div className='border-2 p-10 shadow-md'>
                            <table className="w-full border border-black">
                                <tbody>
                                    {/* Personal Details Section */}
                                    <tr>
                                        <th colSpan="2" className="p-2 text-lg font-bold border border-black bg-gray-200">
                                            <div className="flex items-center lg:text-2xl justify-center">
                                                <span>Total Price: </span>
                                                <span className='text-bold text-red-500 text-xl lg:text-2xl'>
                                                    {holidayData ? (
                                                        <div className='flex items-center p-2'>
                                                            <IndianRupee className='text-bold' />
                                                            {holidayData.LocationData.selectedplan.Price + '/-'} {' '} {'with ALL Taxes'}
                                                        </div>
                                                    ) : (
                                                        "Loading..."
                                                    )}
                                                </span>
                                            </div>
                                        </th>
                                    </tr>


                                    <tr>
                                        <th colSpan="2" className="p-2 text-lg font-bold border border-black bg-gray-200">
                                            Package Details
                                        </th>
                                    </tr>


                                    <tr className='hover:bg-yellow-100'>
                                        <th className="p-2 text-lg font-bold border border-black hover:bg-yellow-100">Name</th>
                                        <td className="text-lg font-bold border border-black w-1/2 text-center">
                                            {/* {'3 DAYS 4 NIGHTS'} */}
                                            {holidayData ? holidayData.LocationData.package_name : "Loading..."}
                                        </td>
                                    </tr>

                                    <tr>
                                        <th colSpan="2" className="p-2 text-lg font-bold border border-black bg-gray-200">
                                            Selected Vehicle
                                        </th>
                                    </tr>


                                    <tr className='hover:bg-yellow-100'>
                                        <th className="p-2 text-lg font-bold border border-black">Vehicle-Name</th>
                                        <td className="text-lg font-bold border border-black w-1/2 text-center">
                                            {holidayData ? holidayData.LocationData.selectedplan.VechileName : "Loading..."}
                                        </td>
                                    </tr>
                                    <tr className='hover:bg-yellow-100'>
                                        <th className="p-2 text-lg font-bold border border-black">Vehicle-Price</th>
                                        <td className="text-lg font-bold border border-black w-1/2 text-center">
                                            {holidayData ? holidayData.LocationData.selectedplan.Price : "Loading..."}
                                        </td>
                                    </tr>

                                    <tr className='hover:bg-yellow-100'>
                                        <th className="p-2 text-lg font-bold border border-black"> Max Vehicle Capacity</th>
                                        <td className="text-lg font-bold border border-black w-1/2 text-center">
                                            {holidayData ? holidayData.LocationData.selectedplan.GuestCount : "Loading..."}
                                        </td>
                                    </tr>




                                </tbody>
                            </table>


                        </div>


                        <br />


                        <div className="my-5 flex items-center justify-between lg:flex-row flex-col py-2">
                            <div className="flex">
                                <p className="text-2xl font-bold ">
                                    Documents Submitted:
                                </p>
                            </div>
                        </div>


                        <div className='border-2 p-10 shadow-md'>
                            <table className="w-full border border-black">
                                <tbody>
                                    {/* Personal Details Section */}


                                    <tr className=''>
                                        <th className="p-2 text-lg font-bold border border-black">Identity Proof :

                                        </th>

                                        <th className="text-lg font-bold border border-black w-1/2 text-center">
                                            Payment Proof :
                                        </th>
                                    </tr>

                                    <tr className=''>
                                        <td className="p-2 text-lg font-bold  hover:bg-yellow-100">

                                            <div className="mb-4 w-full flex justify-center items-center">
                                                <img src={holidayData.DocumentProofUrl}
                                                    alt="QR-CODE"
                                                    className="w-90 h-60 rounded-md border-gray-800
                                                object-contain" />
                                            </div>
                                        </td>

                                        <td className="text-lg font-bold border border-black w-1/2 hover:bg-yellow-100 text-center">
                                            {/* {holidayData ? holidayData.LocationData.package_name : "Loading..."} */}
                                            <div className="mb-4 w-full flex justify-center items-center">
                                                <img src={holidayData.PaymentProof}
                                                    alt="QR-CODE"
                                                    className="w-90 h-60 rounded-md border-gray-800
                                                object-contain" />
                                            </div>
                                        </td>
                                    </tr>







                                </tbody>
                            </table>


                        </div>



                        {/* {questions.map((question, index) => (
                    <div key={index} className='border-2 rounded-lg p-3 w-full flex items-center gap-4'>
                        <p className="p-2 text-lg font-bold">{index + 1}.</p>
                        <input
                            type="text"
                            placeholder="Question"
                            value={question.question}
                            disabled
                            className='flex h-10 w-full rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600'
                        />
                        {question.options.map((option, optionIndex) => (
                            <div key={optionIndex}>
                                <input
                                    type="text"
                                    placeholder={`Option ${optionIndex + 1}`}
                                    value={option}
                                    disabled
                                    className={`flex h-10 rounded-md border-2 border-black/30 px-3 py-2 text-sm placeholder:text-gray-600
                                                ${question.answer === option ? "bg-green-200 border-green-500" : "" }
                                    `}
                                />
                            </div>
                        ))}
                        <button
                            className="px-5 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={() => handleEdit(index)}
                        >
                            Edit
                        </button>
                    </div>
                ))} */}



                    </div >
                </div >

            }
        </>
    )
}

export default AuthCheck(AHolidayData)