import React, { useState } from 'react';
import { db } from '@config/firebase';
import { collection, doc, addDoc } from 'firebase/firestore';
import { X } from 'lucide-react';
import { AuthCheck } from '@components';

const AdminForm = () => {
    const [formData, setFormData] = useState({
        package_name: '',
        location: '',
        km_limit: '',
        description: '',
        duration: [0, 0],
        include: '',
        vehicle: [{ vehicle_name: '', guest_count: '', price: '' }],
        itenary: [{ header: '', description: '' }],
    });


    const handleChange = (index, key, value, subKey = null, nested = false) => {
        if (nested) {
            const updatedData = [...formData[key]];
            updatedData[index] = {
                ...updatedData[index],
                [subKey]: value,
            };
            setFormData({ ...formData, [key]: updatedData });
        } else if (key === 'duration') {
            const updatedDuration = [...formData.duration];
            updatedDuration[index] = parseInt(value);
            setFormData({ ...formData, duration: updatedDuration });
        } else {
            setFormData({ ...formData, [key]: value });
        }
    };

    const handleDeleteVehicle = (index) => {
        if (formData.vehicle.length === 1) {
            alert("You must keep at least one vehicle.");
            return;
        }

        const updatedVehicles = formData.vehicle.filter((_, i) => i !== index);
        setFormData({ ...formData, vehicle: updatedVehicles });
    };

    const handleDeleteItenary = (index) => {
        if (formData.itenary.length === 1) {
            alert("You must have at least one itinerary item.");
            return;
        }

        const updatedItenary = [...formData.itenary];
        updatedItenary.splice(index, 1);
        setFormData({ ...formData, itenary: updatedItenary });
    };


    const fieldDisplayNames = {
        package_name: 'Package Name',
        location: 'Location',
        km_limit: 'Km Limit',
        description: 'Description',
        include: 'Include',
        duration: 'Duration',
        vehicle: 'Vehicle',
        itenary: 'Itenary'
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        const blankFields = Object.entries(formData).filter(([key, value]) => {
            if (Array.isArray(value)) {
                return value.some(subValue => subValue === '' || subValue === 0);
            } else {
                return value === '' || value === 0;
            }
        });

        if (blankFields.length > 0) {
            const blankFieldNames = blankFields.map(([key]) => fieldDisplayNames[key]);
            alert(`Please fill in all fields (${blankFieldNames.join(', ')}) before submitting.`);
            return;
        }

        try {
            await addDoc(collection(db, 'test'), {
                package_name: formData.package_name,
                location: formData.location,
                km_limit: formData.km_limit,
                description: formData.description,
                duration: formData.duration,
                include: formData.include,
                vehicle: formData.vehicle,
                itenary: formData.itenary,
            });
            console.log('Document added successfully');
        } catch (error) {
            console.error('Error adding document: ', error);
            alert(error.message);
        }
    };

    return (
        <form className="lg:flex items-center justify-center" onSubmit={handleSubmit}>
            <div className='lg:flex gap-10 rounded-lg w-full lg:m-14'>
                {/* <div className="block lg:hidden text-3xl mb-5 lg:mb-0 text-white bg-blue-500/60 h-min p-2 rounded shadow-md">
                    Holiday Form
                </div> */}
                <div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="package_name">
                            Package Name
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="package_name"
                            type="text"
                            placeholder="Package Name"
                            value={formData.package_name}
                            onChange={(e) => handleChange(null, 'package_name', e.target.value)}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location">
                            Location
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="location"
                            type="text"
                            placeholder="Location"
                            value={formData.location}
                            onChange={(e) => handleChange(null, 'location', e.target.value)}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="km_limit">
                            Km Limit
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="km_limit"
                            type="text"
                            placeholder="Km Limit"
                            value={formData.km_limit}
                            onChange={(e) => handleChange(null, 'km_limit', e.target.value)}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                            Description
                        </label>
                        <textarea
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="description"
                            placeholder="Description"
                            value={formData.description}
                            onChange={(e) => handleChange(null, 'description', e.target.value)}
                        ></textarea>
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="duration">
                            Duration
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="duration"
                            type="number"
                            placeholder="Duration (Days)"
                            value={formData.duration[0]}
                            onChange={(e) => handleChange(0, 'duration', parseInt(e.target.value), 0)}
                        />
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mt-2"
                            id="duration2"
                            type="number"
                            placeholder="Duration (Nights)"
                            value={formData.duration[1]}
                            onChange={(e) => handleChange(1, 'duration', parseInt(e.target.value), 1)}
                        />


                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="include">
                            Include
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="include"
                            type="text"
                            placeholder="Include"
                            value={formData.include}
                            onChange={(e) => handleChange(null, 'include', e.target.value)}
                        />
                    </div>
                </div>

                <div className='flex flex-col gap-10 lg:w-4/5'>
                    <div className='lg:flex gap-5 h-full'>
                        <div className="w-full lg:w-2/5 h-full">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Vehicle</label>
                            <div className='max-h-96 overflow-auto flex flex-col gap-5'>
                                {formData.vehicle.map((vehicle, index) => (
                                    <div key={index} className="flex gap-2 flex-col p-2 border-2 border-red-100 rounded-lg">
                                        <input
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                            type="text"
                                            placeholder="Vehicle Name"
                                            value={vehicle.vehicle_name}
                                            onChange={(e) => handleChange(index, 'vehicle', e.target.value, 'vehicle_name', true)}
                                        />
                                        <input
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                            type="number"
                                            placeholder="Guest Count"
                                            value={vehicle.guest_count}
                                            onChange={(e) => handleChange(index, 'vehicle', e.target.value, 'guest_count', true)}
                                        />
                                        <div className='flex gap-2'>
                                            <input
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                type="number"
                                                placeholder="Price"
                                                value={vehicle.price}
                                                onChange={(e) => handleChange(index, 'vehicle', e.target.value, 'price', true)}
                                            />
                                            <button
                                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                                type="button"
                                                onClick={() => handleDeleteVehicle(index)}
                                            >
                                                <X />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                className="mt-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center"
                                type="button"
                                onClick={() =>
                                    setFormData({
                                        ...formData,
                                        vehicle: [...formData.vehicle, { vehicle_name: '', guest_count: '', price: '' }],
                                    })
                                }
                            >
                                Add Vehicle
                            </button>
                        </div>

                        <div className="lg:w-3/5 h-full">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Itenary</label>
                            <div className='max-h-96 overflow-auto flex flex-col gap-5'>
                                {formData.itenary.map((itenary, index) => (
                                    <div key={index} className="flex gap-2 flex-col p-2 border-2 border-blue-100 rounded-lg">
                                        <input
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                            type="text"
                                            placeholder="Header"
                                            value={itenary.header}
                                            onChange={(e) => handleChange(index, 'itenary', e.target.value, 'header', true)}
                                        />
                                        <div className='flex gap-2'>
                                            <textarea
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mt-2"
                                                placeholder="Description"
                                                value={itenary.description}
                                                onChange={(e) => handleChange(index, 'itenary', e.target.value, 'description', true)}
                                            ></textarea>
                                            <button
                                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                                type="button"
                                                onClick={() => handleDeleteItenary(index)}
                                            >
                                                <X />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                className="mt-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center"
                                type="button"
                                onClick={() =>
                                    setFormData({
                                        ...formData,
                                        itenary: [...formData.itenary, { header: '', description: '' }],
                                    })
                                }
                            >
                                Add Itenary
                            </button>
                        </div>
                    </div>
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 w-min rounded focus:outline-none focus:shadow-outline justify-end"
                        type="submit"
                    >
                        Submit
                    </button>
                </div>


            </div>

        </form>
    );
};

export default AuthCheck(AdminForm);
