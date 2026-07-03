import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// import { ASideBar, ANavBar } from '../components';
import { RotateCcw } from 'lucide-react'
import {
    Typography, Spinner, Chip
} from "@material-tailwind/react";

import { db, auth} from '@config/firebase.js';
import { collection, query, getDocs, doc, deleteDoc } from "firebase/firestore";
import { format } from 'date-fns'; // Import format function from date-fns
import { onAuthStateChanged } from 'firebase/auth';
import { AuthCheck } from '@components';

const AdminHolidayHome = () => {


    const location = useLocation();
    const { state } = location;
    const navigate = useNavigate();


    const [user, setUser] = useState(null); // State to hold the current user

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


    // async function InitialFtechData() {
    //     const { data: UserDataFromDB } = await supabase
    //         .from('User_Transactions')
    //         .select()
    //         .eq('status', 'Pending');

    //     // TransactionFromDatabase = UserDataFromDB;
    //     setTransactionFromDatabase(UserDataFromDB);
    //     // console.log(UserDataFromDB);
    //     setDataPrepared(true);
    // }




    // useEffect(() => {

    //     if (state && state.admindetails && (state.logged == true)) {
    //         InitialFtechData();
    //     }
    //     else {
    //         navigate('/admin/login');
    //     }
    // }, []);



    // const [CurrentTransactionOpen, setCurrentTransactionOpen] = useState(false);
    // const [CurrentTransactionOpenData, setCurrentTransactionOpenData] = useState([]);
    // const [ButtonDisabled, setButtonDisabled] = useState(false);




    // let TransactionFromDatabase = [];

    // const [TransactionFromDatabase, setTransactionFromDatabase] = useState(null);





    // USEFFECT: (1)








    // const HandleCurrentTransactionOpen = () => setCurrentTransactionOpen(!CurrentTransactionOpen);

    // const HandleStartTransactionPopUp = (id) => {
    //     setCurrentTransactionOpen(!CurrentTransactionOpen);
    //     const matchingTest = TransactionFromDatabase.find(test => test.transaction_id === id);
    //     // console.log(matchingTest);
    //     setCurrentTransactionOpenData(matchingTest);

    // };


    // const HandleCurrentTransactionOpenTransactionPage = async () => {

    //     setButtonDisabled(true);

    //     let datap = CurrentTransactionOpenData;

    //     console.log(CurrentTransactionOpenData);

    // localStorage.setItem('flag', 'Transactionnow');
    // localStorage.setItem('currentdaat', JSON.stringify(datap));




    // const { data: UserDataFromDB, error } = await supabase
    //     .from('User_Transactions')
    //     .update({ status: 'Approved' }) // Replace 'new_status_value' with the desired value
    //     .eq('transaction_id', CurrentTransactionOpenData.transaction_id);

    // if (error) {
    //     console.error('Error updating transaction status:', error.message);
    // } else {
    //     console.log('Transaction status updated successfully:', UserDataFromDB);

    //     // const updatedTransactions = TransactionFromDatabase.filter(transaction => transaction.transaction_id !== CurrentTransactionOpenData.transaction_id);
    //     // setTransactionFromDatabase(updatedTransactions);

    //     setButtonDisabled(true);
    //     HandleCurrentTransactionOpen(null);
    //     OnRefreshClick();

    // }
    // }


    const [pendingBookings, setPendingBookings] = useState([]);
    const [ConfirmedBookings, setConfirmedBookings] = useState([]);
    const [dataPrepared, setDataPrepared] = useState(false);



    const fetchPendingBookings = async () => {
        try {
            const q = query(collection(db, "bookings"));
            const querySnapshot = await getDocs(q);

            const pendingBookingsData = [];
            const confirmedBookingsData = [];

            querySnapshot.forEach((doc) => {
                // Extract data from each document along with document ID
                const bookingDataWithId = { id: doc.id, ...doc.data() };
                console.log("hiiiiiiiiiiiiiiiiiiiiiiiii");
                console.log(doc.data());

                const currentDate = new Date();
                const tenDaysAgo = new Date(currentDate.getTime() - 10 * 24 * 60 * 60 * 1000); // Calculate the date 10 days ago
                const confirmationDate = new Date(bookingDataWithId.confirmation_Date);
                console.log(confirmationDate);

                // MM/DD/YYYY

                // Check if the booking is pending or confirmed based on its status
                if (bookingDataWithId.apporval === "pending") {
                    pendingBookingsData.push(bookingDataWithId);
                } else if (bookingDataWithId.apporval === "Confirmed") {
                    // confirmedBookingsData.push(bookingDataWithId);
                    if (confirmationDate >= tenDaysAgo && confirmationDate <= currentDate) {
                        confirmedBookingsData.push(bookingDataWithId);
                    }
                }

              





            });


            console.log("pendingBookingsData = ", pendingBookingsData);

            function sortByBookedDateDescending(data) {
                return data.sort((a, b) => {
                    const dateA = new Date(a.BookedDate);
                    const dateB = new Date(b.BookedDate);
                    return dateA - dateB;  // For descending order
                });
            }

            const sortedData = sortByBookedDateDescending(pendingBookingsData);
            console.log("sortedData = ", sortedData);


            // Set the pending bookings array in state
            setPendingBookings(sortedData);
            setConfirmedBookings(confirmedBookingsData);

            setDataPrepared(true);
        } catch (error) {
            console.error("Error fetching pending bookings:", error);
        }
    };
    useEffect(() => {
        fetchPendingBookings();

    }, []);


    const OnRefreshClick = () => {
        setDataPrepared(false);
        fetchPendingBookings();
    }


    const ViewPackageData = (id, params_fun) => {


        let packageItem = [];

        if (params_fun === "APPROVE") {

            packageItem = pendingBookings.find(item => item.id === id);
        }
        else {
            packageItem = ConfirmedBookings.find(item => item.id === id);

        }

        let functionName = params_fun;
        console.log(packageItem);

        // TODO : Set proper routes for this
        navigate('/admin/holiday/approval', { state: { packageItem, functionName } });
    }

    const DeletePackageData = async (id) => {
        console.log(id);
        try {
            const docRef = doc(db, "bookings", id);
            await deleteDoc(docRef);
            console.log(`Document with ID ${id} has been deleted successfully`);

            OnRefreshClick();

        } catch (error) {
            console.error("Error deleting document: ", error);
        }
    };



    function formatStringDate(dateString) {
        console.log("formatStringDate = ", dateString);
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
                                Holiday-DashBoard</h1>
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
                                        <h1 className="text-xl font-semibold lg:text-3xl">Pending User Holiday Request</h1>

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
                                                            <th className="border-b text-xl border-blue-gray-300 bg-blue-gray-100 p-4">
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

                                                            <th className="border-b border-blue-gray-300 bg-blue-gray-100 p-4 ">
                                                                <Typography
                                                                    variant="small"
                                                                    color="blue-gray"
                                                                    className="font-semibold leading-none"
                                                                >
                                                                    <span className='text-[16px]'>

                                                                        Booked Date
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

                                                            <th className="border-b border-blue-gray-300 bg-blue-gray-100 p-4">
                                                                <Typography
                                                                    variant="small"
                                                                    color="blue-gray"
                                                                    className="font-semibold leading-none"
                                                                >
                                                                    Delete
                                                                </Typography>
                                                            </th>

                                                        </tr>
                                                    </thead>
                                                    <tbody>



                                                        {

                                                            pendingBookings.length === 0 ? (

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

                                                                    pendingBookings.map(({ id, name, LocationData, PickUpDate, BookedDate }, index) => {
                                                                    const isLast = index === pendingBookings.length - 1;
                                                                    const classes = isLast ? "p-4" : "p-4 border-b border-blue-gray-300";

                                                                    // const formattedDate = pickupDate ? format(pickupDate.toDate(), "MMMM d, yyyy 'at' h:mm:ss a 'UTC'XXX") : "";

                                                                    return (
                                                                        <tr key={id}>
                                                                            <td className={classes}>
                                                                                <Typography variant="small" color="blue-gray" className="font-normal">
                                                                                    <span className='text-[16px]'>
                                                                                        {LocationData.package_name}
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
                                                                                    <span className='text-[16px]'>  {LocationData.selectedplan.VechileName} </span>
                                                                                </Typography>
                                                                            </td>

                                                                            <td className={`${classes} bg-blue-gray-50/95 `}>
                                                                                <Typography variant="small" color="blue-gray" className="font-normal">
                                                                                    <span className='text-[16px]'>
                                                                                        {LocationData.selectedplan.Price}
                                                                                    </span>
                                                                                </Typography>
                                                                            </td>
                                                                            <td className={`${classes}  `}>
                                                                                <Typography variant="small" color="blue-gray" className="font-normal">
                                                                                    <span className='text-[16px]'>

                                                                                        {/* {pickupDate} */}

                                                                                        {formatStringDate(PickUpDate)}
                                                                                    </span>
                                                                                </Typography>
                                                                            </td>

                                                                            <td className={`${classes} bg-blue-gray-50/95 `}>
                                                                                <Typography variant="small" color="blue-gray" className="font-normal">
                                                                                    <span className='text-[16px]'>

                                                                                        {/* {pickupDate} */}

                                                                                        {formatStringDate(BookedDate)}
                                                                                    </span>
                                                                                </Typography>
                                                                            </td>

                                                                            <td className={`${classes}  cursor-pointer hover:bg-yellow-200`}
                                                                                onClick={() => ViewPackageData(id, "APPROVE")}
                                                                            >
                                                                                <div className="w-max">
                                                                                    <Chip
                                                                                        size="sm"
                                                                                        value={'APPROVE'}
                                                                                        color={"green"}
                                                                                        
                                                                                    />
                                                                                </div>
                                                                            </td>

                                                                            <td className={`${classes} bg-blue-gray-50/50 cursor-pointer hover:bg-red-100`}
                                                                                onClick={() => DeletePackageData(id)}
                                                                            >
                                                                                <div className="w-max">
                                                                                    <Chip
                                                                                        size="sm"
                                                                                        color="red" 
                                                                                        value={'DELETE'}
                                                                                        
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
                                        <h1 className="text-xl font-semibold lg:text-3xl">Confirmed User Holiday Request (THIS-WEEK)</h1>
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

                                                                    ConfirmedBookings.map(({ id,  name, LocationData, confirmation_Date }, index) => {
                                                                    const isLast = index === ConfirmedBookings.length - 1;
                                                                    const classes = isLast ? "p-4" : "p-4 border-b border-blue-gray-300";

                                                                    // const formattedDate = pickupDate ? format(pickupDate.toDate(), "MMMM d, yyyy 'at' h:mm:ss a 'UTC'XXX") : "";

                                                                    return (
                                                                        <tr key={id}>
                                                                            <td className={classes}>
                                                                                <Typography variant="small" color="blue-gray" className="font-normal">
                                                                                    {LocationData.package_name}
                                                                                </Typography>
                                                                            </td>
                                                                            <td className={`${classes} bg-blue-gray-50/95`}>
                                                                                <Typography variant="small" color="blue-gray" className="font-normal">
                                                                                    {name}
                                                                                </Typography>
                                                                            </td>

                                                                            <td className={`${classes}`}>
                                                                                <Typography variant="small" color="blue-gray" className="font-normal">
                                                                                    {LocationData.selectedplan.VechileName}
                                                                                </Typography>
                                                                            </td>

                                                                            <td className={`${classes} bg-blue-gray-50/95 `}>
                                                                                <Typography variant="small" color="blue-gray" className="font-normal">
                                                                                    {LocationData.selectedplan.Price}
                                                                                </Typography>
                                                                            </td>
                                                                            <td className={`${classes}  `}>
                                                                                <Typography variant="small" color="blue-gray" className="font-normal">
                                                                                    {/* {confirmation_Date} */}
                                                                                    {formatStringDate(confirmation_Date)}
                                                                                </Typography>
                                                                            </td>

                                                                            <td className={`${classes} bg-blue-gray-50/50 cursor-pointer hover:bg-yellow-200`}
                                                                                onClick={() => ViewPackageData(id, "CONFIRMED")}
                                                                            >
                                                                                <div className="w-max">
                                                                                    <Chip
                                                                                        size="sm"
                                                                                        // variant="ghost"
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

export default AuthCheck(AdminHolidayHome);
