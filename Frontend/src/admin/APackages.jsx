import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
// import { ASideBar, ANavBar } from '../components';
import { BarChart, Wallet, Newspaper, BellRing, Paperclip, LogIn, RotateCcw, BookOpenCheck, CircleUserRound, Smile, MessageSquareQuote } from 'lucide-react'
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

import { MagnifyingGlassIcon, ChevronUpDownIcon, } from "@heroicons/react/24/outline";
import { PencilIcon, UserPlusIcon } from "@heroicons/react/24/solid";
import { Bell, ArrowRightSquare, Diff } from 'lucide-react'
import { db, auth } from '@config/firebase.js';
import { collection, query, where, getDocs } from "firebase/firestore";
import { format } from 'date-fns';
import { onAuthStateChanged } from 'firebase/auth';
import { AuthCheck } from '@components';


const APackages = () => {



    useEffect(() => {
        // Add an authentication observer
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is signed in
                // setUser(user);
                // console.log(user);
            } else {
                // User is signed out
                setUser(null);
                navigate('/admin/login')
            }
        });

        return () => unsubscribe();
    }, []);


    const location = useLocation();
    const { state } = location;
    const navigate = useNavigate();






    const [PackagesData, setPackagesData] = useState([]);
    const [dataPrepared, setDataPrepared] = useState(false);



    const fetchPackagesData = async () => {
        try {
            const q = query(collection(db, "test"));
            const querySnapshot = await getDocs(q);

            const PackagesDataData = [];
            const confirmedBookingsData = [];

            querySnapshot.forEach((doc) => {
                // Extract data from each document along with document ID
                const bookingDataWithId = { id: doc.id, ...doc.data() };

                const currentDate = new Date();
                const tenDaysAgo = new Date(currentDate.getTime() - 10 * 24 * 60 * 60 * 1000); // Calculate the date 10 days ago
                const confirmationDate = new Date(bookingDataWithId.confirmation_Date);
                console.log(confirmationDate);

                // MM/DD/YYYY

                // Check if the booking is pending or confirmed based on its status
                if (bookingDataWithId.apporval === "pending") {
                    PackagesDataData.push(bookingDataWithId);
                } else if (bookingDataWithId.apporval === "Confirmed") {
                    // confirmedBookingsData.push(bookingDataWithId);
                    if (confirmationDate >= tenDaysAgo && confirmationDate <= currentDate) {
                        confirmedBookingsData.push(bookingDataWithId);
                    }
                }






            });


            // console.log(PackagesDataData);
            // Set the pending bookings array in state
            setPackagesData(PackagesDataData);
            setConfirmedBookings(confirmedBookingsData);

            setDataPrepared(true);
        } catch (error) {
            console.error("Error fetching pending bookings:", error);
        }
    };
    useEffect(() => {
        // fetchPackagesData();
    }, []);


    const OnRefreshClick = () => {
        setDataPrepared(false);
        fetchPackagesData();
    }


    const ViewPackageData = (id, params_fun) => {


        let packageItem = [];

        if (params_fun === "APPROVE") {

            packageItem = PackagesData.find(item => item.id === id);
        }
        else {
            packageItem = ConfirmedBookings.find(item => item.id === id);

        }

        let functionName = params_fun;
        console.log(packageItem);

        // TODO : Set the route and pass the data accordingly 
        navigate('/admin/holiday/approval', { state: { packageItem, functionName } });
    }


    return (
        <>


            {!dataPrepared ? <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
                <div className="rounded-full p-8 bg-white shadow-lg">
                    <Spinner className="h-16 w-16 text-blue-500 animate-spin" />
                </div>
                <p className="mt-4 text-gray-700 text-lg font-semibold">Preparing your data...</p>
            </div> :

                <>



                    <div className='w-full'>
                        <div>
                            <h1 className="p-1 m-7 rounded-m lg:m-10 text-2xl font-semibold lg:text-3xl">
                                DashBoard</h1>
                        </div>

                        {/* <Card className="p-1 m-2 border mb-4 rounded-md bg-gray-100 lg:mb-4 lg:m-10 overflow-scroll">

                            <h1 className="text-xl m-5 font-semibold text-black lg:text-3xl">Upcoming Exams</h1>

                            <table className="w-full m-5 table-auto text-left">
                                <thead>
                                    <tr>
                                        {TABLE_HEAD.map((head) => (
                                            <th key={head} className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                                                <Typography
                                                    variant="small"
                                                    color="blue-gray"
                                                    className="font-normal leading-none opacity-70"
                                                >
                                                    {head}
                                                </Typography>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {TABLE_ROWS.map(({ name, job, date }, index) => {
                                        const isLast = index === TABLE_ROWS.length - 1;
                                        const classes = isLast ? "p-4" : "p-4 border-b border-blue-gray-50";

                                        return (
                                            <tr key={name}>
                                                <td className={classes}>
                                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                                        {name}
                                                    </Typography>
                                                </td>
                                                <td className={`${classes} bg-blue-gray-50/50`}>
                                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                                        {job}
                                                    </Typography>
                                                </td>
                                                <td className={classes}>
                                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                                        {date}
                                                    </Typography>
                                                </td>
                                                <td className={`${classes} bg-blue-gray-50/50`}>
                                                    <Typography as="a" href="#" variant="small" color="blue-gray" className="font-medium">
                                                        Edit
                                                    </Typography>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </Card> */}


                        {/* UPCOMING EXAMS */}
                        <div className="p-1 m-2 border mb-4 rounded-md bg-gray-100 lg:mb-4 lg:m-10">
                            <section className="mx-auto w-full px-4 lg:px-10 py-4">
                                <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                                    <div className='flex w-full justify-between'>
                                        <h1 className="text-xl font-semibold lg:text-3xl">Pending Holiday Packages</h1>

                                        <button
                                            type="button"
                                            className="rounded-md  flex gap-2 justify-between bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                                            onClick={OnRefreshClick}
                                        >
                                            Refresh <RotateCcw className='h-4 w-4' />
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
                                                                    Name
                                                                </Typography>
                                                            </th>

                                                            <th className="border-b border-blue-gray-300 bg-blue-gray-100 p-4 ">
                                                                <Typography
                                                                    variant="small"
                                                                    color="blue-gray"
                                                                    className="font-semibold leading-none"
                                                                >

                                                                    <span className='text-[16px]'>
                                                                        Vehicle Name
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
                                                                        Cost
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

                                                                        PickUp Date
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

                                                            PackagesData.length === 0 ? (

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

                                                                PackagesData.map(({ id, packageName, total_cost, name, selectedVechile, pickupDate }, index) => {
                                                                    const isLast = index === PackagesData.length - 1;
                                                                    const classes = isLast ? "p-4" : "p-4 border-b border-blue-gray-300";

                                                                    // const formattedDate = pickupDate ? format(pickupDate.toDate(), "MMMM d, yyyy 'at' h:mm:ss a 'UTC'XXX") : "";

                                                                    return (
                                                                        <tr key={id}>
                                                                            <td className={classes}>
                                                                                <Typography variant="small" color="blue-gray" className="font-normal">
                                                                                    <span className='text-[16px]'>
                                                                                        {packageName}
                                                                                    </span>
                                                                                </Typography>
                                                                            </td>
                                                                            <td className={`${classes} bg-blue-gray-50/95`}>
                                                                                <Typography variant="small" color="blue-gray" className="font-normal">

                                                                                    <span className='text-[16px]'> {name} </span>
                                                                                </Typography>
                                                                            </td>

                                                                            <td className={`${classes}`}>
                                                                                <Typography variant="small" color="blue-gray" className="font-normal">
                                                                                    <span className='text-[16px]'>  {selectedVechile.VechileName} </span>
                                                                                </Typography>
                                                                            </td>

                                                                            <td className={`${classes} bg-blue-gray-50/95 `}>
                                                                                <Typography variant="small" color="blue-gray" className="font-normal">
                                                                                    <span className='text-[16px]'>
                                                                                        {total_cost}
                                                                                    </span>
                                                                                </Typography>
                                                                            </td>
                                                                            <td className={`${classes}  `}>
                                                                                <Typography variant="small" color="blue-gray" className="font-normal">
                                                                                    <span className='text-[16px]'>

                                                                                        {pickupDate}
                                                                                    </span>
                                                                                </Typography>
                                                                            </td>

                                                                            <td className={`${classes} bg-blue-gray-50/50 cursor-pointer hover:bg-yellow-200`}
                                                                                onClick={() => ViewPackageData(id, "APPROVE")}
                                                                            >
                                                                                <div className="w-max">
                                                                                    <Chip
                                                                                        size="sm"
                                                                                        variant="ghost"
                                                                                        value={'APPROVE'}
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





                    </div>



                    {/* CONFIREMED */}
                    <br />
                    <div className='w-full'>


                        {/* <Card className="p-1 m-2 border mb-4 rounded-md bg-gray-100 lg:mb-4 lg:m-10 overflow-scroll">

                            <h1 className="text-xl m-5 font-semibold text-black lg:text-3xl">Upcoming Exams</h1>

                            <table className="w-full m-5 table-auto text-left">
                                <thead>
                                    <tr>
                                        {TABLE_HEAD.map((head) => (
                                            <th key={head} className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                                                <Typography
                                                    variant="small"
                                                    color="blue-gray"
                                                    className="font-normal leading-none opacity-70"
                                                >
                                                    {head}
                                                </Typography>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {TABLE_ROWS.map(({ name, job, date }, index) => {
                                        const isLast = index === TABLE_ROWS.length - 1;
                                        const classes = isLast ? "p-4" : "p-4 border-b border-blue-gray-50";

                                        return (
                                            <tr key={name}>
                                                <td className={classes}>
                                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                                        {name}
                                                    </Typography>
                                                </td>
                                                <td className={`${classes} bg-blue-gray-50/50`}>
                                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                                        {job}
                                                    </Typography>
                                                </td>
                                                <td className={classes}>
                                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                                        {date}
                                                    </Typography>
                                                </td>
                                                <td className={`${classes} bg-blue-gray-50/50`}>
                                                    <Typography as="a" href="#" variant="small" color="blue-gray" className="font-medium">
                                                        Edit
                                                    </Typography>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </Card> */}


                        {/* THIS-WEEK DATA */}
                        <div className="p-1 m-2 border mb-4 rounded-md bg-gray-100 lg:mb-4 lg:m-10">
                            <section className="mx-auto w-full px-4 lg:px-10 py-4">
                                <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                                    <div className='flex w-full justify-between'>
                                        <h1 className="text-xl font-semibold lg:text-3xl">Confirmed Holiday Packages (THIS-WEEK)</h1>
                                        {/* 
                                        <button
                                            type="button"
                                            className="rounded-md  flex gap-2 justify-between bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                                            onClick={OnRefreshClick}
                                        >
                                            Refresh <RotateCcw className='h-4 w-4' />
                                        </button> */}
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
                                                                    Name
                                                                </Typography>
                                                            </th>

                                                            <th className="border-b border-blue-gray-300 bg-blue-gray-100 p-4 ">
                                                                <Typography
                                                                    variant="small"
                                                                    color="blue-gray"
                                                                    className="font-semibold leading-none"
                                                                >
                                                                    Vehicle Name

                                                                </Typography>
                                                            </th>

                                                            <th className="border-b border-blue-gray-300 bg-blue-gray-100 p-4 ">
                                                                <Typography
                                                                    variant="small"
                                                                    color="blue-gray"
                                                                    className="font-semibold leading-none"
                                                                >
                                                                    Cost
                                                                </Typography>
                                                            </th>

                                                            <th className="border-b border-blue-gray-300 bg-blue-gray-100 p-4 ">
                                                                <Typography
                                                                    variant="small"
                                                                    color="blue-gray"
                                                                    className="font-semibold leading-none"
                                                                >
                                                                    Confirmation Date
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
                                                                    {/* <td className={`p-4 border-b border-blue-gray-300 `}>
                                                                        <Typography variant="small" color="blue-gray" className="font-normal">
                                                                            NA
                                                                        </Typography>
                                                                    </td> */}

                                                                </tr>
                                                            ) : (

                                                                ConfirmedBookings.map(({ id, packageName, total_cost, name, selectedVechile, confirmation_Date }, index) => {
                                                                    const isLast = index === ConfirmedBookings.length - 1;
                                                                    const classes = isLast ? "p-4" : "p-4 border-b border-blue-gray-300";

                                                                    // const formattedDate = pickupDate ? format(pickupDate.toDate(), "MMMM d, yyyy 'at' h:mm:ss a 'UTC'XXX") : "";

                                                                    return (
                                                                        <tr key={id}>
                                                                            <td className={classes}>
                                                                                <Typography variant="small" color="blue-gray" className="font-normal">
                                                                                    {packageName}
                                                                                </Typography>
                                                                            </td>
                                                                            <td className={`${classes} bg-blue-gray-50/95`}>
                                                                                <Typography variant="small" color="blue-gray" className="font-normal">
                                                                                    {name}
                                                                                </Typography>
                                                                            </td>

                                                                            <td className={`${classes}`}>
                                                                                <Typography variant="small" color="blue-gray" className="font-normal">
                                                                                    {selectedVechile.VechileName}
                                                                                </Typography>
                                                                            </td>

                                                                            <td className={`${classes} bg-blue-gray-50/95 `}>
                                                                                <Typography variant="small" color="blue-gray" className="font-normal">
                                                                                    {total_cost}
                                                                                </Typography>
                                                                            </td>
                                                                            <td className={`${classes}  `}>
                                                                                <Typography variant="small" color="blue-gray" className="font-normal">
                                                                                    {confirmation_Date}
                                                                                </Typography>
                                                                            </td>

                                                                            <td className={`${classes} bg-blue-gray-50/50 cursor-pointer hover:bg-yellow-200`}
                                                                                onClick={() => ViewPackageData(id, "CONFIRMED")}
                                                                            >
                                                                                <div className="w-max">
                                                                                    <Chip
                                                                                        size="sm"
                                                                                        variant="ghost"
                                                                                        value={'VIEW DETAILS'}
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











                    </div>




                    {/* SERACH PACKAGE */}
                    <br />
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

export default AuthCheck(APackages);
