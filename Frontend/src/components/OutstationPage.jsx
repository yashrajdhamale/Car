// working code 



import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { FaArrowDown, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaCrosshairs, FaMapPin, FaChevronDown, FaChevronUp, FaUsers } from "react-icons/fa";
import { locationService } from "../utils/locationService";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

// GST percentage
const GST_PERCENTAGE = 5;

// Fixed city-to-city distances (in km)
const CITY_DISTANCES = {
    "Pune-Mumbai": 148,
    "Mumbai-Pune": 148,
    "Pune-Nashik": 210,
    "Nashik-Pune": 210,
    "Mumbai-Nashik": 167,
    "Nashik-Mumbai": 167,
    "Pune-Aurangabad": 233,
    "Aurangabad-Pune": 233,
    "Mumbai-Aurangabad": 333,
    "Aurangabad-Mumbai": 333,
    "Pune-Kolhapur": 234,
    "Kolhapur-Pune": 234,
    "Mumbai-Goa": 464,
    "Goa-Mumbai": 464,
    "Pune-Goa": 447,
    "Goa-Pune": 447,
};

export default function OutstationPage() {
    const navigate = useNavigate();
    const [isBooking, setIsBooking] = useState(false);
    const vehicles = [
        { name: "A/C Swift Dzire", capacity: 4, ratePerKm: 12, img: "https://www.pngitem.com/pimgs/m/217-2175788_swift-dzire-suzuki-swift-png-transparent-png.png" },
        { name: "A/C Ertiga Car", capacity: 6, ratePerKm: 15, img: "https://www.nicepng.com/png/detail/244-2443228_maruti-suzuki-ertiga-superior-white-ertiga-car.png" },
        { name: "A/C Innova Car", capacity: 6, ratePerKm: 18, img: "https://i.pinimg.com/originals/d0/9d/04/d09d04451a96408e58b72bb111ff4c26.jpg" },
        { name: "A/C 12-Seater Tempo Traveler", capacity: 12, ratePerKm: 20, img: "https://www.royalwheels.com/admin/upload/vehicles/12-seater-tempo-traveller-hire-in-delhi-ncr-1.jpg" },
        { name: "A/C 17-Seater Tempo Traveler", capacity: 17, ratePerKm: 22, img: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Tempo_Traveller.jpg/320px-Tempo_Traveller.jpg" },
        { name: "A/C 25-Seater Traveler", capacity: 25, ratePerKm: 25, img: "https://www.nicepng.com/png/detail/443-4432912_tempo-traveller-tempo-traveller-png.png" },
    ];

    const [pickupCityPlace, setPickupCityPlace] = useState(null);
    const [destinationCityPlace, setDestinationCityPlace] = useState(null);
    const [pickupSublocalityPlace, setPickupSublocalityPlace] = useState(null);
    const [destinationSublocalityPlace, setDestinationSublocalityPlace] = useState(null);

    const [pickupCityAddress, setPickupCityAddress] = useState("");
    const [pickupSublocalityAddress, setPickupSublocalityAddress] = useState("");
    const [destinationCityAddress, setDestinationCityAddress] = useState("");
    const [destinationSublocalityAddress, setDestinationSublocalityAddress] = useState("");

    const [passengerCount, setPassengerCount] = useState(1);
    const [days, setDays] = useState(1);
    const [user, setUser] = useState(null);
    const [distance, setDistance] = useState(null);
    const [currentLocationLoading, setCurrentLocationLoading] = useState(false);
    const [autocompleteResults, setAutocompleteResults] = useState({
        pickup: [],
        destination: [],
        pickupSublocality: [],
        destinationSublocality: []
    });
    const [showAutocomplete, setShowAutocomplete] = useState({
        pickup: false,
        destination: false,
        pickupSublocality: false,
        destinationSublocality: false
    });

    const [rideType, setRideType] = useState("now");
    const [rideDate, setRideDate] = useState("");
    const [rideTime, setRideTime] = useState("");
    const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
    const [isFirstCarVisible, setIsFirstCarVisible] = useState(true);
    const [expandedPickup, setExpandedPickup] = useState(false);
    const [expandedDest, setExpandedDest] = useState(false);

    const firstCarRef = useRef(null);
    const pickupCityRef = useRef(null);
    const pickupSublocalityRef = useRef(null);
    const destinationCityRef = useRef(null);
    const destinationSublocalityRef = useRef(null);
    const autocompleteContainerRef = useRef(null);

    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 15);

    const formatDate = (date) => date.toISOString().split('T')[0];

    const calculatePriceWithGST = (basePrice) => {
        const gstAmount = (basePrice * GST_PERCENTAGE) / 100;
        return {
            basePrice: Math.round(basePrice),
            gstAmount: parseFloat(gstAmount.toFixed(2)),
            totalPrice: Math.round(basePrice + gstAmount)
        };
    };

    const getCityDistance = (fromCity, toCity) => {
        if (!fromCity || !toCity) return null;

        const cleanCityName = (city) => {
            if (!city) return '';
            const stateNames = [
                'Maharashtra', 'Karnataka', 'Gujarat', 'Rajasthan', 'Delhi',
                'Tamil Nadu', 'Kerala', 'Goa', 'Madhya Pradesh', 'Uttar Pradesh',
                'West Bengal', 'Telangana', 'Andhra Pradesh', 'Punjab', 'Haryana'
            ];
            let cleaned = city.trim();
            if (cleaned.includes(',')) {
                const parts = cleaned.split(',').map(p => p.trim());
                for (const part of parts) {
                    if (/^\d+$/.test(part)) continue;
                    if (stateNames.includes(part)) continue;
                    if (part.length > 2) { cleaned = part; break; }
                }
            }
            cleaned = cleaned.replace(/ District$/i, '').replace(/ City$/i, '').trim();
            return cleaned;
        };

        const from = cleanCityName(fromCity);
        const to = cleanCityName(toCity);
        const routeKey = `${from}-${to}`;
        const reverseKey = `${to}-${from}`;
        const dist = CITY_DISTANCES[routeKey] || CITY_DISTANCES[reverseKey];

        console.log(`📏 Distance lookup:`, {
            originalFrom: fromCity, originalTo: toCity,
            cleanedFrom: from, cleanedTo: to,
            routeKey, reverseKey, foundDistance: dist
        });

        return dist ?? null;
    };

    const extractCoordinates = (place) => {
        if (!place) return { latitude: null, longitude: null };

        const lat =
            (typeof place.latitude === 'number' && place.latitude !== 0 ? place.latitude : null) ??
            (typeof place.lat === 'number' && place.lat !== 0 ? place.lat : null) ??
            (place.coordinates?.latitude && place.coordinates?.latitude !== 0 ? parseFloat(place.coordinates.latitude) : null) ??
            (place.latitude != null && place.latitude !== 0 ? parseFloat(place.latitude) : null) ??
            null;

        const lng =
            (typeof place.longitude === 'number' && place.longitude !== 0 ? place.longitude : null) ??
            (typeof place.lng === 'number' && place.lng !== 0 ? place.lng : null) ??
            (place.coordinates?.longitude && place.coordinates?.longitude !== 0 ? parseFloat(place.coordinates.longitude) : null) ??
            (place.longitude != null && place.longitude !== 0 ? parseFloat(place.longitude) : null) ??
            null;

        return {
            latitude: lat !== null && !isNaN(lat) ? lat : null,
            longitude: lng !== null && !isNaN(lng) ? lng : null
        };
    };

    useEffect(() => {
        setRideDate(formatDate(today));
        generateTimeSlots();

        const handleClickOutside = (event) => {
            if (autocompleteContainerRef.current && !autocompleteContainerRef.current.contains(event.target)) {
                setShowAutocomplete({ pickup: false, destination: false, pickupSublocality: false, destinationSublocality: false });
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const generateTimeSlots = () => {
        const slots = [];
        const now = new Date();
        const selectedDate = new Date(rideDate);
        const isToday = selectedDate.toDateString() === now.toDateString();

        for (let hour = 6; hour <= 22; hour++) {
            if (isToday) {
                const currentHour = now.getHours();
                if (hour === currentHour && now.getMinutes() + 30 > 60) continue;
                if (hour < currentHour + 1) continue;
            }
            for (let minute = 0; minute < 60; minute += 30) {
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                slots.push({
                    value: timeString,
                    label: `${hour % 12 === 0 ? 12 : hour % 12}:${minute.toString().padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`
                });
            }
        }
        setAvailableTimeSlots(slots);
        if (!rideTime && slots.length > 0) setRideTime(slots[0].value);
    };

    useEffect(() => { if (rideDate) generateTimeSlots(); }, [rideDate]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry) setIsFirstCarVisible(entry.isIntersecting); },
            { root: null, rootMargin: '0px', threshold: 0.1 }
        );
        const timer = setTimeout(() => {
            if (firstCarRef.current) observer.observe(firstCarRef.current);
        }, 500);
        return () => {
            clearTimeout(timer);
            if (firstCarRef.current) observer.unobserve(firstCarRef.current);
        };
    }, [passengerCount]);

    const searchPlaces = async (searchQuery, type = 'pickup', cityContext = null) => {
        if (!searchQuery || searchQuery.length < 2) {
            setAutocompleteResults(prev => ({ ...prev, [type]: [] }));
            setShowAutocomplete(prev => ({ ...prev, [type]: false }));
            return;
        }

        try {
            let url = `${API_BASE}/api/places/autosuggest?q=${encodeURIComponent(searchQuery)}`;
            const isSublocality = type === 'pickupSublocality' || type === 'destinationSublocality';

            if (isSublocality && cityContext && typeof cityContext === 'object') {
                if (cityContext.eLoc) {
                    url += `&cityEloc=${encodeURIComponent(cityContext.eLoc)}`;
                }
                const { latitude, longitude } = extractCoordinates(cityContext);
                if (latitude && longitude) {
                    url += `&lat=${latitude}&lng=${longitude}`;
                }
                url += `&sublocalityMode=true`;
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();

            if (data.success && data.suggestions) {
                setAutocompleteResults(prev => ({ ...prev, [type]: data.suggestions }));
                setShowAutocomplete(prev => ({ ...prev, [type]: true }));
            } else {
                setAutocompleteResults(prev => ({ ...prev, [type]: [] }));
            }
        } catch (error) {
            console.error('Search places error:', error);
            setAutocompleteResults(prev => ({ ...prev, [type]: [] }));
        }
    };

    // ✅ Helper: build sublocality data from a place + parent city
    const buildSublocalityData = (placeData, parentCityPlace, cityName, fullAddress) => {
        const inheritedCityName = parentCityPlace?.cityName || cityName;
        return {
            ...placeData,
            cityName: inheritedCityName,
            displayAddress: fullAddress || placeData.displayAddress,
            isSublocality: true,
            parentCity: parentCityPlace?.cityName || cityName,
            parentCityCoordinates: parentCityPlace?.coordinates ?? placeData.coordinates ?? null,
        };
    };

    const handlePlaceSelect = async (place, field) => {
        console.log("🔍 Selected place (raw):", place);

        const tokens = place.addressTokens || {};

        // ── Extract city name ────────────────────────────────────────────
        let cityName = tokens.city || tokens.district || place.city || place.cityName || "";

        if (!cityName && place.placeAddress) {
            const parts = place.placeAddress.split(",").map(p => p.trim());
            const stateNames = [
                "Maharashtra", "Karnataka", "Gujarat", "Rajasthan", "Delhi",
                "Tamil Nadu", "Kerala", "Goa", "Madhya Pradesh", "Uttar Pradesh",
                "West Bengal", "Telangana", "Andhra Pradesh", "Punjab", "Haryana",
            ];
            for (let i = 1; i < parts.length; i++) {
                const part = parts[i];
                if (/^\d+$/.test(part)) continue;
                if (stateNames.includes(part)) continue;
                if (part.length > 2) { cityName = part; break; }
            }
        }

        // If it's a CITY type or city field with no cityName, use placeName
        if (!cityName && (field === "pickupCity" || field === "destinationCity" || place.type === 'CITY')) {
            cityName = place.placeName || place.name || "";
        }

        cityName = cityName.replace(/ District$/i, "").replace(/ City$/i, "").trim();

        // ── Display name ─────────────────────────────────────────────────
        const displayName = tokens.village || tokens.subSubLocality || tokens.subLocality ||
            tokens.locality || tokens.subDistrict || place.placeName || place.name || "Location";

        const stateName = tokens.state || place.stateName || place.state || "";

        let displayAddress = "";
        if (displayName && cityName && displayName !== cityName) {
            displayAddress = `${displayName}, ${cityName}`;
        } else if (cityName) {
            displayAddress = cityName;
        } else {
            displayAddress = displayName || "Current Location";
        }
        if (stateName && !displayAddress.includes(stateName)) {
            displayAddress += `, ${stateName}`;
        }

        // ── Resolve coordinates ──────────────────────────────────────────
        let lat = place.latitude && place.latitude !== 0 ? parseFloat(place.latitude) : null;
        let lng = place.longitude && place.longitude !== 0 ? parseFloat(place.longitude) : null;

        if ((!lat || !lng) && place.eLoc) {
            console.log(`🔄 Resolving eLoc: ${place.eLoc}`);
            try {
                const resp = await fetch(`${API_BASE}/api/places/autosuggest?q=${encodeURIComponent(place.placeName || place.name || displayAddress)}`);
                if (resp.ok) {
                    const data = await resp.json();
                    const resolved = data?.suggestions?.find((item) => item.eLoc === place.eLoc || item.placeID === place.placeID);
                    if (resolved) {
                        lat = resolved.latitude || resolved.lat || lat;
                        lng = resolved.longitude || resolved.lng || lng;
                        console.log(`✅ Resolved: ${lat}, ${lng}`);
                    }
                }
            } catch (err) {
                console.warn("⚠️ resolveELoc error:", err.message);
            }
        }

        console.log(`📍 Final coordinates for "${displayAddress}":`, { lat, lng, eLoc: place.eLoc });

        // ── Build placeData ──────────────────────────────────────────────
        const placeData = {
            formatted_address: place.placeAddress || displayAddress,
            cityName: cityName || "",
            displayAddress,
            eLoc: place.eLoc || null,
            coordinates: (lat && lng) ? { latitude: lat, longitude: lng, lat, lng } : null,
            latitude: lat,
            longitude: lng,
            lat,
            lng
        };

        // ── Full place address for sublocality auto-fill ─────────────────
        // ── Build full place address ────────────────────────────────────────
        let fullPlaceAddress = place.placeAddress || place.formatted_address || "";
        
        // If placeAddress is just a state name (insufficient), use displayAddress instead
        if (fullPlaceAddress && fullPlaceAddress.length > 5) {
            const stateNames = [
                "Maharashtra", "Karnataka", "Gujarat", "Rajasthan", "Delhi",
                "Tamil Nadu", "Kerala", "Goa", "Madhya Pradesh", "Uttar Pradesh",
                "West Bengal", "Telangana", "Andhra Pradesh", "Punjab", "Haryana",
            ];
            // If placeAddress is only a state name, use the more complete displayAddress
            if (stateNames.includes(fullPlaceAddress.trim()) && displayAddress !== fullPlaceAddress) {
                fullPlaceAddress = displayAddress;
            }
        }

        // ════════════════════════════════════════════════════════════════
        // PICKUP CITY
        // ════════════════════════════════════════════════════════════════
        if (field === "pickupCity") {
            setPickupCityPlace(placeData);
            setPickupCityAddress(displayAddress);
            setShowAutocomplete(prev => ({ ...prev, pickup: false }));
            if (pickupCityRef.current) pickupCityRef.current.value = displayAddress;

            // ✅ AUTO-POPULATE sublocality with full place address
            if (fullPlaceAddress && fullPlaceAddress.length > 5) {
                const sublocalityData = buildSublocalityData(placeData, placeData, cityName, fullPlaceAddress);
                setPickupSublocalityPlace(sublocalityData);
                setPickupSublocalityAddress(fullPlaceAddress);
                if (pickupSublocalityRef.current) pickupSublocalityRef.current.value = fullPlaceAddress;
                console.log("✅ Auto-populated pickup sublocality:", fullPlaceAddress);
            } else {
                // Clear sublocality if no full address available
                setPickupSublocalityAddress("");
                setPickupSublocalityPlace(null);
                if (pickupSublocalityRef.current) pickupSublocalityRef.current.value = "";
            }

        // ════════════════════════════════════════════════════════════════
        // DESTINATION CITY
        // ════════════════════════════════════════════════════════════════
        } else if (field === "destinationCity") {
            setDestinationCityPlace(placeData);
            setDestinationCityAddress(displayAddress);
            setShowAutocomplete(prev => ({ ...prev, destination: false }));
            if (destinationCityRef.current) destinationCityRef.current.value = displayAddress;

            // ✅ AUTO-POPULATE sublocality with full place address
            if (fullPlaceAddress && fullPlaceAddress.length > 5) {
                const sublocalityData = buildSublocalityData(placeData, placeData, cityName, fullPlaceAddress);
                setDestinationSublocalityPlace(sublocalityData);
                setDestinationSublocalityAddress(fullPlaceAddress);
                if (destinationSublocalityRef.current) destinationSublocalityRef.current.value = fullPlaceAddress;
                console.log("✅ Auto-populated destination sublocality:", fullPlaceAddress);
            } else {
                setDestinationSublocalityAddress("");
                setDestinationSublocalityPlace(null);
                if (destinationSublocalityRef.current) destinationSublocalityRef.current.value = "";
            }

        // ════════════════════════════════════════════════════════════════
        // PICKUP SUBLOCALITY (manual search override)
        // ════════════════════════════════════════════════════════════════
        } else if (field === "pickupSublocality") {
            const sublocalityData = buildSublocalityData(placeData, pickupCityPlace, cityName, displayAddress);
            console.log("🏘️ Created pickup sublocality with inherited city:", {
                displayAddress: sublocalityData.displayAddress,
                cityName: sublocalityData.cityName,
                parentCity: sublocalityData.parentCity,
                hasCoordinates: !!(sublocalityData.lat && sublocalityData.lng)
            });
            setPickupSublocalityPlace(sublocalityData);
            setPickupSublocalityAddress(displayAddress);
            setShowAutocomplete(prev => ({ ...prev, pickupSublocality: false }));
            if (pickupSublocalityRef.current) pickupSublocalityRef.current.value = displayAddress;

        // ════════════════════════════════════════════════════════════════
        // DESTINATION SUBLOCALITY (manual search override)
        // ════════════════════════════════════════════════════════════════
        } else if (field === "destinationSublocality") {
            const sublocalityData = buildSublocalityData(placeData, destinationCityPlace, cityName, displayAddress);
            console.log("🏘️ Created destination sublocality with inherited city:", {
                displayAddress: sublocalityData.displayAddress,
                cityName: sublocalityData.cityName,
                parentCity: sublocalityData.parentCity,
                hasCoordinates: !!(sublocalityData.lat && sublocalityData.lng)
            });
            setDestinationSublocalityPlace(sublocalityData);
            setDestinationSublocalityAddress(displayAddress);
            setShowAutocomplete(prev => ({ ...prev, destinationSublocality: false }));
            if (destinationSublocalityRef.current) destinationSublocalityRef.current.value = displayAddress;
        }
    };

    // ════════════════════════════════════════════════════════════════════
    // USE CURRENT LOCATION
    // ════════════════════════════════════════════════════════════════════
    const getCurrentLocation = async () => {
        setCurrentLocationLoading(true);

        try {
            // Use our locationService which handles both web and native
            const location = await locationService.getCurrentLocation();
            const { latitude, longitude } = location;
            console.log("Got coordinates:", latitude, longitude);

            const response = await fetch(`${API_BASE}/api/places/reverse-geocode?lat=${latitude}&lng=${longitude}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            console.log("Reverse geocode response:", data);

            if (data.success && data.place && data.place.cityName && data.place.cityName !== "My Location") {
                // Pass the full placeAddress so sublocality gets auto-populated
                handlePlaceSelect({
                    ...data.place,
                    placeAddress: data.place.placeAddress || data.place.formatted_address || "",
                }, 'pickupCity');
            } else {
                // Fallback — coords only, no city detected
                alert("Could not detect your city automatically. Please type your pickup city manually.");
            }
        } catch (error) {
            setCurrentLocationLoading(false);
            console.error("Geolocation error:", error);
            if (error.message.includes('permission')) {
                alert("Location permission denied. Please enable location access in your device settings and try again.");
            } else {
                alert("Error getting location. Please enter manually.");
            }
        } finally {
            setCurrentLocationLoading(false);
        }
    };

    // ════════════════════════════════════════════════════════════════════
    // DISTANCE CALCULATION
    // ════════════════════════════════════════════════════════════════════
    useEffect(() => {
        const effectivePickupCity = pickupSublocalityPlace?.cityName || pickupCityPlace?.cityName;
        const effectiveDestinationCity = destinationSublocalityPlace?.cityName || destinationCityPlace?.cityName;

        if (effectivePickupCity && effectiveDestinationCity) {
            console.log('🔍 Calculating distance with effective cities:', {
                pickup: { city: pickupCityPlace?.cityName, effectiveCityName: effectivePickupCity },
                destination: { city: destinationCityPlace?.cityName, effectiveCityName: effectiveDestinationCity }
            });

            const dist = getCityDistance(effectivePickupCity, effectiveDestinationCity);

            if (dist) {
                setDistance(dist);
                console.log(`✅ Route found: ${effectivePickupCity} → ${effectiveDestinationCity} = ${dist} km`);
            } else {
                setDistance(null);
                console.log(`❌ Route not found: ${effectivePickupCity} → ${effectiveDestinationCity}`);
            }
        } else {
            setDistance(null);
            console.log('⚠️ Missing city data:', {
                hasPickupCity: !!pickupCityPlace,
                hasPickupSublocality: !!pickupSublocalityPlace,
                hasDestinationCity: !!destinationCityPlace,
                hasDestinationSublocality: !!destinationSublocalityPlace,
                effectivePickupCity,
                effectiveDestinationCity
            });
        }
    }, [pickupCityPlace, pickupSublocalityPlace, destinationCityPlace, destinationSublocalityPlace]);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
        return () => unsubscribe();
    }, []);

    // ════════════════════════════════════════════════════════════════════
    // FETCH DRIVERS
    // ════════════════════════════════════════════════════════════════════
    const fetchDriversForRoute = async (fromCity, toCity, userCoords) => {
        console.log("🔍 Fetching nearby drivers for route:", fromCity, "→", toCity);

        const body = { fromCity, toCity, radiusKm: 15 };

        if (userCoords?.latitude && userCoords?.longitude) {
            body.userLat = userCoords.latitude;
            body.userLng = userCoords.longitude;
        } else if (pickupSublocalityPlace?.eLoc) {
            body.userELoc = pickupSublocalityPlace.eLoc;
            body.userPlaceAddress = pickupSublocalityPlace.displayAddress || pickupSublocalityPlace.formatted_address;
        } else if (pickupCityPlace?.eLoc) {
            body.userELoc = pickupCityPlace.eLoc;
            body.userPlaceAddress = pickupCityPlace.displayAddress || pickupCityPlace.formatted_address;
        }

        try {
            const response = await fetch(`${FIREBASE_FUNCTIONS_URL}/getNearbyDrivers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            console.log(`✅ Nearby drivers: ${data.nearby} of ${data.total} total`);
            return data.drivers || [];

        } catch (error) {
            console.error("❌ getNearbyDrivers error:", error);
            const driversRef = collection(db, "drivers");
            const q = query(driversRef, where("assignedRoutes", "array-contains", { from: fromCity, to: toCity }));
            const querySnapshot = await getDocs(q);
            const drivers = [];
            querySnapshot.forEach((docSnap) => drivers.push({ id: docSnap.id, ...docSnap.data() }));
            return drivers;
        }
    };

    const sendRideRequestsToDrivers = async (bookingId, rideData, drivers) => {
        const now = new Date();
        const formattedDate = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        const formattedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

        const promises = [];
        for (const driver of drivers) {
            const requestRef = doc(db, "drivers", driver.id, "incomingRequests", bookingId);

            let scheduleDate = formattedDate;
            let scheduleTime = formattedTime;

            if (rideData.rideType === "schedule" && rideData.scheduledDateTime) {
                const scheduledDate = new Date(rideData.scheduledDateTime);
                scheduleDate = scheduledDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
                scheduleTime = scheduledDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
            }

            const pickupCoords = rideData.pickupCoordinates;
            const coordinatesForDriver = pickupCoords ? {
                latitude: pickupCoords.latitude,
                longitude: pickupCoords.longitude,
                lat: pickupCoords.latitude,
                lng: pickupCoords.longitude,
                accuracy: pickupCoords.accuracy || 'unknown',
                isSublocality: pickupCoords.isSublocality || false,
                parentCity: pickupCoords.parentCity
            } : null;

            const requestData = {
                bookingId,
                type: 'outstation',
                from: rideData.pickupCityForDriver || rideData.pickupCity?.split(',')[0]?.trim() || '',
                fromSublocality: rideData.pickupSublocality || null,
                to: rideData.destinationCityForDriver || rideData.destinationCity?.split(',')[0]?.trim() || '',
                toSublocality: rideData.destinationSublocality || null,
                pickupCoordinates: coordinatesForDriver,
                coordinates: coordinatesForDriver,
                latitude: coordinatesForDriver?.latitude,
                longitude: coordinatesForDriver?.longitude,
                lat: coordinatesForDriver?.lat,
                lng: coordinatesForDriver?.lng,
                pickupLocation: rideData.pickupSublocalityAddress || rideData.pickupCity,
                pickupSublocalityAddress: rideData.pickupSublocalityAddress || rideData.pickupCity,
                fare: rideData.totalPrice,
                basePrice: rideData.basePrice,
                gstAmount: rideData.gstAmount,
                createdAt: serverTimestamp(),
                destinationSublocalityAddress: rideData.destinationSublocalityAddress || rideData.destinationCity,
                carName: rideData.car.name,
                passengerCount: rideData.passengerCount,
                distance: rideData.distance,
                days: rideData.days,
                userName: rideData.userName || 'Customer',
                userPhone: rideData.userPhone || 'Not provided',
                userEmail: rideData.userEmail || '',
                date: scheduleDate,
                time: scheduleTime,
                bookingTime: now.toISOString(),
                vehicle: { name: rideData.car.name, capacity: rideData.car.capacity, type: rideData.car.name.split(' ')[0] },
                tripType: 'outstation',
                duration: rideData.days > 1 ? `${rideData.days} days` : '1 day',
                status: 'pending',
                requestedAt: serverTimestamp(),
                bookingReference: bookingId,
                rideType: rideData.rideType,
                rideDate: rideData.rideDate,
                rideTime: rideData.rideTime,
                scheduledDateTime: rideData.scheduledDateTime || null,
                isScheduled: rideData.rideType === "schedule",
                driverMessage: rideData.rideType === "schedule" ? "Scheduled ride request" : "Immediate ride request",
                requiresPayment: rideData.rideType === "schedule",
                paymentStatus: rideData.rideType === "schedule" ? 'pending' : null,
            };

            promises.push(setDoc(requestRef, requestData));
        }

        await Promise.all(promises);
        console.log(`✅ Successfully sent ${promises.length} requests`);
    };

    // ════════════════════════════════════════════════════════════════════
    // BOOK NOW
    // ════════════════════════════════════════════════════════════════════
    const handleBookNow = async (vehicle, priceData) => {
        if (isBooking) return; // prevent double/multiple bookings
        setIsBooking(true);
        if (!distance) {
            alert("Please select valid pickup and destination cities from our route network.");
            return;
        }
        if (!user) {
            navigate("/login", { state: { redirectTo: "/outstation" } });
            return;
        }
        if (rideType === "schedule") {
            const scheduledDate = new Date(`${rideDate}T${rideTime}`);
            const minScheduleTime = new Date(Date.now() + 30 * 60000);
            if (scheduledDate < minScheduleTime) {
                alert("Please schedule your ride at least 30 minutes from now.");
                return;
            }
        }

        const pickupCityForDriver = (
        pickupCityPlace?.cityName ||
        pickupSublocalityPlace?.cityName ||
        pickupSublocalityPlace?.parentCity ||
        ''
        ).replace(/ District$/i, '').replace(/ City$/i, '').trim();

        const destinationCityForDriver = (
        destinationCityPlace?.cityName ||
        destinationSublocalityPlace?.cityName ||
        destinationSublocalityPlace?.parentCity ||
        ''
        ).replace(/ District$/i, '').replace(/ City$/i, '').trim();

        // Add this safety log:
        console.log("🏙️ Cities for driver:", { pickupCityForDriver, destinationCityForDriver });

        const resolvedPickupCoords =
            (pickupSublocalityPlace?.coordinates?.latitude && pickupSublocalityPlace?.coordinates?.longitude)
                ? { ...pickupSublocalityPlace.coordinates, isSublocality: true, accuracy: "exact", parentCity: pickupCityPlace?.cityName }
                : (pickupCityPlace?.coordinates?.latitude && pickupCityPlace?.coordinates?.longitude)
                    ? { ...pickupCityPlace.coordinates, isSublocality: false, accuracy: "city" }
                    : null;

        const bookingData = {
            car: vehicle,
            pickupCity: pickupCityAddress,
            pickupCityForDriver,
            pickupSublocality: pickupSublocalityAddress || null,
            pickupSublocalityAddress: pickupSublocalityAddress || pickupCityAddress,
            pickupELoc: pickupSublocalityPlace?.eLoc || pickupCityPlace?.eLoc || null,
            pickupSublocalityELoc: pickupSublocalityPlace?.eLoc || null,
            pickupPlaceAddress: pickupSublocalityPlace?.displayAddress || pickupCityPlace?.displayAddress || pickupCityAddress,
            pickupCoordinates: resolvedPickupCoords,
            destinationCity: destinationCityAddress,
            destinationCityForDriver,
            destinationSublocality: destinationSublocalityAddress || null,
            destinationSublocalityAddress: destinationSublocalityAddress || destinationCityAddress,
            passengerCount,
            days,
            distance,
            basePrice: priceData.basePrice,
            gstAmount: priceData.gstAmount,
            totalPrice: priceData.totalPrice,
            rideType,
            rideDate,
            rideTime,
            scheduledDateTime: rideType === "schedule" ? `${rideDate}T${rideTime}` : null,
            status: rideType === "now" ? "searching_driver" : "scheduled_pending",
            driverStatus: rideType === "now" ? "searching" : "scheduled",
            userId: user.uid,
            userName: user.displayName || "Customer",
            userPhone: user.phoneNumber || "Not provided",
            userEmail: user.email || "",
            createdAt: serverTimestamp(),
            type: "outstation",
            updatedAt: serverTimestamp(),
            requiresPayment: rideType === "schedule",
            paymentStatus: rideType === "schedule" ? "pending" : null,
            isScheduled: rideType === "schedule",
        };

        try {
            const response = await fetch(`${API_BASE}/api/outstation-bookings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bookingData),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            const bookingId = result.bookingId;

            if (bookingId) {

                if (rideType === "now") {
                    navigate("/booking-form", { state: { bookingId, ...bookingData } });
                } else {
                    navigate("/scheduled-confirmation", {
                        state: {
                            bookingId,
                            ...bookingData,
                            isScheduled: true,
                            rideDate,
                            rideTime,
                            scheduledDateTime: `${rideDate}T${rideTime}`,
                        },
                    });
                }
            }
        } catch (error) {
            alert("Booking failed, please try again.");
            console.error("Booking Error:", error);
            setIsBooking(false); // allow retry on failure
        }
    };

    const suggestedVehicles = vehicles.filter((v) => v.capacity >= passengerCount);

    const handlePickupCitySearch = (e) => {
        const val = e.target.value;
        setPickupCityAddress(val);
        if (val.length >= 2) searchPlaces(val, 'pickup');
        else setShowAutocomplete(prev => ({ ...prev, pickup: false }));
    };

    const handleDestinationCitySearch = (e) => {
        const val = e.target.value;
        setDestinationCityAddress(val);
        if (val.length >= 2) searchPlaces(val, 'destination');
        else setShowAutocomplete(prev => ({ ...prev, destination: false }));
    };

    const handlePickupSublocalitySearch = (e) => {
        const val = e.target.value;
        setPickupSublocalityAddress(val);
        if (val.length >= 2) searchPlaces(val, 'pickupSublocality', pickupCityPlace);
        else setShowAutocomplete(prev => ({ ...prev, pickupSublocality: false }));
    };

    const handleDestinationSublocalitySearch = (e) => {
        const val = e.target.value;
        setDestinationSublocalityAddress(val);
        if (val.length >= 2) searchPlaces(val, 'destinationSublocality', destinationCityPlace);
        else setShowAutocomplete(prev => ({ ...prev, destinationSublocality: false }));
    };

    // ════════════════════════════════════════════════════════════════════
    // RENDER
    // ════════════════════════════════════════════════════════════════════
    return (
        <div className="w-full min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
            {/* MOBILE STICKY HEADER */}
            <div className="md:hidden sticky top-14 z-30 bg-white border-b border-gray-100 shadow-sm">
                <div className="flex items-center px-4 py-3 pt-2 md:pt-8">
                    <div className="flex-1">
                        <h1 className="text-lg font-bold text-gray-900">Outstation</h1>
                        <p className="text-xs text-gray-500">Intercity cab booking</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setRideType("now")} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${rideType === "now" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600"}`}>Now</button>
                        <button onClick={() => setRideType("schedule")} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${rideType === "schedule" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600"}`}>Schedule</button>
                    </div>
                </div>
            </div>
            <div className="container mx-auto px-4 py-8">
                <div className="text-center mb-10 hidden md:block">
                    <h1 className="text-4xl font-bold text-gray-800 mb-3">Outstation Cab Booking</h1>
                    <p className="text-gray-600 text-lg">Book comfortable cabs for intercity travel with flexible scheduling</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-6xl mx-auto">
                    {/* Ride Type Selection */}
                    <div className="mb-8 hidden md:block">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                            <FaCalendarAlt className="mr-3 text-orange-500" />
                            Select Your Ride Type
                        </h2>
                        <div className="flex flex-wrap gap-4">
                            <button
                                type="button"
                                onClick={() => setRideType("now")}
                                className={`flex-1 min-w-[180px] py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-3 transition-all duration-300 shadow-md ${rideType === "now"
                                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-200 transform scale-105"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-lg border border-gray-200"
                                    }`}
                            >
                                <FaClock className="text-xl" />
                                <div className="text-left">
                                    <div className="font-bold">Ride Now</div>
                                    <div className="text-sm opacity-90">Book immediately</div>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRideType("schedule")}
                                className={`flex-1 min-w-[180px] py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-3 transition-all duration-300 shadow-md ${rideType === "schedule"
                                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-200 transform scale-105"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-lg border border-gray-200"
                                    }`}
                            >
                                <FaCalendarAlt className="text-xl" />
                                <div className="text-left">
                                    <div className="font-bold">Schedule Ride</div>
                                    <div className="text-sm opacity-90">Plan for later</div>
                                </div>
                            </button>
                        </div>

                        {rideType === "schedule" && (
                            <div className="mt-6 p-5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                                <div className="flex items-center mb-4">
                                    <FaCalendarAlt className="text-orange-500 text-xl mr-3" />
                                    <h3 className="text-lg font-semibold text-gray-800">Schedule Your Trip</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block mb-2 text-gray-700 font-medium">Select Date</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                min={formatDate(today)}
                                                max={formatDate(maxDate)}
                                                value={rideDate}
                                                onChange={(e) => setRideDate(e.target.value)}
                                                className="w-full p-3 rounded-lg bg-white border-2 border-orange-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            />
                                            <FaCalendarAlt className="absolute right-3 top-3 text-orange-400" />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">Available from {formatDate(today)} to {formatDate(maxDate)}</p>
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-gray-700 font-medium">Select Time</label>
                                        <div className="relative">
                                            <select
                                                value={rideTime}
                                                onChange={(e) => setRideTime(e.target.value)}
                                                className="w-full p-3 rounded-lg bg-white border-2 border-orange-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none"
                                            >
                                                {availableTimeSlots.map((slot, index) => (
                                                    <option key={index} value={slot.value}>{slot.label}</option>
                                                ))}
                                            </select>
                                            <FaClock className="absolute right-3 top-3 text-orange-400" />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">Available from 6:00 AM to 10:00 PM</p>
                                    </div>
                                </div>
                                <div className="mt-4 p-3 bg-orange-100 rounded-lg border border-orange-300">
                                    <p className="text-orange-700 font-medium">
                                        <strong>Your trip is scheduled for:</strong> {rideDate} at {rideTime}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* MOBILE SCHEDULE PICKER - only shows when schedule mode active */}
                    {rideType === "schedule" && (
                        <div className="md:hidden mx-4 mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                            <div className="flex items-center mb-3">
                                <FaCalendarAlt className="text-amber-500 mr-2" />
                                <span className="font-semibold text-gray-800 text-sm">Schedule Your Ride</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Date</label>
                                    <input type="date" min={formatDate(today)} max={formatDate(maxDate)} value={rideDate} onChange={(e) => setRideDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-white border border-amber-200 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Time</label>
                                    <select value={rideTime} onChange={(e) => setRideTime(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-white border border-amber-200 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                                        {availableTimeSlots.map((slot, i) => <option key={i} value={slot.value}>{slot.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Location Inputs */}
                    <div ref={autocompleteContainerRef}>
                    <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

                        {/* ── Pickup Location ── */}
                        <div className="space-y-4 relative">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                                    <FaMapMarkerAlt className="mr-2 text-orange-500" /> Pickup Location
                                </h3>
                                <button
                                    type="button"
                                    onClick={getCurrentLocation}
                                    disabled={currentLocationLoading}
                                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {currentLocationLoading
                                        ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Detecting...</span></>
                                        : <><FaCrosshairs /><span>Use Current Location</span></>
                                    }
                                </button>
                            </div>

                            {/* Pickup City */}
                            <div>
                                <label className="block mb-2 text-gray-700 font-medium">City:</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        ref={pickupCityRef}
                                        className="w-full p-3 pl-10 rounded-lg bg-gray-50 border-2 border-orange-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Enter pickup city"
                                        value={pickupCityAddress}
                                        onChange={handlePickupCitySearch}
                                    />
                                    <FaMapMarkerAlt className="absolute left-3 top-3 text-orange-400" />
                                </div>
                                {showAutocomplete.pickup && autocompleteResults.pickup.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-orange-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {autocompleteResults.pickup.map((place, index) => (
                                            <div
                                                key={`${place.eLoc || index}`}
                                                className="p-3 hover:bg-orange-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                onClick={() => handlePlaceSelect(place, 'pickupCity')}
                                            >
                                                <div className="font-medium text-gray-800">{place.placeName || place.name || "Location"}</div>
                                                <div className="text-sm text-gray-600">{place.placeAddress || place.cityName || ""}</div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {place.cityName || place.city || place.district || ""}
                                                    {(place.stateName || place.state) && `, ${place.stateName || place.state}`}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Pickup Sublocality */}
                            <div>
                                <label className="block mb-2 text-gray-700 font-medium">
                                    Sublocality / Pickup Address:
                                    {pickupSublocalityAddress && (
                                        <span className="ml-2 text-xs text-green-600 font-normal">✅ Auto-filled</span>
                                    )}
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        ref={pickupSublocalityRef}
                                        className="w-full p-3 pl-10 rounded-lg bg-gray-50 border-2 border-orange-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                        placeholder={pickupCityPlace ? `Search area in ${pickupCityPlace.cityName}` : "Select city first"}
                                        value={pickupSublocalityAddress}
                                        onChange={handlePickupSublocalitySearch}
                                        disabled={!pickupCityPlace}
                                    />
                                    <FaMapPin className="absolute left-3 top-3 text-orange-400" />
                                </div>
                                {!pickupCityPlace && <p className="text-xs text-orange-600 mt-1">Please select pickup city first</p>}
                                {pickupCityPlace && <p className="text-xs text-gray-500 mt-1">You can refine your exact pickup location</p>}
                                {showAutocomplete.pickupSublocality && autocompleteResults.pickupSublocality.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-orange-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {autocompleteResults.pickupSublocality.map((place, index) => (
                                            <div
                                                key={`${place.eLoc || index}`}
                                                className="p-3 hover:bg-orange-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                onClick={() => handlePlaceSelect(place, 'pickupSublocality')}
                                            >
                                                <div className="font-medium text-gray-800">{place.placeName || place.name || "Location"}</div>
                                                <div className="text-sm text-gray-600">{place.placeAddress || place.cityName || ""}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Destination Location ── */}
                        <div className="space-y-4 relative">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center">
                                <FaMapMarkerAlt className="mr-2 text-orange-500" /> Destination Location
                            </h3>

                            {/* Destination City */}
                            <div>
                                <label className="block mb-2 text-gray-700 font-medium">City:</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        ref={destinationCityRef}
                                        className="w-full p-3 pl-10 rounded-lg bg-gray-50 border-2 border-orange-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Enter destination city"
                                        value={destinationCityAddress}
                                        onChange={handleDestinationCitySearch}
                                    />
                                    <FaMapMarkerAlt className="absolute left-3 top-3 text-orange-400" />
                                </div>
                                {showAutocomplete.destination && autocompleteResults.destination.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-orange-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {autocompleteResults.destination.map((place, index) => (
                                            <div
                                                key={`${place.eLoc || index}`}
                                                className="p-3 hover:bg-orange-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                onClick={() => handlePlaceSelect(place, 'destinationCity')}
                                            >
                                                <div className="font-medium text-gray-800">{place.placeName || place.name || "Location"}</div>
                                                <div className="text-sm text-gray-600">{place.placeAddress || place.cityName || ""}</div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {place.cityName || place.city || place.district || ""}
                                                    {(place.stateName || place.state) && `, ${place.stateName || place.state}`}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Destination Sublocality */}
                            <div>
                                <label className="block mb-2 text-gray-700 font-medium">
                                    Sublocality / Drop Address:
                                    {destinationSublocalityAddress && (
                                        <span className="ml-2 text-xs text-green-600 font-normal">✅ Auto-filled</span>
                                    )}
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        ref={destinationSublocalityRef}
                                        className="w-full p-3 pl-10 rounded-lg bg-gray-50 border-2 border-orange-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                        placeholder={destinationCityPlace ? `Search area in ${destinationCityPlace.cityName}` : "Select city first"}
                                        value={destinationSublocalityAddress}
                                        onChange={handleDestinationSublocalitySearch}
                                        disabled={!destinationCityPlace}
                                    />
                                    <FaMapPin className="absolute left-3 top-3 text-orange-400" />
                                </div>
                                {!destinationCityPlace && <p className="text-xs text-orange-600 mt-1">Please select destination city first</p>}
                                {destinationCityPlace && <p className="text-xs text-gray-500 mt-1">You can refine your exact drop location</p>}
                                {showAutocomplete.destinationSublocality && autocompleteResults.destinationSublocality.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-orange-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {autocompleteResults.destinationSublocality.map((place, index) => (
                                            <div
                                                key={`${place.eLoc || index}`}
                                                className="p-3 hover:bg-orange-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                onClick={() => handlePlaceSelect(place, 'destinationSublocality')}
                                            >
                                                <div className="font-medium text-gray-800">{place.placeName || place.name || "Location"}</div>
                                                <div className="text-sm text-gray-600">{place.placeAddress || place.cityName || ""}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* MOBILE UBER-STYLE LOCATION CARD */}
                    <div className="md:hidden mb-4">
                        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-visible">
                            <div className="flex items-stretch px-4 py-3 gap-3">
                                <div className="flex flex-col items-center pt-1 pb-1 w-5 flex-shrink-0">
                                    <div className="w-3 h-3 rounded-full border-2 border-orange-500 bg-white mt-1"></div>
                                    <div className="w-0.5 flex-1 bg-gradient-to-b from-orange-300 to-orange-500 my-1 min-h-[32px]"></div>
                                    <div className="w-3 h-3 rounded-full bg-orange-500 mb-1"></div>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="relative">
                                        <input type="text" ref={pickupCityRef}
                                            className="w-full px-3 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
                                            placeholder="Pickup city" value={pickupCityAddress} onChange={handlePickupCitySearch} />
                                        {showAutocomplete.pickup && autocompleteResults.pickup.length > 0 && (
                                            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-orange-100 rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto">
                                                {autocompleteResults.pickup.map((place, index) => (
                                                    <div key={`${place.eLoc || index}`} className="px-4 py-3 hover:bg-orange-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-start gap-2" onClick={() => handlePlaceSelect(place, 'pickupCity')}>
                                                        <FaMapMarkerAlt className="text-orange-400 mt-0.5 flex-shrink-0 text-xs" />
                                                        <div>
                                                            <div className="font-medium text-gray-800 text-sm">{place.placeName || place.name}</div>
                                                            <div className="text-xs text-gray-500">{place.placeAddress || place.cityName}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <input type="text" ref={destinationCityRef}
                                            className="w-full px-3 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
                                            placeholder="Destination city" value={destinationCityAddress} onChange={handleDestinationCitySearch} />
                                        {showAutocomplete.destination && autocompleteResults.destination.length > 0 && (
                                            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-orange-100 rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto">
                                                {autocompleteResults.destination.map((place, index) => (
                                                    <div key={`${place.eLoc || index}`} className="px-4 py-3 hover:bg-orange-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-start gap-2" onClick={() => handlePlaceSelect(place, 'destinationCity')}>
                                                        <FaMapMarkerAlt className="text-orange-400 mt-0.5 flex-shrink-0 text-xs" />
                                                        <div>
                                                            <div className="font-medium text-gray-800 text-sm">{place.placeName || place.name}</div>
                                                            <div className="text-xs text-gray-500">{place.placeAddress || place.cityName}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="px-4 pb-3">
                                <button type="button" onClick={getCurrentLocation} disabled={currentLocationLoading}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-50 border border-orange-200 rounded-xl text-orange-600 text-sm font-medium hover:bg-orange-100 disabled:opacity-50">
                                    {currentLocationLoading
                                        ? <><div className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>Detecting...</>
                                        : <><FaCrosshairs />Use current location</>}
                                </button>
                            </div>
                            {pickupCityPlace && (
                                <div className="border-t border-gray-100">
                                    <button className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-gray-50" onClick={() => setExpandedPickup(!expandedPickup)}>
                                        <span className="flex items-center gap-2 text-xs text-gray-500">
                                            <FaMapPin className="text-orange-400" />
                                            {pickupSublocalityAddress ? pickupSublocalityAddress.substring(0, 35) + "..." : "Add exact pickup address (optional)"}
                                        </span>
                                        {expandedPickup ? <FaChevronUp className="text-gray-400 text-xs" /> : <FaChevronDown className="text-gray-400 text-xs" />}
                                    </button>
                                    {expandedPickup && (
                                        <div className="px-4 pb-3 relative">
                                            <input type="text" ref={pickupSublocalityRef}
                                                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                                placeholder={`Search area in ${pickupCityPlace.cityName}`}
                                                value={pickupSublocalityAddress} onChange={handlePickupSublocalitySearch} />
                                            {showAutocomplete.pickupSublocality && autocompleteResults.pickupSublocality.length > 0 && (
                                                <div className="absolute left-4 right-4 top-full bg-white border border-orange-100 rounded-xl shadow-xl z-50 max-h-44 overflow-y-auto">
                                                    {autocompleteResults.pickupSublocality.map((place, index) => (
                                                        <div key={`${place.eLoc || index}`} className="px-3 py-2.5 hover:bg-orange-50 cursor-pointer text-sm border-b border-gray-50 last:border-0" onClick={() => handlePlaceSelect(place, 'pickupSublocality')}>
                                                            <div className="font-medium text-gray-800">{place.placeName || place.name}</div>
                                                            <div className="text-xs text-gray-500">{place.placeAddress}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                            {destinationCityPlace && (
                                <div className="border-t border-gray-100">
                                    <button className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-gray-50" onClick={() => setExpandedDest(!expandedDest)}>
                                        <span className="flex items-center gap-2 text-xs text-gray-500">
                                            <FaMapPin className="text-orange-400" />
                                            {destinationSublocalityAddress ? destinationSublocalityAddress.substring(0, 35) + "..." : "Add exact drop address (optional)"}
                                        </span>
                                        {expandedDest ? <FaChevronUp className="text-gray-400 text-xs" /> : <FaChevronDown className="text-gray-400 text-xs" />}
                                    </button>
                                    {expandedDest && (
                                        <div className="px-4 pb-3 relative">
                                            <input type="text" ref={destinationSublocalityRef}
                                                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                                placeholder={`Search area in ${destinationCityPlace.cityName}`}
                                                value={destinationSublocalityAddress} onChange={handleDestinationSublocalitySearch} />
                                            {showAutocomplete.destinationSublocality && autocompleteResults.destinationSublocality.length > 0 && (
                                                <div className="absolute left-4 right-4 top-full bg-white border border-orange-100 rounded-xl shadow-xl z-50 max-h-44 overflow-y-auto">
                                                    {autocompleteResults.destinationSublocality.map((place, index) => (
                                                        <div key={`${place.eLoc || index}`} className="px-3 py-2.5 hover:bg-orange-50 cursor-pointer text-sm border-b border-gray-50 last:border-0" onClick={() => handlePlaceSelect(place, 'destinationSublocality')}>
                                                            <div className="font-medium text-gray-800">{place.placeName || place.name}</div>
                                                            <div className="text-xs text-gray-500">{place.placeAddress}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    </div>

                    {/* Trip Details */}
                    {/* MOBILE TRIP DETAILS */}
                    <div className="md:hidden mb-4">
                        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Trip Details</h3>
                            <div className="flex gap-3">
                                <div className="flex-1 bg-gray-50 rounded-xl p-3">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <FaUsers className="text-orange-400 text-xs" />
                                        <span className="text-xs text-gray-500">Passengers</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => passengerCount > 1 && setPassengerCount(passengerCount - 1)} className="w-7 h-7 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center disabled:opacity-40" disabled={passengerCount <= 1}>−</button>
                                        <span className="text-base font-bold text-gray-800 w-6 text-center">{passengerCount}</span>
                                        <button onClick={() => passengerCount < 25 && setPassengerCount(passengerCount + 1)} className="w-7 h-7 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center disabled:opacity-40" disabled={passengerCount >= 25}>+</button>
                                    </div>
                                </div>
                                <div className="flex-1 bg-gray-50 rounded-xl p-3">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <FaCalendarAlt className="text-orange-400 text-xs" />
                                        <span className="text-xs text-gray-500">Days</span>
                                    </div>
                                    <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-full bg-transparent text-base font-bold text-gray-800 focus:outline-none">
                                        {[...Array(7)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1} Day{i + 1 > 1 ? "s" : ""}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mb-8 hidden md:block">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Trip Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200">
                                <label className="block mb-3 text-gray-700 font-medium">Number of Passengers:</label>
                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={() => passengerCount > 1 && setPassengerCount(passengerCount - 1)}
                                        className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={passengerCount <= 1}
                                    >−</button>
                                    <input
                                        type="number"
                                        min={1}
                                        max={25}
                                        className="w-20 text-center p-2 rounded-lg border-2 border-orange-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        value={passengerCount}
                                        onChange={(e) => setPassengerCount(Number(e.target.value))}
                                    />
                                    <button
                                        onClick={() => passengerCount < 25 && setPassengerCount(passengerCount + 1)}
                                        className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={passengerCount >= 25}
                                    >+</button>
                                </div>
                            </div>
                            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200">
                                <label className="block mb-3 text-gray-700 font-medium">Number of Days:</label>
                                <select
                                    value={days}
                                    onChange={(e) => setDays(Number(e.target.value))}
                                    className="w-full p-3 rounded-lg bg-white border-2 border-orange-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                >
                                    {[...Array(7)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>{i + 1} Day{i + 1 > 1 ? "s" : ""}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Available Vehicles */}
                    {pickupCityPlace && destinationCityPlace && (
                        <div className="mt-12">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Available Vehicles for Your Trip</h2>

                            {distance ? (
                                <>
                                    <div className="mb-6 p-4 bg-gradient-to-r from-orange-100 to-amber-100 rounded-xl border border-orange-300">
                                        <div className="flex items-center justify-between flex-wrap gap-4">
                                            <div className="flex items-center space-x-4">
                                                <div className="text-center">
                                                    <div className="text-sm text-gray-600">Route Distance</div>
                                                    <div className="text-2xl font-bold text-orange-600">{distance} km</div>
                                                </div>
                                                <div className="text-gray-400">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600">Duration</div>
                                                    <div className="text-xl font-bold text-gray-800">{days} Day{days > 1 ? 's' : ''}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm text-gray-600">Ride Type</div>
                                                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${rideType === "now" ? "bg-orange-500 text-white" : "bg-amber-500 text-white"}`}>
                                                    {rideType === "now" ? "RIDE NOW" : "SCHEDULED"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <div className={`md:hidden fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-full flex items-center space-x-2 z-20 transition-opacity duration-300 ${isFirstCarVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                            <span>Scroll for more options</span>
                                            <FaArrowDown className="ml-2" />
                                        </div>
{/* MOBILE vehicle rows */}
                                        <div className="md:hidden space-y-3 pb-6">
                                            {suggestedVehicles.map((v, index) => {
                                                const basePrice = distance * v.ratePerKm * days;
                                                const priceData = calculatePriceWithGST(basePrice);
                                                return (
                                                    <div key={index} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                                        <div className="flex items-center p-4 gap-3">
                                                            <div className="w-20 h-14 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl flex-shrink-0 overflow-hidden">
                                                                <img src={v.img} alt={v.name} className="w-full h-full object-contain p-1" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div>
                                                                        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{v.name}</h3>
                                                                        <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                                            <FaUsers className="text-gray-400" /> {v.capacity} seats
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-right flex-shrink-0">
                                                                        <div className="text-lg font-bold text-gray-900">₹{priceData.totalPrice.toLocaleString()}</div>
                                                                        <div className="text-xs text-gray-400">incl. GST</div>
                                                                    </div>
                                                                </div>
                                                                <div className="mt-1 text-xs text-gray-400">₹{v.ratePerKm}/km • {distance}km × {days}d</div>
                                                            </div>
                                                        </div>
                                                        <div className="px-4 pb-4">
                                                            <button 
                                                                onClick={() => handleBookNow(v, priceData)} 
                                                                disabled={isBooking}
                                                                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                                                                    isBooking 
                                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                                                    : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white active:scale-95'
                                                                }`}
                                                                >
                                                                {isBooking ? 'Booking...' : (rideType === "now" ? "Book Now" : `Schedule • ${rideDate}`)}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {/* DESKTOP vehicle grid */}
                                        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">                                            {suggestedVehicles.map((v, index) => {
                                                const basePrice = distance * v.ratePerKm * days;
                                                const priceData = calculatePriceWithGST(basePrice);
                                                return (
                                                    <div
                                                        ref={index === 0 ? firstCarRef : null}
                                                        key={index}
                                                        className="group border-2 border-orange-200 rounded-2xl shadow-lg transition-all duration-300 p-5 flex flex-col items-center text-center bg-white hover:border-orange-400 hover:shadow-xl hover:-translate-y-1"
                                                    >
                                                        <div className="w-full h-32 mb-4 overflow-hidden rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 p-2">
                                                            <img src={v.img} alt={v.name} className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-300" />
                                                        </div>
                                                        <h3 className="font-bold text-lg mb-2 text-gray-800">{v.name}</h3>
                                                        <div className="flex items-center justify-center space-x-2 mb-3">
                                                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">Up to {v.capacity} people</span>
                                                            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">₹{v.ratePerKm}/km</span>
                                                        </div>
                                                        <div className="mb-4 w-full">
                                                            <div className="text-sm text-gray-600 mb-1">Estimated Fare</div>
                                                            <div className="text-2xl font-bold text-green-600">₹{priceData.totalPrice}</div>
                                                            <div className="text-xs text-gray-500 mt-1">Base: ₹{priceData.basePrice} + GST (5%): ₹{priceData.gstAmount.toFixed(2)}</div>
                                                            <div className="text-xs text-gray-500">for {distance} km × {days} day{days > 1 ? 's' : ''}</div>
                                                        </div>
                                                        <button
                                                        onClick={() => handleBookNow(v, priceData)}
                                                        disabled={isBooking}
                                                        className={`mt-2 py-3 px-6 rounded-xl font-semibold transition-all duration-300 w-full ${
                                                            isBooking
                                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                            : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 hover:shadow-lg transform hover:scale-105 group-hover:shadow-orange-200'
                                                        }`}
                                                        >
                                                        {isBooking ? 'Booking...' : (rideType === "now" ? "Book Now" : "Schedule Ride")}
                                                        </button>
                                                        {rideType === "schedule" && (
                                                            <div className="mt-3 p-2 bg-amber-50 rounded-lg border border-amber-200 w-full">
                                                                <p className="text-xs text-amber-700">
                                                                    <FaCalendarAlt className="inline mr-1" />
                                                                    Scheduled for {rideDate} at {rideTime}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="p-8 bg-orange-50 border-2 border-orange-200 rounded-xl text-center">
                                    <div className="text-orange-600 text-lg font-semibold mb-2">⚠️ Route Not Available</div>
                                    <p className="text-gray-700">We don't have service for: <strong>{pickupCityPlace?.cityName}</strong> → <strong>{destinationCityPlace?.cityName}</strong></p>
                                    <p className="text-gray-600 mt-2">Please select cities from our available route network or contact us to add this route.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Info Section */}
                <div className="mt-8 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200 max-w-6xl mx-auto">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Why Book With Us?</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                                <FaClock className="text-white" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-800">Flexible Scheduling</h4>
                                <p className="text-sm text-gray-600">Book now or schedule up to 15 days in advance</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                                <FaCrosshairs className="text-white" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-800">Fixed City Rates</h4>
                                <p className="text-sm text-gray-600">Transparent pricing for city-to-city travel</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                                <FaCalendarAlt className="text-white" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-800">Multi-Day Trips</h4>
                                <p className="text-sm text-gray-600">Book for multiple days with transparent pricing</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
