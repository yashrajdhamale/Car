import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom';
import { fetchHolidaysByLocation } from '@config/functions.js';
import { TruncatedText } from '../components/index.js'
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';

import { ClipboardList, Car } from 'lucide-react';

export default function LocationNew() {
    const navigate = useNavigate();
    
    const handleBookNow = (value) => {
        navigate('/BookNow', { state: { value } });
    };

    const { value } = useParams();

    console.log("Value from URL parameter:", value);

    const { state } = useLocation("kochi");
    // const { value } = state || {};

    const [selectedLocation, setSelectedLocation] = useState("");
    const [locationData, setLocationData] = useState([]);

    useEffect(() => {
        setSelectedLocation(value);
    }, [value])

    useEffect(() => {
        console.log("setSelectedLocation = " + selectedLocation);
        const fetchLocationData = async () => {
            try {
                if (!selectedLocation) return;
                const data = await fetchHolidaysByLocation(selectedLocation);
                setLocationData(data);
            } catch (error) {
                console.error('Error fetching holidays:', error);
            }
        };

        fetchLocationData();
    }, [selectedLocation]);

    console.log(locationData);


    const itneary = [
        "Day 1 : Kochi – Munnar",
        "Day 2 : Munnar",
        "Day 3 : Munnar –Alleppey ",
        "Day 4 : Alleppey – Kumarakom – Alleppey ",
        "Day 5 :  Alleppey to Kochi  sightseeing and then Departure. fasdgfuiasdf asdfhaisudfha sd asdfihaosdhf asdfaosidhfas "
    ]

    const cars = [
        "A/C Swift D’zire / Etios : 12600",
        "A/C Innova: 16200",
        "A/C 12-Seater Tempo Traveler: 23800",
        "A/C 17-Seater Tempo Traveler: 26220",
    ]

    return (
        <div>
            <div className="mx-auto max-w-7xl px-2">
                <div className="flex flex-col space-y-8 bg mt-10 pb-10 pt-8 pl-20 md:pt-24"
                    style={{
                        backgroundImage: "url('https://www.easemytrip.com/hotels/content/img/homes/bannner-hotel-newht.webp')",
                        opacity: 1,
                        borderRadius: "20px",
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                    }}
                >
                    <p className="text-3xl font-bold text-white md:text-5xl md:leading-10">
                        {selectedLocation}
                        {/* {selectedLocation.charAt(0).toUpperCase() + selectedLocation.slice(1)} */}
                    </p>
                    <p className="max-w-4xl text-base text-white md:text-xl">
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Tempore veritatis voluptates
                        neque itaque repudiandae sint, explicabo assumenda quam ratione placeat?
                    </p>
                </div>


                <section className="mx-auto w-full max-w-7xl ">
                    <div className="mt-6 flex flex-col">
                        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                                <div className="overflow-hidden border border-gray-200 md:rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50 font-bold">
                                            <tr>
                                                <th
                                                    scope="col"
                                                    className="text-left text-sm p-6"
                                                >
                                                    <span>Destination</span>
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="text-left text-sm px-3"
                                                >
                                                    Duration
                                                </th>

                                                <th
                                                    scope="col"
                                                    className="text-left text-sm px-3"
                                                >
                                                    Itinerary
                                                </th>

                                                <th
                                                    scope="col"
                                                    className="text-left text-sm px-1"
                                                >
                                                    Kilometer/Limit
                                                </th>

                                                <th
                                                    scope="col"
                                                    className="text-left text-sm px-1"
                                                >
                                                    Vehicle
                                                </th>

                                                <th
                                                    scope="col"
                                                    className="text-left text-sm px-1"
                                                >
                                                    A/C Swift D’zire / Etios
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="text-left text-sm px-1"
                                                >
                                                    A/C Innova
                                                </th>
                                                <th
                                                    scope="col"
                                                    className=" text-left text-sm p-1"
                                                >
                                                    A/C 12-Seater Tempo Traveler
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="text-left text-sm px-1"
                                                >
                                                    A/C 17-Seater Tempo Traveler
                                                </th>
                                                <th scope="col"
                                                    className="text-left text-sm px-3">
                                                    <span className="">Book Now</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {locationData.map((holiday) => (
                                                <tr key={holiday.destinations}>
                                                    <td className="p-6">
                                                        <div className="flex items-center">
                                                            <div className="text-sm font-medium text-gray-900">{holiday.destinations}</div>
                                                        </div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-3">
                                                        <div className="text-sm text-gray-900 ">
                                                            {holiday.duration[0]} Night, {holiday.duration[1]} Days
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-6 flex justify-center items-center">
                                                        <TruncatedText text={itneary} limit={10} logo={"ClipboardList"} />

                                                    </td>

                                                    <td className="px-1 text-center">
                                                        <span className="rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800 ">
                                                            {holiday.kilometer_Limit}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-6 flex justify-center items-center">
                                                        <TruncatedText text={cars} limit={10} logo={"Car"} />
                                                    </td>
                                                    {/* <td className="px-1 text-center">
                                                        <div className="text-sm text-gray-900">
                                                            {holiday && holiday.vehicle && holiday.vehicle["A/C Swift D’zire / Etios"]
                                                                ? holiday.vehicle["A/C Swift D’zire / Etios"]
                                                                : "N/A"}
                                                        </div>
                                                    </td>
                                                    <td className="px-1 text-center">
                                                        <div className="text-sm text-gray-900">
                                                            {holiday && holiday.vehicle && holiday.vehicle["A/C Innova"]
                                                                ? holiday.vehicle["A/C Innova"]
                                                                : "N/A"}
                                                        </div>
                                                    </td>
                                                    <td className="px-1 text-center">
                                                        <div className="text-sm text-gray-900">
                                                            {holiday && holiday.vehicle && holiday.vehicle["A/C 12-Seater Tempo Traveler"]
                                                                ? holiday.vehicle["A/C 12-Seater Tempo Traveler"]
                                                                : "N/A"}
                                                        </div>
                                                    </td>
                                                    <td className="px-1 text-center">
                                                        <div className="text-sm text-gray-900">
                                                            {holiday && holiday.vehicle && holiday.vehicle["A/C 17-Seater Tempo Traveler"]
                                                                ? holiday.vehicle["A/C 17-Seater Tempo Traveler"]
                                                                : "N/A"}
                                                        </div>
                                                    </td> */}
                                                    <td className='px-3 text-center'>
                                                        <button
                                                            onClick={() => handleBookNow(holiday)}
                                                            className="bg-blue-500 px-4 py-2 rounded-full text-sm text-white">
                                                            Book
                                                        </button>
                                                    </td>

                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}
