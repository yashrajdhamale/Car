export const mockLocations = {
  airports: [
    {
      placeId: 'airport1',
      name: 'Indira Gandhi International Airport',
      address: 'New Delhi, Delhi 110037, India',
      lat: 28.5562,
      lng: 77.1000,
      types: ['airport', 'establishment'],
      category: 'Airport'
    },
    {
      placeId: 'airport2',
      name: 'Chhatrapati Shivaji Maharaj International Airport',
      address: 'Mumbai, Maharashtra 400099, India',
      lat: 19.0896,
      lng: 72.8656,
      types: ['airport', 'establishment'],
      category: 'Airport'
    }
  ],
  hotels: [
    {
      placeId: 'hotel1',
      name: 'Taj Palace',
      address: '2, Sardar Patel Marg, New Delhi 110021, India',
      lat: 28.5974,
      lng: 77.1879,
      types: ['lodging', 'point_of_interest', 'establishment'],
      category: 'Hotel'
    },
    {
      placeId: 'hotel2',
      name: 'The Oberoi',
      address: 'Dr. Zakir Hussain Marg, New Delhi 110003, India',
      lat: 28.6088,
      lng: 77.2275,
      types: ['lodging', 'point_of_interest', 'establishment'],
      category: 'Hotel'
    }
  ],
  attractions: [
    {
      placeId: 'attraction1',
      name: 'India Gate',
      address: 'Rajpath, India Gate, New Delhi, Delhi 110001, India',
      lat: 28.6129,
      lng: 77.2295,
      types: ['tourist_attraction', 'point_of_interest', 'establishment'],
      category: 'Attraction'
    }
  ]
};

export const mockTransferRates = {
  'Airport-Hotel': {
    'Sedan': { price: 1500, duration: '45 mins', capacity: 3 },
    'SUV': { price: 2500, duration: '45 mins', capacity: 6 },
    'Tempo Traveller': { price: 3500, duration: '45 mins', capacity: 12 }
  },
  'Hotel-Hotel': {
    'Sedan': { price: 2000, duration: '1 hour', capacity: 3 },
    'SUV': { price: 3000, duration: '1 hour', capacity: 6 },
    'Tempo Traveller': { price: 4500, duration: '1 hour', capacity: 12 }
  },
  'Hotel-Attraction': {
    'Sedan': { price: 1800, duration: '30 mins', capacity: 3 },
    'SUV': { price: 2800, duration: '30 mins', capacity: 6 },
    'Tempo Traveller': { price: 3800, duration: '30 mins', capacity: 12 }
  }
};

export const mockVehicles = [
  {
    id: 1,
    name: 'Sedan',
    image: '/images/sedan.jpg',
    capacity: 3,
    features: ['AC', 'Free Wifi', 'Water Bottles']
  },
  {
    id: 2,
    name: 'SUV',
    image: '/images/suv.jpg',
    capacity: 6,
    features: ['AC', 'Free Wifi', 'Water Bottles', 'Extra Space']
  },
  {
    id: 3,
    name: 'Tempo Traveller',
    image: '/images/tempo.jpg',
    capacity: 12,
    features: ['AC', 'Free Wifi', 'Water Bottles', 'Extra Space', 'Luggage Space']
  }
];

export const mockBookingConfirmation = (bookingData) => ({
  bookingId: `BK${Math.floor(100000 + Math.random() * 900000)}`,
  status: 'Confirmed',
  bookingDate: new Date().toISOString(),
  ...bookingData,
  totalAmount: bookingData.rate * (1 + (bookingData.markupValue || 0) / 100),
  vehicleDetails: mockVehicles.find(v => v.name === bookingData.vehicleType)
});