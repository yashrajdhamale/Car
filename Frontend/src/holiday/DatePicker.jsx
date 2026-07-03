import React, { useState, useEffect } from "react";
import {
    Input,
    Popover,
    PopoverHandler,
    PopoverContent,
} from "@material-tailwind/react";
import { format, addDays } from "date-fns";
import { DayPicker } from "react-day-picker";
import { ChevronRightIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";

function DatePicker() {
    const [date, setDate] = useState(addDays(new Date(), 7)); // Set default selected date to 8th day from today

    // Function to check if a day should be disabled
    const isDayDisabled = (day) => {
        const today = new Date();
        const sevenDaysFromToday = addDays(today, 6);
        return day <= today || (day >= today && day <= sevenDaysFromToday);
    };

    // Function to handle date selection
    const handleSelectDate = (selectedDate) => {
        // Check if the selected date is not disabled
        if (!isDayDisabled(selectedDate)) {
            // Set the selected date
            setDate(selectedDate);
        }
    };

    return (
        <div className="p-24">
            <Popover placement="bottom">
                <PopoverHandler>
                    <Input
                        label="Select a Date"
                        onChange={() => null}
                        value={date ? format(date, "PPP") : ""}
                    />
                </PopoverHandler>
                <PopoverContent>
                    <DayPicker
                        mode="single"
                        selected={date}
                        onSelect={handleSelectDate}
                        showOutsideDays
                        className="border-0"
                        disabled={isDayDisabled}
                        classNames={{
                            caption: "flex justify-center py-2 mb-4 relative items-center",
                            caption_label: "text-sm font-medium text-gray-900",
                            nav: "flex items-center",
                            nav_button:
                                "h-6 w-6 bg-transparent hover:bg-blue-gray-50 p-1 rounded-md transition-colors duration-300",
                            nav_button_previous: "absolute left-1.5",
                            nav_button_next: "absolute right-1.5",
                            table: "w-full border-collapse",
                            head_row: "flex font-medium text-gray-900",
                            head_cell: "m-0.5 w-9 font-normal text-sm",
                            row: "flex w-full mt-2",
                            cell: "text-gray-600 rounded-md h-9 w-9 text-center text-sm p-0 m-0.5 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-gray-900/20 [&:has([aria-selected].day-outside)]:text-white [&:has([aria-selected])]:bg-gray-900/50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                            day: "h-9 w-9 p-0 font-normal",
                            day_range_end: "day-range-end",
                            day_outside:
                                "day-outside text-gray-500 opacity-50 aria-selected:bg-gray-500 aria-selected:text-gray-900 aria-selected:bg-opacity-10",
                            day_hidden: "invisible",
                            day_disabled: "text-red-500 opacity-50",
                            day_today: "rounded-md bg-yellow-200 text-red-500",
                            day_selected: "rounded-md bg-green-500 text-white", // Selected day with green background
                        }}
                        components={{
                            IconLeft: ({ ...props }) => (
                                <ChevronLeftIcon {...props} className="h-4 w-4 stroke-2" />
                            ),
                            IconRight: ({ ...props }) => (
                                <ChevronRightIcon {...props} className="h-4 w-4 stroke-2" />
                            ),
                        }}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}

export default DatePicker;