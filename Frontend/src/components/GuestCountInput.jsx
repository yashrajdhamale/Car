import React, { useState,useEffect } from 'react';

const GuestCountInput = ({ handleChangeGuestCount }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [adultCount, setAdultCount] = useState(0);
    const [infantCount, setInfantCount] = useState(0);



   


    useEffect(() => {
        handleChangeGuestCount(adultCount, infantCount);
    }, [adultCount, infantCount, handleChangeGuestCount]);

    const handleClick = () => {
        setIsOpen(!isOpen);
    };

    const handleAdultIncrement = () => {
        setAdultCount(adultCount + 1);
    };

    const handleAdultDecrement = () => {
        if (adultCount > 0) {
            setAdultCount(adultCount - 1);
            if (adultCount === 1) {
                setInfantCount(0);
            }
        }
    };

    const handleInfantIncrement = () => {
        setInfantCount(infantCount + 1);
    };

    const handleInfantDecrement = () => {
        if (infantCount > 0) {
            setInfantCount(infantCount - 1);
        }
    };

    return (
        <div className="lg:relative w-64 rounded-full">
            <div
                className="appearance-none bg-white border w-full border-gray-400 rounded-lg lg:rounded-full py-3 px-5 leading-tight focus:outline-none focus:border-gray-500 cursor-pointer"
                onClick={handleClick}
            >
                {(adultCount === 0 && infantCount === 0) ? "Guests Count" : ""}
                {adultCount > 0 ? `${adultCount} Adult` : ""}
                {infantCount > 0 && adultCount > 0 ? `, ${infantCount} Infant` : ""}
            </div>
            {isOpen && (
                <div className="lg:absolute mt-1 bg-white shadow-xl p-4 border rounded-lg flex flex-col gap-3">
                        <div className="flex justify-between items-center gap-5">
                        <div className=''>Adults</div>
                        <div className='flex gap-2'>
                            <div className='px-3 py-1 cursor-pointer text-center bg-black text-white rounded-full 
                            hover:bg-gray-800
                            text-2xl' onClick={handleAdultDecrement}>-</div>
                            <input
                                type="number"
                                name="adults"
                                id="adults"
                                value={adultCount}
                                className="border rounded-md px-2 py-2 w-16 text-center"
                                readOnly
                            />
                            <div className='px-3 py-1 cursor-pointer text-center bg-black text-white rounded-full 
                             hover:bg-gray-800
                            text-2xl' onClick={handleAdultIncrement}>+</div>
                        </div>
                    </div>
                    {adultCount > 0 &&
                        <div className="flex justify-between items-center gap-5">
                            <div className=''>Infants</div>
                            <div className='flex gap-2'>
                                <div className='px-3 py-1 cursor-pointer text-center bg-black text-white rounded-full
                                 hover:bg-gray-800
                                text-2xl' onClick={handleInfantDecrement}>-</div>
                                <input
                                    type="number"
                                    name="infants"
                                    id="infants"
                                    value={infantCount}
                                    className="border rounded-md px-2 py-2 w-16 text-center"
                                    readOnly
                                />
                                <div className='px-3 py-1 cursor-pointer text-center bg-black text-white rounded-full  
                                 hover:bg-gray-800
                                text-2xl' onClick={handleInfantIncrement}>+</div>
                            </div>
                        </div>
                    }
                </div>
            )}
        </div>
    );
};

export default GuestCountInput;
