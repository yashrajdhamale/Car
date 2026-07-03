// src/pages/driver/BookedTripsSection.jsx
import React, { memo } from "react";

const Calendar = ({ bookedDates }) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day => (
      <div key={day} className="font-bold text-xs text-center text-gray-500">{day}</div>
    ));

    const blanks = Array(firstDay).fill(null).map((_, i) => <div key={`blank-${i}`}></div>);

    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateString = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
      const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      const isBooked = bookedDates.includes(dateString);
      let dayClass = "flex items-center justify-center h-10 w-10 rounded-full cursor-pointer hover:bg-indigo-100";
      if (isToday) dayClass += " bg-indigo-600 text-white font-bold";
      if (isBooked) dayClass += " bg-amber-500 text-white font-bold relative";
      return (
        <div key={day} className={dayClass}>
          {day}
          {isBooked && <div className="absolute bottom-1.5 h-1.5 w-1.5 bg-white rounded-full"></div>}
        </div>
      );
    });

    return [...dayNames, ...blanks, ...days];
  };

  const changeMonth = offset => setCurrentDate(prev => {
    const newDate = new Date(prev);
    newDate.setMonth(prev.getMonth() + offset);
    return newDate;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => changeMonth(-1)} className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300">&lt; Prev</button>
        <h3 className="text-lg font-bold text-indigo-700">
          {currentDate.toLocaleString("default",{ month:"long", year:"numeric" })}
        </h3>
        <button onClick={() => changeMonth(1)} className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300">Next &gt;</button>
      </div>
      <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
    </div>
  );
};

const BookedTripsSection = memo(({ bookings = [], bookedDates = [] }) => (
  <section id="booked-trips-section" className="p-6 mb-6 bg-white rounded-lg shadow-md">
    <h2 className="text-xl font-bold text-indigo-700 mb-4">🗓️ Booked Trips & Calendar</h2>
    <Calendar bookedDates={bookedDates} />
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-indigo-700 mb-2">Upcoming Bookings</h3>
      <ul className="space-y-2">
        {bookings.map(booking => (
          <li key={booking.id} className="bg-gray-50 p-3 rounded-md text-sm">
            <strong>{booking.date}:</strong> {booking.trip} (ID: {booking.id})
          </li>
        ))}
      </ul>
    </div>
  </section>
));

export default BookedTripsSection;
