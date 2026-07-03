// src/pages/driver/NextTripCard.jsx
import React, { memo } from "react";

const NextTripCard = memo(({ trip }) => (
  <section className="p-6 mb-6 bg-white rounded-lg shadow-md">
    <h2 className={`text-xl font-bold mb-3 ${trip.isNew ? "text-emerald-600" : "text-indigo-700"}`}>
      {trip.isNew ? "✅ NEW TRIP ACCEPTED!" : "📅 Your Next Trip"}
    </h2>
    <div className="space-y-2 text-gray-800">
      <p><strong className="w-20 inline-block text-gray-500">TRIP ID:</strong> {trip.id}</p>
      <p><strong className="w-20 inline-block text-gray-500">FROM:</strong> {trip.from}</p>
      <p><strong className="w-20 inline-block text-gray-500">TO:</strong> {trip.to}</p>
    </div>
    <div className="text-center mt-4">
      <a href="#booked-trips-section" className="text-indigo-600 font-semibold hover:underline">
        See All Booked Trips
      </a>
    </div>
  </section>
));

export default NextTripCard;
