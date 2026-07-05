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
import { auth } from '@config/firebase.js';
import { format } from 'date-fns'; // Import format function from date-fns
import { onAuthStateChanged } from 'firebase/auth';
import { AuthCheck } from '@components';
import { adminApi } from '../services/adminApiService';

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
            const result = await adminApi.getSuperAdmin(email || "");
            const locations = result.users || [];
            console.log(locations);
            setDataPrepared(true);
        } catch (error) {
            console.error("Error fetching pending bookings:", error);
        }
    };
    useEffect(() => {
        fetchPackagesData();
    }, []);







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
                                Profile</h1>
                        </div>



                        {/* UPCOMING EXAMS */}
                        {/* <div className="p-1 m-2 border mb-4 rounded-md bg-gray-100 lg:mb-4 lg:m-10">
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
                        </div> */}





                    </div>










                </>

            }
        </>
    );
};

export default AuthCheck(APackages);
