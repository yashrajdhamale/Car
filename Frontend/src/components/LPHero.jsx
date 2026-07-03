import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const travelHours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const travelMinutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));
const nationalities = ["Indian", "Other"];
const accommodations = ["Hotel", "Home Stay", "Guest House"];

const pickupOptionsList = ["Airport", "Railway Station", "Bus Stand"];
const dropoffOptionsList = ["Accommodation", "City Center", "Train Station"];
const destinationOptions = ["Pune", "Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Kochi"];



const LPHero = () => {
  const [form, setForm] = useState({
    destination: "",
    date: "",
    hour: "00",
    minute: "00",
    pickup: "Airport",
    pickupLocation: "",
    dropoff: "Accommodation",
    dropoffLocation: "",
    markupType: "",
    markupValue: "",
    adults: 2,
    children: 0,
    nationality: "Indian",
  });



  // Autocomplete suggestions state
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [pickupLocationSuggestions, setPickupLocationSuggestions] = useState([]);
  const [dropoffLocationSuggestions, setDropoffLocationSuggestions] = useState([]);

  // Filter suggestions based on input
  const filterSuggestions = (value, list) => {
    if (!value) return [];
    const val = value.toLowerCase();
    return list.filter(item => item.toLowerCase().includes(val));
  };

  // Handle form changes and update suggestions as well
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    if (name === "destination") {
      setDestSuggestions(filterSuggestions(value, destinationOptions));
    }
    if (name === "pickupLocation") {
      setPickupLocationSuggestions(filterSuggestions(value, pickupOptionsList));
    }
    if (name === "dropoffLocation") {
      setDropoffLocationSuggestions(filterSuggestions(value, dropoffOptionsList));
    }
  };

  // On suggestion click fill the input and clear suggestions
  const handleSuggestionClick = (name, val) => {
    setForm(prev => ({ ...prev, [name]: val }));
    if (name === "destination") setDestSuggestions([]);
    if (name === "pickupLocation") setPickupLocationSuggestions([]);
    if (name === "dropoffLocation") setDropoffLocationSuggestions([]);
  };

  const handleNumberChange = (field, delta) => {
    setForm((prev) => ({
      ...prev,
      [field]: Math.max(0, prev[field] + delta),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(JSON.stringify(form, null, 2)); // Placeholder submission logic
  };

  const navigate = useNavigate();




  return (
    <div
      className="w-full min-h-screen bg-cover bg-center flex justify-center items-start pt-40"
      style={{
        backgroundImage: `url('https://c1.wallpaperflare.com/preview/743/43/755/truck-wagon-road-distance.jpg')`,
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white bg-opacity-90 rounded-2xl p-8 max-w-3xl shadow-xl w-full mx-4 space-y-6"
      >
        <div>
          <label className="font-bold">Enter Destination *</label>
          <input
            required
            type="text"
            name="destination"
            value={form.destination}
            onChange={handleFormChange}
            autoComplete="off"
            className="mt-1 border p-2 rounded w-full"
            placeholder="Start typing destination"
          />
          {destSuggestions.length > 0 && (
            <ul className="border rounded max-h-40 overflow-y-auto bg-white">
              {destSuggestions.map((sugg) => (
                <li
                  key={sugg}
                  className="px-2 py-1 cursor-pointer hover:bg-orange-200"
                  onClick={() => handleSuggestionClick("destination", sugg)}
                >
                  {sugg}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex gap-4 items-center">
          <div>
            <label className="font-bold">Pick-up</label>
            <select
              name="pickup"
              value={form.pickup}
              onChange={handleFormChange}
              className="mt-1 border p-2 rounded w-full max-w-[140px]"
            >
              {pickupOptionsList.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div className="relative flex-1 max-w-[70%]">
            <input
              type="text"
              name="pickupLocation"
              value={form.pickupLocation}
              onChange={handleFormChange}
              autoComplete="off"
              className="mt-7 border p-2 rounded w-full"
              placeholder="Start typing pickup location"
            />
            {pickupLocationSuggestions.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 border rounded max-h-40 overflow-y-auto bg-white">
                {pickupLocationSuggestions.map((sugg) => (
                  <li
                    key={sugg}
                    className="px-2 py-1 cursor-pointer hover:bg-orange-200"
                    onClick={() => handleSuggestionClick("pickupLocation", sugg)}
                  >
                    {sugg}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div>
            <label className="font-bold text-gray-900">Drop-off</label>
            <select
              name="dropoff"
              value={form.dropoff}
              onChange={handleFormChange}
              className="mt-1 border p-2 rounded w-full max-w-[140px]"
            >
              {dropoffOptionsList.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div className="relative flex-1 max-w-[70%]">
            <input
              type="text"
              name="dropoffLocation"
              value={form.dropoffLocation}
              onChange={handleFormChange}
              autoComplete="off"
              className="mt-7 border p-2 rounded w-full"
              placeholder="Start typing drop-off location"
            />
            {dropoffLocationSuggestions.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 border rounded max-h-40 overflow-y-auto bg-white">
                {dropoffLocationSuggestions.map((sugg) => (
                  <li
                    key={sugg}
                    className="px-2 py-1 cursor-pointer hover:bg-orange-200"
                    onClick={() => handleSuggestionClick("dropoffLocation", sugg)}
                  >
                    {sugg}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Flight Arrival Time */}
        <div className="flex gap-6 items-center">
          <div className="flex flex-col">
            <label className="font-bold">Flight arrival time:</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleFormChange}
              className="mt-1 border p-2 rounded w-full min-w-[160px]"
              required
            />
          </div>
          <div className="flex flex-col">
            <label className="font-bold">Hour *</label>
            <select
              name="hour"
              value={form.hour}
              onChange={handleFormChange}
              className="mt-1 border p-2 rounded min-w-[70px]"
            >
              {travelHours.map((hr) => (
                <option key={hr} value={hr}>
                  {hr}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="font-bold">Minute *</label>
            <select
              name="minute"
              value={form.minute}
              onChange={handleFormChange}
              className="mt-1 border p-2 rounded min-w-[70px]"
            >
              {travelMinutes.map((min) => (
                <option key={min} value={min}>
                  {min}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Markup & Value and Guest Count */}
        <div className="flex gap-4">
          <div>
            <label className="font-bold">Markup & Value</label>
            <select
              name="markupType"
              value={form.markupType}
              onChange={handleFormChange}
              className="mt-1 border p-2 rounded"
            >
              <option value="">Select</option>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed</option>
            </select>
          </div>
          <div className="flex-1">
            <input
              type="number"
              name="markupValue"
              value={form.markupValue}
              onChange={handleFormChange}
              className="mt-7 border p-2 rounded w-full"
              placeholder="Value"
              min="0"
            />
          </div>
          <div className="flex-1">
            <label className="font-bold">Adults and Children *</label>
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                className="border rounded-full px-2"
                onClick={() => handleNumberChange("adults", -1)}
              >
                -
              </button>
              <span>{form.adults} Adult</span>
              <button
                type="button"
                className="border rounded-full px-2"
                onClick={() => handleNumberChange("adults", 1)}
              >
                +
              </button>
              <button
                type="button"
                className="border rounded-full px-2 ml-3"
                onClick={() => handleNumberChange("children", -1)}
              >
                -
              </button>
              <span>{form.children} Child</span>
              <button
                type="button"
                className="border rounded-full px-2"
                onClick={() => handleNumberChange("children", 1)}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Nationality */}
        <div>
          <label className="font-bold">Nationality *</label>
          <select
            name="nationality"
            value={form.nationality}
            onChange={handleFormChange}
            className="mt-1 border p-2 rounded w-full"
          >
            {nationalities.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="bg-orange-400 w-full text-white font-bold py-2 rounded mt-1 hover:bg-orange-600"
        >
          Let's Find
        </button>
      </form>
    </div>
  );
};

export default LPHero;



