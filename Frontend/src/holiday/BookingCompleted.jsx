import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom';
import { Luggage, ChevronRight } from 'lucide-react';
import { ScrollToTop } from '@components';


function BookingCompleted() {

    const navigate = useNavigate();


    const location = useLocation();
    const { state } = location;

    let selectLocationData = state && state.send_Data;

    console.log("BookingCompleted = ", selectLocationData);

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


    const handleNavigate = (path) => {
        navigate(path);
    } 

    return (

        // IMGAES = https://images.unsplash.com/photo-1618064541372-289bdb6f5b7b  | https://imgv2-1-f.scribdassets.com/img/document/38736169/original/5132172a76/1512734961?v=1  | https://unsplash.com/photos/a-houseboat-sailing-in-alappuzha-backwaters-in-kerala-state-in-india-RPCQYqLBoYE
        <div className="container-fluid bg-gray-100 p-4 lg:p-8 min-h-screen flex flex-col items-center justify-center bg-cover bg-center" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1582537683185-922141f18eaa")', backgroundRepeat: "repeat" }}>
            <div className="bg-white bg-opacity-90 shadow-2xl rounded-lg p-8 lg:p-12 max-w-2xl w-full" >
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-black flex gap-2 lg:text-3xl">
                        <Luggage size={38} className='text-green-500' />
                        <span>
                            TRAVELOG HOLIDAYS
                        </span>
                    </h1>
                </div>
                <div className="grid gap-4">
                    <div>
                        <div className="bg-white   border p-4 rounded-md mb-4 " >
                            <p className="mb-2 font-bold text-xl">Congratulations on booking holiday 🎉🎉🎉</p>
                        </div>

                        <div className="bg-white shadow-md border p-4 rounded-md mb-4">
                            <h5 className="mb-2 font-bold">Holiday Details :</h5>
                            <ul className="list-disc pl-4">
                                <li className='flex gap-2 pt-2 pb-2'>
                                    {<ChevronRight className='text-green-500' />}


                                    <b>
                                    Package Name :
                                    </b>

                                    <span className='overflow-auto'>
                                        {' ' + selectLocationData.formData.selectLocationData.package_name}
                                    </span>
                                </li>
                                <li className='flex gap-2 pt-2 pb-2'>
                                    {<ChevronRight className='text-purple-500' />}
                                    <b>
                                        Duration :
                                    </b>
                                    {' ' + selectLocationData.formData.selectLocationData.duration[0] + ' ' + 'DAYS'

                                        + ' ' + selectLocationData.formData.selectLocationData.duration[1] + ' NIGHTS'}
                                </li>
                                <li className='flex gap-2 pt-2 pb-2'>
                                    {<ChevronRight className='text-red-500' />}
                                    <b>
                                        Guest Count :
                                    </b>
                                    {selectLocationData.formData.formData.GuestCountData[0] + ' Adults ' +
                                        selectLocationData.formData.formData.GuestCountData[1] + ' Infants'
                                    }
                                </li>
                            </ul>
                        </div>

                        <div className="bg-white shadow-md border p-4 rounded-md mb-4 text-xl lg:text-2xl font-bold">
                            <div>Pickup Date : <span className='bg-yellow-200 p-2 px-2 rounded-xl'>
                                {/* {mainscorep} */}
                                {/* {"24 APRIL 2024"} */}

                              {" "}  {formatStringDate(selectLocationData.formData.formData.PickUpDate)}
                            </span></div>
                        </div>
                        <span className='text-sm'>Note:- You will get the Confirmation details soon through email with full details.</span>
                        <div className="mt-8 flex gap-3">
                            {/* <button
                                className={`btn btn-primary bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded  `}
                                disabled={true}
                            >
                                Preview Bookings
                            </button> */}

                            <button
                                className={`btn btn-primary bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded `}
                                onClick={() => handleNavigate("/")}
                            >
                                Home
                            </button>

                        </div>

                    </div>
                </div>
            </div>
        </div >
    );
}

export default ScrollToTop(BookingCompleted);