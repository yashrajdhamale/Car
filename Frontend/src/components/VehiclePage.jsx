import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function VehicleBookingPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const transferDetails = state?.transferDetails;
  const [passengers, setPassengers] = useState(1);
  const [route, setRoute] = useState("Pune-Mumbai");

  const vehicles = [
    {
      id: 1,
      name: "A/C Swift Dzire",
      description: "Comfortable sedan for city rides",
      price: "2000",
      seats: 4,
      type: "Sedan",
      img: "https://www.pngitem.com/pimgs/m/217-2175788_swift-dzire-suzuki-swift-png-transparent-png.png",
      capacity: "For up to 4 People"
    },
    {
      id: 2,
      name: "A/C Ertiga Car",
      description: "Spacious 7-seater for families",
      price: "2500",
      seats: 7,
      type: "SUV",
      img: "https://www.nicepng.com/png/detail/244-2443228_maruti-suzuki-ertiga-superior-white-ertiga-car.png",
      capacity: "For up to 6 People"
    },
    {
      id: 3,
      name: "A/C Innova Car",
      description: "Premium comfort for groups",
      price: "3000",
      seats: 7,
      type: "SUV",
      img: "https://i.pinimg.com/originals/d0/9d/04/d09d04451a96408e58b72bb111ff4c26.jpg",
      capacity: "For up to 6 People"
    },
    {
      id: 4,
      name: "A/C 12-Seater Tempo Traveler",
      description: "Ideal for large groups",
      price: "4500",
      seats: 12,
      type: "Tempo Traveler",
      img: "https://wheels2vacation.com/wp-content/uploads/2023/11/12-seater-ac-thumb.png",
      capacity: "For up to 12 People"
    },
    {
      id: 5,
      name: "A/C 17-Seater Tempo Traveler",
      description: "Spacious for bigger groups",
      price: "6000",
      seats: 17,
      type: "Tempo Traveler",
      img: "https://taxibhopal.com/wp-content/uploads/2018/08/Tempo-Traveler-13.jpg",
      capacity: "For up to 17 People"
    },
    {
      id: 6,
      name: "A/C 25-Seater Traveler",
      description: "Perfect for large groups and events",
      price: "8000",
      seats: 25,
      type: "Mini Bus",
      img: "https://www.nicepng.com/png/detail/443-4432912_tempo-traveller-tempo-traveller-png.png",
      capacity: "For up to 25 People"
    },
  ];

  const handleBookVehicle = (vehicle) => {
    if (!transferDetails) {
      console.error('Transfer details not found');
      return;
    }
    
    navigate('/booking-page', { 
      state: { 
        transferDetails: transferDetails,
        vehicleDetails: {
          id: vehicle.id,
          name: vehicle.name,
          description: vehicle.description,
          price: vehicle.price,
          seats: vehicle.seats,
          type: vehicle.type,
          image: vehicle.img,
          capacity: vehicle.capacity
        }
      } 
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Booking confirmed! Route: ${route}, Passengers: ${passengers}`);
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="bg-black bg-opacity-70 min-h-screen pointer-events-none">

        <div className="container mx-auto px-4 py-8 pointer-events-auto relative z-10">

          <div className="max-w-5xl mx-auto p-6 bg-white bg-opacity-95 rounded-2xl shadow-xl mt-20">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-orange-600 hover:text-orange-700"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
              <h2 className="text-3xl font-extrabold text-center text-orange-600">
                Select Your Vehicle
              </h2>
              <div className="w-20"></div>
            </div>

            {transferDetails && (
              <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Trip Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">From</p>
                    <p className="font-medium">{transferDetails.pickup?.name || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">To</p>
                    <p className="font-medium">{transferDetails.dropoff?.name || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p className="font-medium">
                      {new Date(transferDetails.travelDate).toLocaleDateString()} at {transferDetails.hour}:{transferDetails.minute}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {vehicles.map((v) => (
                <div
                  key={v.id}
                  className="bg-gray-50 shadow-lg rounded-2xl p-6 text-center transform hover:scale-105 transition-transform duration-300 ease-in-out border-4 border-transparent hover:border-orange-500"
                >
                  <div className="relative">
                    <img
                      src={v.img}
                      alt={v.name}
                      className="w-full h-44 object-contain mb-4"
                    />
                    <div className="absolute top-2 right-2 bg-orange-500 text-white text-sm font-semibold px-3 py-1 rounded-full shadow-lg">
                      ₹{v.price}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-orange-600 mt-2">
                    {v.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {v.description}
                  </p>
                  <div className="mt-2 flex items-center justify-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {v.seats} Seats
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      {v.type}
                    </span>
                  </div>
                  <button
                    onClick={() => handleBookVehicle(v)}
                    className="mt-5 w-full bg-orange-600 text-white font-bold px-6 py-3 rounded-full shadow-lg hover:bg-orange-700 transition-colors duration-300 ease-in-out tracking-wide transform hover:-translate-y-1"
                  >
                    Select Vehicle
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}