import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchHolidaysByLocation } from '@config/functions.js';
import { useParams } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';
import { Card, Typography } from "@material-tailwind/react";
import { Info } from 'lucide-react'
import { Tooltip } from 'react-tooltip'
import { SpinnerComponent } from '@components'
import { ScrollToTop } from '@components';


const LocationInfo = () => {

    const [dataPrepared, setDataPrepared] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();
    const { state } = location;

    let guestCount = state && state.GuestCount || [1, 0];
    console.log('locationInfo = ' + guestCount[0] + guestCount[1]);

    const [locationData, setlocationData] = useState([]);


    const handleBookNow = (location_id) => {

        console.log('pppppppppppppppppppplppp', location_id);
        let selectedLocation = locationData.find(location => location.location_id === location_id);

        selectedLocation.selectedplan = {
            VechileName: selectedVehicle.vehicleName,
            Price: selectedVehicle.price,
            GuestCount: selectedVehicle.guestCount,
        };


        console.log(selectedLocation);
        let guestCountData = guestCount;
        let package_name1 = "Munnar Weekend Break"

        navigate(`/locationdetails`, { state: { selectedLocation, guestCountData } });
        // navigate(`/locationdetails/${package_name1}`, { state: { selectedLocation, guestCountData } });
    };



    const params = useParams();
    const [selectedLocation, setSelectedLocation] = useState('');

    useEffect(() => {
        const { locate } = params;

        if (locate) {
            console.log('Parameter from URL:', locate);
            setSelectedLocation(locate);
        }
    }, [params]);


    const [selectedVehicle, setSelectedVehicle] = useState({
        location_id: '',
        vehicleName: '',
        price: '',
        guestCount: ''
    });

    useEffect(() => {
        const fetchAllTestData = async () => {
            try {
                if (!selectedLocation) return;
                const locations = await fetchHolidaysByLocation(selectedLocation);

                setlocationData(locations);

                // Find the index of the vehicle that matches the condition
                let vehicleIndex = -1;
                locations[0]?.vehicle.some((vehicle, index) => {
                    if (vehicle.guest_count >= (guestCount[0] + guestCount[1])) {
                        vehicleIndex = index;
                        return true; // Stop iteration once condition is met
                    }
                    return false;
                });

                // If a matching vehicle is found, set its details as selected vehicle
                if (vehicleIndex !== -1) {
                    const selectedVehicle = locations[0]?.vehicle[vehicleIndex];
                    setSelectedVehicle({
                        location_id: locations[0]?.location_id || '',
                        vehicleName: selectedVehicle.vehicle_name || '',
                        price: selectedVehicle.price || '',
                        guestCount: selectedVehicle.guest_count || ''
                    });
                }


                // setSelectedVehicle({
                //     location_id: locations[0]?.location_id || '',
                //     vehicleName: locations[0]?.vehicle[0]?.vehicle_name || '',
                //     price: locations[0]?.vehicle[0]?.price || '',
                //     guestCount: locations[0]?.vehicle[0]?.guest_count || ''
                // });

                setDataPrepared(true);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchAllTestData();
    }, [selectedLocation]);

    const handleVehicleSelection = (location_id, vehicleName, price, guestCount) => {
        setSelectedVehicle({
            location_id,
            vehicleName,
            price,
            guestCount
        });
    };

    const getAllUniqueVehicleNames = (data) => {
        const uniqueNames = new Set();

        data.forEach((item) => {
            if (item.vehicle) {
                item.vehicle.forEach((vehicle) => {
                    uniqueNames.add(vehicle.vehicle_name);
                });
            }
        });

        return Array.from(uniqueNames);
    };


    const sortedUpcomingExamDatap = locationData.map(item => {
        if (item.vehicle) {
            item.vehicle.sort((a, b) => a.guest_count - b.guest_count);
        }
        return item;
    });

    const maxVehicleArray = getAllUniqueVehicleNames(sortedUpcomingExamDatap);
    // console.log('ppp = ', UpcomingExamDatap);
    // console.log('ppp = ', sortedUpcomingExamDatap);



    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (

        <>

            {!dataPrepared ?
                <SpinnerComponent name={"Preparing your data.."} />
                :

                <div className='relative flex flex-col items-center'>
                    <div className="flex flex-col justify-center w-full space-y-8 pb-10 pl-10 lg:pl-20 md:pt-10 h-[28rem]"
                        style={{
                            backgroundImage: "url('https://www.easemytrip.com/hotels/content/img/homes/bannner-hotel-newht.webp')",
                            opacity: 1,
                            backgroundSize: 'cover',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                        }}
                    >
                        <nav className="mb-1 mt-8  hidden md:flex  text-white" aria-label="Breadcrumb">
                            <ol className="inline-flex items-center space-x-1 md:space-x-3">
                                <li className="inline-flex items-center">
                                    <a
                                        href="/"
                                        className="ml-1 inline-flex text-sm font-medium text-white hover:underline md:ml-2"
                                    >
                                        <Home size={16} className="mr-2 text-white" />
                                        Home
                                    </a>
                                </li>

                                <li className="inline-flex items-center">
                                    <ChevronRight size={16} className="mr-2 text-white" />
                                    <a
                                        href={`/location/${selectedLocation}`}
                                        className="ml-1 inline-flex text-sm font-medium text-white hover:underline md:ml-2"
                                    >
                                        {/* {selectedLocation} */}
                                        {selectedLocation.charAt(0).toUpperCase() + selectedLocation.slice(1).toLowerCase()}
                                    </a>
                                </li>
                            </ol>
                        </nav>
                        <p className="text-3xl font-bold text-white md:text-5xl md:leading-10">
                            {/* {selectedLocation} */}
                            {selectedLocation.charAt(0).toUpperCase() + selectedLocation.slice(1).toLowerCase()}
                        </p>
                        <p className="max-w-[90%] text-wrap text-white md:text-xl text-justify">
                            {locationData.length > 0 ? locationData[0].description : ""}
                        </p>
                    </div>
                    <Card className="h-full w-full lg:w-[95%]  my-10 overflow-auto -translate-y-20 lg:p-4 lg:shadow-2xl">
                        {!isMobile ?
                            <div className='p-5'>
                                <div className="overflow-auto">

                                    <table className="w-full table-auto text-left border border-black ">
                                        <thead className='bg-gray-100 border border-black border-collapse'>
                                            <tr >
                                                <th className="px-2 py-4 text-center min-w-56 border border-black border-collapse">
                                                    <Typography
                                                        variant="small"
                                                        color="blue-gray"
                                                        className="font-semibold leading-none"
                                                    >
                                                        Package Name
                                                    </Typography>
                                                </th>
                                                {maxVehicleArray.map((vehicle, index) => (
                                                    <th key={index} className='border border-black border-collapse px-2 py-4 text-center'>
                                                        <Typography variant="small" color="blue-gray" className="font-semibold leading-none">
                                                            {vehicle}
                                                        </Typography>
                                                    </th>
                                                ))}


                                                <th className="border border-black border-collapse px-2 py-4 text-center">
                                                    <Typography
                                                        variant="small"
                                                        color="blue-gray"
                                                        className="font-semibold leading-none"
                                                    >
                                                        Guest Count
                                                    </Typography>
                                                </th>
                                                <th className="border border-black border-collapse px-2 py-4 text-center">
                                                    <Typography
                                                        variant="small"
                                                        color="blue-gray"
                                                        className="font-semibold leading-none"
                                                    >
                                                        Book Now
                                                    </Typography>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {


                                                locationData.map((location, index) => {
                                                    const isLast = index === locationData.length - 1;
                                                    const classes = isLast ? "p-4 border-b border-blue-gray-300" : "p-4 border-b border-blue-gray-300";
                                                    return (
                                                        <tr key={location.location_id} className={`${(selectedVehicle.location_id === location.location_id) ? "bg-yellow-50/50 " : ""}`}>
                                                            <td className="pt-4 pl-4 pb-4 border-b border-blue-gray-300">
                                                                <div>
                                                                    <Typography variant="small" color="blue-gray" className="font-bold text-lg">
                                                                        {location.package_name}
                                                                    </Typography>
                                                                </div>

                                                                <div className='mt-2'>
                                                                    <Typography
                                                                        variant="small"
                                                                        color=""
                                                                        className="flex-row text-center bg-green-100 items-center justify-center rounded-none leading-5 font-semibold px-1 py-0 w-[6.5rem] md:w-[9rem] lg:w-[10rem]"
                                                                    >
                                                                        <span className="text-[8px] md:text-[10px] lg:text-[12px]">
                                                                            Duration:
                                                                            {location.duration[0]} Days
                                                                            {location.duration[1]} Nights
                                                                        </span>
                                                                    </Typography>
                                                                </div>


                                                                {

                                                                    console.log('hiii = ', location)
                                                                }

                                                                <Tooltip anchorSelect={`#not-clickable-${location.location_id}`} place="bottom" className='z-50'>
                                                                    <div className="text-left w-screen lg:w-auto overflow-auto p-3 lg:p-4"> {/* Adjust max-height as needed */}
                                                                        <h2 className="text-lg font-semibold mb-2">Itinerary:</h2>
                                                                        <ul className="list-disc pl-5 mb-2">
                                                                            {location.itenary.map((item, index) => (
                                                                                <li key={index}>{item.header}</li>
                                                                            ))}
                                                                        </ul>
                                                                        <p className="text-sm text-gray-600">This is the planned itinerary for your trip. Please review it carefully.</p>
                                                                    </div>
                                                                </Tooltip>


                                                                <Tooltip anchorSelect={`#Kilo-Limit-${location.location_id}`} place="bottom" className=' z-50'>
                                                                    <div className="text-left  w-screen lg:w-auto overflow-auto p-3 lg:p-4">
                                                                        <h2 className="text-lg font-semibold mb-2">Kilometer Limit: 700</h2>
                                                                        <p className="mb-1"><strong>Instructions:</strong></p>
                                                                        <ul className="list-disc pl-5 mb-2">
                                                                            <li>Exceeding the kilometer limit will incur additional charges.</li>
                                                                            <li>Refer to the terms and conditions below for more details.</li>
                                                                        </ul>
                                                                        <p className="mb-1"><strong>Extra Amount and Terms:</strong></p>
                                                                        <ul className="list-disc pl-5 mb-2">
                                                                            <li>An extra fee of $X per kilometer will be charged beyond the limit.</li>
                                                                            <li>Customers are responsible for paying the additional amount upon return.</li>
                                                                            <li>Terms and conditions apply. Please read carefully.</li>
                                                                        </ul>
                                                                        <p className="text-sm text-gray-600">Refer to the rental agreement for full terms and conditions.</p>
                                                                    </div>
                                                                </Tooltip>



                                                                {/* <br /> */}
                                                                <div className='flex gap-2 mt-2 text-center'>
                                                                    <a id={`not-clickable-${location.location_id}`} className='cursor-pointer'>

                                                                        <Typography
                                                                            variant="small"
                                                                            color=""
                                                                            // className="flex items-center gap-1 bg-yellow-200 rounded-full leading-5 font-semibold px-4 py-1"
                                                                            className="bg-yellow-100 gap-1 flex items-center justify-center rounded-sm leading-5
                                                                             font-semibold px-1 py-0 w-[4rem] md:w-[4.5rem] lg:w-[5rem]"
                                                                        >
                                                                            <span className="text-sm text-gray-800 lg:text-sm">


                                                                                Itinerary

                                                                            </span>
                                                                            <Info className='w-3 h-3 lg:w-4 lg:h-4' />
                                                                        </Typography>
                                                                    </a>


                                                                    <a id={`Kilo-Limit-${location.location_id}`} className='cursor-pointer'>
                                                                        <Typography
                                                                            variant="small"
                                                                            color=""
                                                                            className="bg-red-100 gap-1 flex items-center justify-center rounded-sm leading-5 font-semibold px-1 py-0 w-[4rem] lg:w-[4.5rem]"
                                                                        >
                                                                            <span className="text-sm text-gray-800 lg:text-sm">Kilo/Limit</span>
                                                                            <Info className='w-3 h-3 lg:w-3 lg:h-3 text-gray-800' />
                                                                        </Typography>
                                                                    </a>

                                                                </div>

                                                            </td>


                                                            {/* {location.vehicle.map((vehicle, index) => (


                                            <td
                                                key={index}
                                                className={`border border-black border-collapse px-2 py-4 text-center `}
                                            // className='text-center'
                                            // onClick={() => (vehicleName != "NA") ? handleVehicleSelection(location.location_id, vehicleName, price, location.Guest_Count) : alert("Please select")}
                                            >
                                                <span
                                                    className={` ${(selectedVehicle.vehicleName === vehicle.vehicle_name && selectedVehicle.location_id === location.location_id) ? 'bg-yellow-200 rounded-lg p-3' : ''}`}
                                                >
                                                    {(vehicle.price != null && vehicle.price != undefined && vehicle.price != "" && vehicle) ? vehicle.price : "NA"}
                                                </span>
                                            </td>

                                        ))} */}
                                                            {maxVehicleArray.map((vehicleName, index) => (
                                                                <td
                                                                    key={index}
                                                                    className="border border-black border-collapse px-2 py-4 text-center cursor-pointer"
                                                                    onClick={() => {
                                                                        const selectedVehicleData = location.vehicle.find(v => v.vehicle_name === vehicleName);
                                                                        console.log('ppppppppppppppp  = ', selectedVehicleData);
                                                                        if (selectedVehicleData) {
                                                                            if (selectedVehicleData.guest_count >= (guestCount[0] + guestCount[1])) {
                                                                                handleVehicleSelection(location.location_id, selectedVehicleData.vehicle_name, selectedVehicleData.price, selectedVehicleData.guest_count);
                                                                            }
                                                                            else {
                                                                                alert("GuestCount Lesser");
                                                                            }
                                                                        } else {
                                                                            alert("Vechile Currently Unavailable");
                                                                        }
                                                                    }}
                                                                >
                                                                    <span className={selectedVehicle.vehicleName === vehicleName && selectedVehicle.location_id === location.location_id ?
                                                                        'bg-yellow-200 rounded-lg p-3' : ''}>
                                                                        {location.vehicle.find(v => v.vehicle_name === vehicleName) ? location.vehicle.find(v => v.vehicle_name === vehicleName).price : 'Unavailable'}
                                                                    </span>
                                                                </td>
                                                            ))}
                                                            <td className="border border-black border-collapse text-center">
                                                                <div className='gap-2 flex flex-col items-center'>
                                                                    <Typography variant="small" color="blue-gray" className="font-bold">
                                                                        <input
                                                                            value={(
                                                                                selectedVehicle.location_id === location.location_id && selectedVehicle.price != "NA") ? selectedVehicle.guestCount : '-'}
                                                                            // onChange={handleChange}
                                                                            className="text-center border-2 border-black bg-blue-100 rounded-lg p-2 w-12"
                                                                            style={{ lineHeight: '1' }}
                                                                            disabled={true}
                                                                        />
                                                                    </Typography>
                                                                    <Typography
                                                                        variant="small"
                                                                        color=""
                                                                        className="bg-red-100 flex items-center justify-center rounded-sm leading-5 font-semibold px-1 py-0 w-[4rem] lg:w-[4.5rem]"
                                                                    >
                                                                        <span className="text-[10px] lg:text-[9px]">
                                                                            *Max {(selectedVehicle.location_id === location.location_id && selectedVehicle.price != "NA"
                                                                            ) ? selectedVehicle.guestCount : ''} Guest
                                                                        </span>
                                                                    </Typography>
                                                                </div>
                                                            </td>



                                                            <td className={`${classes} `}>

                                                                <button

                                                                    className={` font-bold text-white px-4 py-2 rounded-full text-sm
                                                                                ${(selectedVehicle.location_id === location.location_id && selectedVehicle.price !== "NA") ? 'bg-orange-400 hover:bg-orange-600' : 'bg-gray-500'}
                                                                                
                                                                                `
                                                                    }

                                                                    onClick={() => handleBookNow(selectedVehicle.location_id)}

                                                                    disabled={(selectedVehicle.location_id === location.location_id && selectedVehicle.price !== "NA") ? false : true}


                                                                >
                                                                    Book
                                                                </button>
                                                            </td>



                                                        </tr>



                                                    )
                                                })
                                            }



                                        </tbody>
                                    </table>

                                </div>
                            </div>
                            :
                            <div className='flex'>
                                <div className='w-full'>
                                    <div className="p-1 m-2 mb-4 rounded-md bg-gray-100 lg:mb-4 lg:m-10">
                                        <section className="mx-auto w-full px-4 lg:px-10 py-4">
                                            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                                            </div>
                                            <div className="mt-6 flex flex-col">
                                                <div className="-mx-4 -my-2 overflow-auto sm:-mx-6 lg:-mx-8">
                                                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                                                        <div className="md:rounded-lg ">
                                                            <table className="w-full table-auto text-left border border-black border-collapse">
                                                                <thead>
                                                                    <tr>
                                                                        <th className="border border-black bg-blue-gray-100 px-2 py-4 text-center min-w-72">
                                                                            <Typography
                                                                                variant="small"
                                                                                color="blue-gray"
                                                                                className="font-semibold leading-none"
                                                                            >
                                                                                Package Name
                                                                            </Typography>
                                                                        </th>

                                                                        <th className="border border-black bg-blue-gray-100 px-2 py-4 text-center">
                                                                            <Typography
                                                                                variant="small"
                                                                                color="blue-gray"
                                                                                className="font-semibold leading-none"
                                                                            >
                                                                                Vehicles
                                                                            </Typography>
                                                                        </th>

                                                                        <th className="border border-black bg-blue-gray-100 p-4 hidden lg:table-cell">
                                                                            <Typography
                                                                                variant="small"
                                                                                color="blue-gray"
                                                                                className="font-semibold leading-none"
                                                                            >
                                                                                Book Now
                                                                            </Typography>
                                                                        </th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {
                                                                        locationData.length === 0 ? (

                                                                            <tr>
                                                                                <td className="p-4 border border-black">
                                                                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                                                                        NA
                                                                                    </Typography>
                                                                                </td>
                                                                                <td className={`p-4 border border-black `}>
                                                                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                                                                        NA
                                                                                    </Typography>
                                                                                </td>

                                                                                <td className={`p-4 border-b border-black`}>
                                                                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                                                                        NA
                                                                                    </Typography>
                                                                                </td>

                                                                                <td className={`p-4 border-b border-black`}>
                                                                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                                                                        NA
                                                                                    </Typography>
                                                                                </td>
                                                                                <td className={`p-4 border-b border-black  hidden lg:table-cell`}>
                                                                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                                                                        NA
                                                                                    </Typography>
                                                                                </td>
                                                                                <td className={`p-4 border-b border-black hidden lg:table-cell`}>
                                                                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                                                                        NA
                                                                                    </Typography>
                                                                                </td>

                                                                            </tr>
                                                                        ) : (

                                                                            locationData.map((location, index) => {
                                                                                const isLast = index === locationData.length - 1;

                                                                                return (
                                                                                    <tr key={index}>
                                                                                        <td className="pt-4 pl-4 pb-4 border border-black">
                                                                                            <div>
                                                                                                <Typography color="blue-gray" className="font-bold">
                                                                                                    {/* 3 Night Munnar + 1 Night Thekkkady + 1 Night Alleppey */}
                                                                                                    {location.package_name}
                                                                                                </Typography>
                                                                                            </div>
                                                                                            <div className='mt-2'>
                                                                                                <Typography
                                                                                                    variant="small"
                                                                                                    color=""
                                                                                                    className=" bg-green-100 font-semibold w-56 p-2 rounded-sm"
                                                                                                >
                                                                                                    <span className="text-sm lg:text-lg">
                                                                                                        Duration:
                                                                                                        {location.duration[0]} Days
                                                                                                        {location.duration[1]} Nights
                                                                                                    </span>
                                                                                                </Typography>
                                                                                            </div>


                                                                                            {/* tooltip */}

                                                                                            <div className='flex gap-2 mt-2 text-center'>
                                                                                                <a id={`not-clickable-${location.location_id}`}>

                                                                                                    <Typography
                                                                                                        variant="small"
                                                                                                        color=""
                                                                                                        // className="flex items-center gap-1 bg-yellow-200 rounded-full leading-5 font-semibold px-4 py-1"
                                                                                                        className="bg-yellow-100 gap-1 flex items-center justify-center rounded-sm leading-5 font-semibold px-1 py-0 w-[4rem] md:w-[4.5rem] lg:w-[5rem]"
                                                                                                    >
                                                                                                        <span className="text-[10px] lg:text-[12px]">


                                                                                                            Itinerary

                                                                                                        </span>
                                                                                                        <Info className='w-3 h-3 lg:w-4 lg:h-4' />
                                                                                                    </Typography>
                                                                                                </a>


                                                                                                <a id={`Kilo-Limit-${location.location_id}`}>
                                                                                                    <Typography
                                                                                                        variant="small"
                                                                                                        color=""
                                                                                                        className="bg-red-100 gap-1 flex items-center justify-center rounded-sm leading-5 font-semibold px-1 py-0 w-[4rem] lg:w-[4.5rem]"
                                                                                                    >
                                                                                                        <span className="text-[10px] lg:text-[10px]">Km/Limit</span>
                                                                                                        <Info className='w-3 h-3 lg:w-3 lg:h-3' />
                                                                                                    </Typography>
                                                                                                </a>

                                                                                            </div>

                                                                                        </td>

                                                                                        <td className="p-0 border border-black h-min">
                                                                                            <table className="w-full border-collapse">
                                                                                                <tbody className=''>
                                                                                                    {location.vehicle.map((vehicle, index) => (
                                                                                                        <tr key={vehicle.vehicle_name}
                                                                                                            className={`
                                                                                        ${(selectedVehicle.vehicleName === vehicle.vehicle_name && selectedVehicle.location_id === location.location_id) ? 'bg-yellow-200' : ''
                                                                                                                }                                                                                         `}
                                                                                                            onClick={() => handleVehicleSelection(location.location_id, vehicle.vehicle_name, vehicle.price, vehicle.guest_count)}
                                                                                                        >
                                                                                                            <td className="py-2 px-4 border border-black">{vehicle.vehicle_name}</td>
                                                                                                            <td className="py-2 px-4 border border-black">{vehicle.price}</td>
                                                                                                        </tr>
                                                                                                    ))}
                                                                                                </tbody>
                                                                                            </table>
                                                                                        </td>
                                                                                        <td className={"p-4 border border-black"}>

                                                                                            <button

                                                                                                className={` font-bold text-white px-4 py-2 rounded-full text-sm
                                                                                ${(selectedVehicle.location_id === location.location_id) ? 'bg-orange-400 hover:bg-orange-600' : 'bg-gray-500'}
                                                                                
                                                                                `
                                                                                                }
                                                                                                onClick={() => handleBookNow(selectedVehicle.location_id)}


                                                                                                disabled={(selectedVehicle.location_id === location.location_id) ? false : true}
                                                                                            >
                                                                                                Book
                                                                                            </button>
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
                            </div>

                        }




                    </Card>

                </div>}
        </>


    )
}



export default ScrollToTop(LocationInfo);