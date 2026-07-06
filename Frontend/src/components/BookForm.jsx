import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Option, Input } from "@material-tailwind/react";
import { fetchUniqueHolidays } from '@config/functions.js';

const BookForm = () => {
    const navigate = useNavigate();
    const [uniqueLocationsSet, setUniqueLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const data = await fetchUniqueHolidays();
            if (data) {
                setUniqueLocations(data);
                console.log("Uniques locations", data);
            }
        }
        fetchData();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (selectedLocation === "none" || selectedLocation == undefined || selectedLocation === '') {
            alert('Please select location');
        } else {
            let locationName = selectedLocation;
            navigate(`/location/${locationName}`);
        }

    };

    const options = [
        { value: 'chocolate', label: 'Chocolate' },
        { value: 'strawberry', label: 'Strawberry' },
        { value: 'vanilla', label: 'Vanilla' }
    ]

    return (
        <>
            <h1 className="mb-10 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-5xl">
                Plan your <span className='text-orange-400 underline'> Holidays  </span> Dreams with Us
            </h1>
            <form onSubmit={handleSubmit} className="flex items-center  gap-5 bg-white p-4 w-1/2 rounded-full">
                <div className="box-formcar-type">
                    {/* <Select label="Select Holiday location"
                    >
                        {Array.from(uniqueLocationsSet).map((location, index) => (
                            <Option key={index} onClick={() => setSelectedLocation(location)}>{location}</Option>
                        ))}

                    </Select> */}
                </div>
                <div className="box-formcar-type">
                    <Input variant="outlined" label="Guest Count" placeholder="Guest Count" type="number" />
                </div>
                <div className='flex  items-center '>
                    <button type='submit' className="bg-orange-400 hover:bg-orange-600 text-white font-bold p-3 w-full rounded-full">
                        Book Now
                    </button>
                </div>
            </form>
        </>
    );
};

export default BookForm;
