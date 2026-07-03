import React, { useState } from 'react';

const RoundedSelect = ({ options, defaultValue, onChange, placeholder }) => {
    const [selectedOption, setSelectedOption] = useState(defaultValue || '');
    const [isOpen, setIsOpen] = useState(false);

    const handleChange = (value) => {
        setSelectedOption(value);
        if (onChange) {
            onChange(value);
        }
        setIsOpen(false);
    };

    return (
        <div className="relative w-64 rounded-full">
            <div
                className="appearance-none bg-white border w-full border-gray-400 rounded-lg lg:rounded-full py-3 px-5 leading-tight focus:outline-none focus:border-gray-500 cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                {!selectedOption ? placeholder : selectedOption}
            </div>
            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-md rounded-md border border-gray-300">
                    
                    {options.map((option, index) => (
                        <div
                            key={index}
                            className="py-2 px-4 cursor-pointer hover:bg-gray-100"
                            onClick={() => handleChange(option.value)}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RoundedSelect;
