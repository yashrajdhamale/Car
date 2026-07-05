import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import CarSelection from './CarSelection';
import { getAuth } from "firebase/auth";
import { app } from "../../config/firebase";
import QrImage from "../../assets/images/Qrpayment.jpg";
import LocalRideTrackingPage from "../../pages/LocalRideTrackingPage";
import { Capacitor } from '@capacitor/core';

const auth = getAuth(app);

const BACKEND_BASE_URL    = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const SEARCH_API          = `${BACKEND_BASE_URL}/api/local-pickups/search`;
const DISTANCE_API        = `${BACKEND_BASE_URL}/api/local-pickups/distance`;
const DETAILS_API         = `${BACKEND_BASE_URL}/api/local-pickups/resolve-eloc`;
const REVERSE_GEOCODE_API = `${BACKEND_BASE_URL}/api/local-pickups/reverse-geocode`;

const apiRequest = async (path, { method = 'GET', body } = {}) => {
  const currentUser = auth.currentUser;
  const idToken = currentUser?.getIdToken ? await currentUser.getIdToken() : null;
  const response = await fetch(`${BACKEND_BASE_URL}/api${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || data?.error || 'Request failed');
  return data;
};

const PRICING = { gstPercentage: 5, perKmRate: 12 };


// ─── Haversine ─────────────────────────────────────────────
const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── Voice ─────────────────────────────────────────────────
let speechQueue = Promise.resolve();
const speak = (text, options = {}) => {
  if (!("speechSynthesis" in window) || !window.speechSynthesis) return;
  speechQueue = speechQueue.then(() => new Promise((resolve) => {
    const utterance   = new SpeechSynthesisUtterance(text);
    utterance.lang    = "en-IN";
    utterance.rate    = options.rate  ?? 0.95;
    utterance.pitch   = options.pitch ?? 1;
    utterance.volume  = options.volume ?? 1;
    const voices      = window.speechSynthesis.getVoices();
    const preferred   = voices.find(v => v.lang === "en-IN") || voices.find(v => v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;
    utterance.onend   = resolve;
    utterance.onerror = resolve;
    window.speechSynthesis.speak(utterance);
  }));
};

// ─── Validate India coordinates ────────────────────────────
const isValidIndiaCoord = (lat, lng) =>
  lat && lng && !isNaN(lat) && !isNaN(lng) &&
  lat >= 6 && lat <= 37 && lng >= 68 && lng <= 98;

const extractCoordinates = (place) => ({
  lat: parseFloat(place?.latitude || place?.lat || 0) || null,
  lng: parseFloat(place?.longitude || place?.lng || 0) || null,
});

const extractCity = (data) => {
  if (!data?.placeAddress) return "";
  const p = data.placeAddress.split(",").map(s => s.trim());
  return p.length >= 4 ? p[p.length - 3] : p.length >= 2 ? p[p.length - 2] : p[0];
};

// ─── LocationInput Component ───────────────────────────────
function LocationInput({
  icon, placeholder, value, onChange, onSelectGPS,
  suggestions, loading, confirmed, disabled,
  inputRef, onClear, onSelect
}) {
  const containerRef = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => { if (suggestions.length > 0) setOpen(true); }, [suggestions]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span style={{ position: 'absolute', left: '0.9rem', fontSize: '1rem', pointerEvents: 'none', zIndex: 1 }}>{icon}</span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          style={{
            display: 'block', width: '100%', padding: '1rem 2.8rem',
            border: 'none', background: 'transparent', fontSize: '0.97rem',
            fontFamily: "'DM Sans', sans-serif", color: '#1a1a2e',
            outline: 'none', borderRadius: '12px', lineHeight: '1.4'
          }}
          onFocus={() => { if (value.length > 0 || suggestions.length > 0) setOpen(true); }}
          onChange={(e) => {
            onChange(e.target.value);
            if (e.target.value.length === 0) setOpen(false);
          }}
        />
        <div style={{ position: 'absolute', right: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', zIndex: 1 }}>
          {loading && (
            <div style={{ width: 15, height: 15, border: '2px solid #eee', borderTopColor: '#302b63', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          )}
          {!loading && confirmed && (
            <span style={{ background: '#e8f5e9', color: '#2e7d32', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>✓ Set</span>
          )}
          {!loading && !confirmed && value && (
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: '0.85rem', padding: 0, lineHeight: 1 }}
              onMouseDown={(e) => { e.preventDefault(); onClear(); }}
            >✕</button>
          )}
        </div>
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#fff', border: '1.5px solid #e0e0f0', borderRadius: '14px',
          maxHeight: '280px', overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.14)', zIndex: 500
        }}>
          {onSelectGPS && (
            <div
              onMouseDown={(e) => { e.preventDefault(); setOpen(false); onSelectGPS(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.8rem 1rem', cursor: 'pointer',
                background: 'linear-gradient(90deg,#f0f0ff,#fff)',
                borderBottom: '1px solid #eee', fontWeight: 700, color: '#302b63',
                fontSize: '0.9rem', borderRadius: '12px 12px 0 0'
              }}
            >
              🎯 Use my current location
            </div>
          )}
          {suggestions.map((place, i) => (
            <div
              key={i}
              onMouseDown={(e) => { e.preventDefault(); setOpen(false); onSelect(place); }}
              style={{ padding: '0.7rem 1rem', cursor: 'pointer', borderBottom: i < suggestions.length - 1 ? '1px solid #f5f5f5' : 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f5f5ff'}
              onMouseLeave={e => e.currentTarget.style.background = ''}
            >
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#1a1a2e' }}>{place.placeName || place.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '1px' }}>{place.placeAddress || place.address}</div>
            </div>
          ))}
          {value.length >= 3 && suggestions.length === 0 && !loading && (
            <div style={{ padding: '0.9rem 1rem', color: '#aaa', fontSize: '0.88rem', textAlign: 'center' }}>No results found</div>
          )}
        </div>
      )}
    </div>
  );
}

LocationInput.propTypes = {
  icon: PropTypes.node.isRequired,
  placeholder: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSelectGPS: PropTypes.func,
  suggestions: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool,
  confirmed: PropTypes.bool,
  disabled: PropTypes.bool,
  inputRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any }),
  ]),
  onClear: PropTypes.func,
  onSelect: PropTypes.func.isRequired,
};

// ═══════════════════════════════════════════════════════════
export default function LocalPickupPage() {
  const [selectedCity, setSelectedCity]     = useState({ placeId: '', name: 'Pune', address: '', lat: 18.5204, lng: 73.8567 });
  const [showCitySearch, setShowCitySearch] = useState(false);
  const [cityQuery, setCityQuery]           = useState('');
  const [citySugg, setCitySugg]             = useState([]);
  const [loadingCity, setLoadingCity]       = useState(false);

  const [pickup, setPickup]                   = useState('');
  const [pickupData, setPickupData]           = useState({ placeId: '', name: '', address: '', eLoc: '', lat: null, lng: null });
  const [pickupConfirmed, setPickupConfirmed] = useState(false);
  const [pickupSugg, setPickupSugg]           = useState([]);
  const [pickupLoading, setPickupLoading]     = useState(false);

  const [drop, setDrop]                   = useState('');
  const [dropData, setDropData]           = useState({ placeId: '', name: '', address: '', eLoc: '', lat: null, lng: null });
  const [dropSugg, setDropSugg]           = useState([]);
  const [dropLoading, setDropLoading]     = useState(false);
  const [dropSearching, setDropSearching] = useState(false);

  const [flowStep, setFlowStep]           = useState("FORM");
  const [bookingLocked, setBookingLocked] = useState(false);
  const [selectedCar, setSelectedCar]     = useState(null);
  const [priceDetails, setPriceDetails]   = useState(null);
  const [distance, setDistance]           = useState(null);
  const [duration, setDuration]           = useState(null);
  const [error, setError]                 = useState('');
  const [rideId, setRideId]               = useState(null);
  const [distSource, setDistSource]       = useState('');
  const [driverInfo, setDriverInfo]       = useState(null);

  // ── Payment flow state ──────────────────────────────────
  const [invoiceSent, setInvoiceSent]       = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [invoiceError, setInvoiceError]     = useState('');

  // ── User location sharing state ─────────────────────────
  const [userLocation, setUserLocation]           = useState(null);
  const [userLocAddress, setUserLocAddress]       = useState('');
  const [detectingUserLoc, setDetectingUserLoc]   = useState(false);
  const [userLocError, setUserLocError]           = useState('');
  const [userLocConfirmed, setUserLocConfirmed]   = useState(false);
  const [savingUserLoc, setSavingUserLoc]         = useState(false);

  // Manual search state for user location
  const [userLocQuery, setUserLocQuery]           = useState('');
  const [userLocSugg, setUserLocSugg]             = useState([]);
  const [userLocSearching, setUserLocSearching]   = useState(false);
  const userLocSearchTimer                        = useRef(null);

  const pickupInputRef = useRef(null);
  const dropInputRef   = useRef(null);
  const cityInputRef   = useRef(null);
  const pickupTimer    = useRef(null);
  const dropTimer      = useRef(null);

  const searchVoiceTimeoutRef = useRef(null);
  const searchingActiveRef    = useRef(false);
  const searchFailTimeoutRef  = useRef(null);

  // ─── Reverse geocode ─────────────────────────────────────
  const getLocationDetails = useCallback(async (lat, lng) => {
    try {
      const res  = await fetch(`${REVERSE_GEOCODE_API}?lat=${lat}&lng=${lng}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.placeAddress && !data.place) return null;
      const pl = data.place || data;
      return {
        ...pl, success: true,
        address: pl.placeAddress || `${lat.toFixed(5)},${lng.toFixed(5)}`,
        name:    pl.placeName    || pl.cityName || 'Location'
      };
    } catch { return null; }
  }, []);

  const fetchPlaceDetails = useCallback(async (place) => {
    if (!place?.eLoc && !place?.placeAddress) return null;
    try {
      const res  = await fetch(DETAILS_API, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ eLoc: place.eLoc || null, placeAddress: place.placeAddress || place.address || null })
      });
      const data = await res.json();
      if (data.success && data.latitude && data.longitude) {
        const lat = Number(data.latitude);
        const lng = Number(data.longitude);
        if (isValidIndiaCoord(lat, lng)) return { latitude: lat, longitude: lng };
      }
    } catch (e) { console.warn('fetchPlaceDetails failed:', e.message); }
    return null;
  }, []);

  const getAccurateLocation = useCallback((attempt = 1) => new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude, accuracy } }) => {
        if (accuracy <= 2500 || attempt >= 3) resolve({ latitude, longitude });
        else setTimeout(() => getAccurateLocation(attempt + 1).then(resolve).catch(reject), 3000);
      },
      reject,
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }), []);

  // ─── Backend polling ──────────────────────────────────────
  useEffect(() => {
    if (!rideId || flowStep !== "SEARCHING") return;
    let cancelled = false;

    const pollRideStatus = async () => {
      try {
        const data = await apiRequest(`/local-pickups/rides/${rideId}`);
        if (cancelled) return;
        const r = data.ride || {};
        if (r.status === "accepted") {
          setDriverInfo({
            name:          r.driverName     || "Driver",
            phone:         r.driverPhone    || "",
            vehicleType:   r.vehicleType    || r.vehicle?.type || "",
            vehicleNumber: r.vehicleNumber  || "",
            location:      r.driverLocation || null,
            driverId:      r.driverId       || "",
            acceptedAt:    r.acceptedAt     || null,
          });
          searchingActiveRef.current = false;
          clearTimeout(searchVoiceTimeoutRef.current);
          clearTimeout(searchFailTimeoutRef.current);
          if (window.speechSynthesis) window.speechSynthesis.cancel();
          speak("Your driver has been assigned. Please proceed to payment.");
          setFlowStep("PAYMENT");
        }
        if (r.status === "no_driver_found") {
          searchingActiveRef.current = false;
          clearTimeout(searchVoiceTimeoutRef.current);
          clearTimeout(searchFailTimeoutRef.current);
          if (window.speechSynthesis) window.speechSynthesis.cancel();
          speak("Sorry, no drivers are available right now. Please try again.");
          setFlowStep("FORM");
          setError("No driver found nearby.");
        }
      } catch (pollError) {
        if (!cancelled) console.warn("Local pickup polling failed:", pollError.message);
      }
    };

    pollRideStatus();
    const intervalId = setInterval(pollRideStatus, 4000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [rideId, flowStep]);

  const stopSearching = useCallback(async (message) => {
    if (!searchingActiveRef.current) return;
    searchingActiveRef.current = false;
    clearTimeout(searchVoiceTimeoutRef.current);
    clearTimeout(searchFailTimeoutRef.current);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
speak(message, { rate: 0.95 });

    setFlowStep("FORM");
    setError(message);
    try {
      await apiRequest(`/local-pickups/rides/${rideId}`, {
        method: "PATCH",
        body: { status: "no_driver_found", endedAt: new Date().toISOString() },
      });
    } catch (e) { console.warn("Firestore update failed:", e.message); }
  }, [rideId]);

  const startSearchAnnouncements = useCallback(() => {
    searchingActiveRef.current = true;
    const playAnnouncement = () => {
      if (!searchingActiveRef.current) return;
      speak("Searching for a driver for you. Please wait for some time.");
      searchVoiceTimeoutRef.current = setTimeout(playAnnouncement, 2000);
    };
    playAnnouncement();
    searchFailTimeoutRef.current = setTimeout(() => {
      if (!searchingActiveRef.current) return;
      stopSearching("⚠️ No drivers accepted your request. Please try again.");
    }, 3 * 60 * 1000);
  }, [stopSearching]);

  useEffect(() => {
    return () => {
      searchingActiveRef.current = false;
      clearTimeout(searchVoiceTimeoutRef.current);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  // ─── GPS ──────────────────────────────────────────────────
  const detectCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) { setError("Geolocation not supported"); return; }
    setPickupLoading(true); setError('');
    try {
      const { latitude, longitude } = await getAccurateLocation();
      const loc  = await getLocationDetails(latitude, longitude);
      const name = loc?.name    || "Current location";
      const addr = loc?.address || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      const fp   = { placeId: loc?.eLoc || '', name, address: addr, eLoc: loc?.eLoc || '', lat: latitude, lng: longitude };
      setPickup(addr); setPickupData(fp); setPickupConfirmed(true); setPickupSugg([]);
      if (loc) {
        const city = extractCity(loc);
        if (city) setSelectedCity({ placeId: loc.eLoc || '', name: city, address: city + ', India', lat: latitude, lng: longitude });
      }
      setTimeout(() => dropInputRef.current?.focus(), 100);
    } catch { setError("Unable to detect your location."); }
    finally { setPickupLoading(false); }
  }, [getAccurateLocation, getLocationDetails]);

  // ─── User live location detection (for sharing with driver) ─────────
  const detectUserLiveLocation = useCallback(async () => {
    if (!navigator.geolocation) { setUserLocError("Geolocation not supported on this device."); return; }
    setDetectingUserLoc(true); setUserLocError(''); setUserLocation(null); setUserLocAddress('');
    try {
      const { latitude, longitude } = await getAccurateLocation();
      const loc = await getLocationDetails(latitude, longitude);
      const addr = loc?.address || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      setUserLocation({ lat: latitude, lng: longitude, accuracy: null, timestamp: Date.now() });
      setUserLocAddress(addr);
      setUserLocQuery(addr);
      setUserLocConfirmed(true);
    } catch (e) {
      setUserLocError("Could not detect your location. Please allow location access or type your pickup address below.");
    } finally {
      setDetectingUserLoc(false);
    }
  }, [getAccurateLocation, getLocationDetails]);

  // ─── User location manual search ────────────────────────────────────
  const handleUserLocQueryChange = useCallback((val) => {
    setUserLocQuery(val);
    setUserLocConfirmed(false);
    setUserLocation(null);
    if (!val || val.length < 3) { setUserLocSugg([]); return; }
    clearTimeout(userLocSearchTimer.current);
    userLocSearchTimer.current = setTimeout(async () => {
      setUserLocSearching(true);
      try {
        const res  = await fetch(`${SEARCH_API}?q=${encodeURIComponent(val + ' ' + selectedCity.name)}`);
        const data = await res.json();
        setUserLocSugg(data.success ? (data.suggestions || []).slice(0, 6) : []);
      } catch { setUserLocSugg([]); }
      finally { setUserLocSearching(false); }
    }, 350);
  }, [selectedCity.name]);

  const selectUserLocPlace = useCallback(async (place) => {
    setUserLocSearching(true);
    try {
      let lat = parseFloat(place.latitude || place.lat || 0) || null;
      let lng = parseFloat(place.longitude || place.lng || 0) || null;
      if (!isValidIndiaCoord(lat, lng) && place.eLoc) {
        const d = await fetchPlaceDetails({ eLoc: place.eLoc, placeAddress: place.placeAddress });
        if (d) { lat = Number(d.latitude); lng = Number(d.longitude); }
      }
      const addr = place.placeAddress || place.address || place.placeName || place.name || '';
      setUserLocation({ lat, lng, accuracy: null, timestamp: Date.now() });
      setUserLocAddress(addr);
      setUserLocQuery(addr);
      setUserLocSugg([]);
      setUserLocConfirmed(true);
    } catch (e) { setUserLocError("Could not resolve location. Please try another address."); }
    finally { setUserLocSearching(false); }
  }, [fetchPlaceDetails]);

  // ─── Save user location to Firestore ride doc ─────────────────────
  const saveUserLocationAndProceed = useCallback(async () => {
    if (!userLocation || !rideId) return;
    setSavingUserLoc(true); setUserLocError('');
    try {
      await apiRequest(`/local-pickups/rides/${rideId}`, {
        method: 'PATCH',
        body: {
          userLocation: {
            lat:       userLocation.lat,
            lng:       userLocation.lng,
            address:   userLocAddress,
            timestamp: Date.now(),
            sharedAt:  new Date().toISOString(),
          },
          locationShared:     true,
          waitingForLocation: false,
        }
      });
      speak("Your location has been shared with the driver.");
      setFlowStep("LIVE_TRACK");
    } catch (e) {
      setUserLocError("Failed to save your location. Please try again.");
    } finally {
      setSavingUserLoc(false);
    }
  }, [userLocation, userLocAddress, rideId]);

  // ─── Skip location sharing ─────────────────────────────────────────
  const skipLocationSharing = useCallback(async () => {
    if (!rideId) { setFlowStep("LIVE_TRACK"); return; }
    try {
      await apiRequest(`/local-pickups/rides/${rideId}`, {
        method: 'PATCH',
        body: {
          locationShared:     false,
          locationSkipped:    true,
          waitingForLocation: false,
        }
      });
    } catch (e) { console.warn("Skip location update failed:", e.message); }
    setFlowStep("LIVE_TRACK");
  }, [rideId]);

  // ─── City search ──────────────────────────────────────────
  const searchCity = useCallback(async (q) => {
    if (q.length < 2) { setCitySugg([]); return; }
    setLoadingCity(true);
    try {
      const res  = await fetch(`${SEARCH_API}?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setCitySugg(data.success ? data.suggestions || [] : []);
    } catch { setCitySugg([]); }
    finally { setLoadingCity(false); }
  }, []);

  const selectCity = useCallback((place) => {
    const coords = extractCoordinates(place);
    setSelectedCity({
      placeId: place.eLoc || '', name: place.placeName || place.name || '',
      address: place.placeAddress || place.address || '',
      lat: coords.lat || 18.5204, lng: coords.lng || 73.8567
    });
    setShowCitySearch(false); setCityQuery(''); setCitySugg([]);
    setPickup(''); setDrop('');
    setPickupData({ placeId: '', name: '', address: '', eLoc: '', lat: null, lng: null });
    setDropData({ placeId: '', name: '', address: '', eLoc: '', lat: null, lng: null });
    setPickupConfirmed(false); setPickupSugg([]); setDropSugg([]);
    setDistance(null); setDuration(null); setSelectedCar(null);
  }, []);

  const searchWithinCity = useCallback(async (query, cityName) => {
    const q = `${query} ${cityName}`.trim();
    try {
      const res  = await fetch(`${SEARCH_API}?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      return data.success ? (data.suggestions || []).slice(0, 6) : [];
    } catch { return []; }
  }, []);

  const resolveToCoords = useCallback(async (placeData, fallbackCity) => {
    let lat = placeData.lat ? parseFloat(placeData.lat) : null;
    let lng = placeData.lng ? parseFloat(placeData.lng) : null;
    if (isValidIndiaCoord(lat, lng)) return { lat, lng };
    if (placeData.eLoc || placeData.address || placeData.placeAddress) {
      const resolved = await fetchPlaceDetails({
        eLoc: placeData.eLoc || placeData.placeId || null,
        placeAddress: placeData.address || placeData.placeAddress || null
      });
      if (resolved && isValidIndiaCoord(resolved.latitude, resolved.longitude))
        return { lat: resolved.latitude, lng: resolved.longitude };
    }
    if (placeData.name || placeData.address) {
      const results = await searchWithinCity(placeData.name || placeData.address, fallbackCity?.name || 'Pune');
      for (const r of results) {
        const rLat = parseFloat(r.latitude || r.lat || 0);
        const rLng = parseFloat(r.longitude || r.lng || 0);
        if (isValidIndiaCoord(rLat, rLng)) return { lat: rLat, lng: rLng };
        if (r.eLoc) {
          const d = await fetchPlaceDetails({ eLoc: r.eLoc, placeAddress: r.placeAddress });
          if (d && isValidIndiaCoord(d.latitude, d.longitude)) return { lat: d.latitude, lng: d.longitude };
        }
      }
    }
    return { lat: fallbackCity?.lat || 18.5204, lng: fallbackCity?.lng || 73.8567 };
  }, [fetchPlaceDetails, searchWithinCity]);

  // ─── Distance calculation ─────────────────────────────────
  const computeDistance = useCallback(async (pLat, pLng, dLat, dLng) => {
    const hvStraight = haversineKm(pLat, pLng, dLat, dLng);
    const hvRoad     = parseFloat((hvStraight * 1.3).toFixed(2));
    const hvDur      = parseFloat(((hvRoad / 30) * 60).toFixed(1));
    if (!isValidIndiaCoord(pLat, pLng) || !isValidIndiaCoord(dLat, dLng)) {
      setDistSource('hv');
      return { distance: hvRoad, duration: hvDur };
    }
    try {
      const res = await fetch(DISTANCE_API, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ originLat: pLat, originLng: pLng, destinationLat: dLat, destinationLng: dLng })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      if (raw.distanceKm && raw.distanceKm > 0) {
        const distKm = parseFloat(raw.distanceKm);
        const durMin = parseFloat(raw.durationMin || hvDur);
        if (distKm <= hvStraight * 4 && distKm >= hvStraight * 0.5) {
          setDistSource('api');
          return { distance: parseFloat(distKm.toFixed(2)), duration: parseFloat(durMin.toFixed(1)) };
        }
      }
    } catch (e) { console.warn('[Distance] API error:', e.message); }
    setDistSource('hv');
    return { distance: hvRoad, duration: hvDur };
  }, []);

  // ─── Pickup handlers ──────────────────────────────────────
  const handlePickupChange = useCallback((val) => {
    setPickup(val);
    setPickupConfirmed(false);
    if (!val) { setPickupData({ placeId: '', name: '', address: '', eLoc: '', lat: null, lng: null }); setPickupSugg([]); setSelectedCar(null); return; }
    if (val.length < 3) return;
    clearTimeout(pickupTimer.current);
    pickupTimer.current = setTimeout(async () => {
      setPickupLoading(true);
      try { setPickupSugg(await searchWithinCity(val, selectedCity.name)); }
      catch { setPickupSugg([]); }
      finally { setPickupLoading(false); }
    }, 350);
  }, [selectedCity.name, searchWithinCity]);

  const selectPickupPlace = useCallback(async (place) => {
    setPickupLoading(true);
    try {
      let lat = parseFloat(place.lat || place.latitude || 0) || null;
      let lng = parseFloat(place.lng || place.longitude || 0) || null;
      if (!isValidIndiaCoord(lat, lng) && place.eLoc) {
        const d = await fetchPlaceDetails({ eLoc: place.eLoc, placeAddress: place.placeAddress });
        if (d) { lat = Number(d.latitude); lng = Number(d.longitude); }
      }
      const p = { placeId: place.eLoc || '', name: place.placeName || place.name || '', address: place.placeAddress || place.address || '', eLoc: place.eLoc || null, lat, lng };
      setPickup(p.address || p.name);
      setPickupData(p);
      setPickupConfirmed(true);
      setPickupSugg([]);
      setTimeout(() => dropInputRef.current?.focus(), 50);
    } finally { setPickupLoading(false); }
  }, [fetchPlaceDetails]);

  // ─── Drop handlers ────────────────────────────────────────
  const handleDropChange = useCallback((val) => {
    setDrop(val);
    if (!val) { setDropData({ placeId: '', name: '', address: '', eLoc: '', lat: null, lng: null }); setDropSugg([]); setSelectedCar(null); setDistance(null); setDuration(null); return; }
    if (val.length < 3) return;
    clearTimeout(dropTimer.current);
    dropTimer.current = setTimeout(async () => {
      setDropLoading(true);
      try { setDropSugg(await searchWithinCity(val, selectedCity.name)); }
      catch { setDropSugg([]); }
      finally { setDropLoading(false); }
    }, 350);
  }, [selectedCity.name, searchWithinCity]);

  const selectDropPlace = useCallback(async (place) => {
    setDropSearching(true);
    try {
      let lat = Number(place.latitude || place.lat || 0) || null;
      let lng = Number(place.longitude || place.lng || 0) || null;
      if (!isValidIndiaCoord(lat, lng) && place.eLoc) {
        const d = await fetchPlaceDetails({ eLoc: place.eLoc, placeAddress: place.placeAddress });
        if (d) { lat = Number(d.latitude); lng = Number(d.longitude); }
      }
      if (!isValidIndiaCoord(lat, lng)) { lat = Number(selectedCity.lat); lng = Number(selectedCity.lng); }
      const dp = { placeId: place.eLoc || '', name: place.placeName || place.name, address: place.placeAddress || place.address, eLoc: place.eLoc || null, lat, lng };
      setDrop(dp.address || dp.name);
      setDropData(dp);
      setDropSugg([]);
      setSelectedCar(null);
      let pLat = pickupData.lat, pLng = pickupData.lng;
      if (!isValidIndiaCoord(pLat, pLng)) {
        const resolved = await resolveToCoords(pickupData, selectedCity);
        pLat = resolved.lat; pLng = resolved.lng;
        setPickupData(prev => ({ ...prev, lat: pLat, lng: pLng }));
      }
      if (isValidIndiaCoord(pLat, pLng) && isValidIndiaCoord(lat, lng)) {
        const { distance: d, duration: dur } = await computeDistance(pLat, pLng, lat, lng);
        setDistance(d); setDuration(dur);
      }
    } catch (e) { console.error('selectDropPlace error:', e); setError(e.message); }
    finally { setDropSearching(false); }
  }, [fetchPlaceDetails, selectedCity, pickupData, computeDistance, resolveToCoords]);

  // ─── Price ────────────────────────────────────────────────
  const calcPrice = useCallback((km, car) => {
    const base = km * 12;
    const gst  = (base * 5) / 100;
    return {
      distance: km.toFixed(2), subtotal: Math.round(base),
      gstPercentage: 5, gstAmount: Math.round(gst),
      totalFare: Math.round(base + gst),
      perKmRate: 12,
      duration: duration ? `${Math.round(duration)} min` : 'N/A',
      carName: car?.name || car?.category
    };
  }, [duration]);

  // ─── Submit ───────────────────────────────────────────────
  const handleSubmit = async () => {
    if (bookingLocked) return;
    setBookingLocked(true); setFlowStep("CALCULATING"); setError('');
    try {
      if (!pickup)      throw new Error('Please enter a pickup location');
      if (!drop)        throw new Error('Please enter a drop location');
      if (!selectedCar) throw new Error('Please select a vehicle');
      let pData = { ...pickupData };
      let dData = { ...dropData };
      if (!isValidIndiaCoord(pData.lat, pData.lng)) {
        const resolved = await resolveToCoords({ ...pData, name: pData.name || pickup, address: pData.address || pickup }, selectedCity);
        pData = { ...pData, lat: resolved.lat, lng: resolved.lng };
        setPickupData(pData); setPickupConfirmed(true);
      }
      if (!isValidIndiaCoord(dData.lat, dData.lng)) {
        const resolved = await resolveToCoords({ ...dData, name: dData.name || drop, address: dData.address || drop }, selectedCity);
        dData = { ...dData, lat: resolved.lat, lng: resolved.lng };
        setDropData(dData);
      }
      if (!pData.name) pData = { ...pData, name: pickup, address: pickup + ', ' + selectedCity.name };
      if (!dData.name) dData = { ...dData, name: drop,   address: drop   + ', ' + selectedCity.name };
      const { distance: d, duration: dur } = await computeDistance(pData.lat, pData.lng, dData.lat, dData.lng);
      setDistance(d); setDuration(dur);
      const pricing = calcPrice(d, selectedCar);
      setPriceDetails({
        ...pricing,
        pickup:  { name: pData.name, address: pData.address, lat: pData.lat, lng: pData.lng, eLoc: pData.eLoc },
        dropoff: { name: dData.name, address: dData.address, lat: dData.lat, lng: dData.lng, eLoc: dData.eLoc },
        city: selectedCity.name, distance: d, duration: dur,
        car: selectedCar, timestamp: new Date().toISOString()
      });
      setFlowStep("SUMMARY");
    } catch (e) {
      console.error('handleSubmit error:', e);
      setError(e.message); setFlowStep("FORM");
    } finally {
      setBookingLocked(false);
    }
  };

  // ─── Confirm & create ride ────────────────────────────────
  const confirmAndCreateRide = async () => {
    try {
      setFlowStep("SAVING");
      if (!priceDetails) throw new Error("Pricing details missing");
      const p = priceDetails.pickup;
      const d = priceDetails.dropoff;
      if (typeof p?.lat !== "number" || typeof p?.lng !== "number" || typeof d?.lat !== "number" || typeof d?.lng !== "number")
        throw new Error("Invalid pickup or drop coordinates");
      const currentUser = auth.currentUser;
      if (!currentUser?.uid) { alert("You must login to book a ride"); return; }
      const payload = {
        userId:   currentUser.uid,
        userName: currentUser.displayName || currentUser.email || "User",
        userPhone: currentUser.phoneNumber || "",
        userEmail: currentUser.email || "",
        pickupLocation:  { name: p.name, address: p.address, latitude: p.lat,  longitude: p.lng  },
        dropoffLocation: { name: d.name, address: d.address, latitude: d.lat,  longitude: d.lng  },
        distance:   priceDetails.distance,
        duration:   priceDetails.duration,
        totalFare:  priceDetails.totalFare,
        isScheduled: false
      };
      const data = await apiRequest('/local-pickups/rides', {
        method: 'POST',
        body: payload,
      });
      if (!data.success) throw new Error(data.error || "Failed to create ride");
      setRideId(data.rideId);
      setFlowStep("SEARCHING");
      startSearchAnnouncements();
    } catch (err) {
      console.error("confirmAndCreateRide error:", err);
      setError(err.message); setFlowStep("FORM");
    }
  };

  // ─── Send Invoice ─────────────────────────────────────────
  const sendInvoice = async () => {
    const currentUser = auth.currentUser;
    const email = currentUser?.email;
    if (!email) { setInvoiceError("No email found. Please login with email."); return; }
    setSendingInvoice(true); setInvoiceError('');
    try {
      const data = await apiRequest(`/local-pickups/rides/${rideId}/invoice`, {
        method: 'POST',
        body: {
          to:           email,
          customerName: currentUser.displayName || currentUser.email || "Guest",
          vehicleType:  priceDetails?.car?.name || priceDetails?.carName || "Car",
          pickup:       priceDetails?.pickup?.address  || priceDetails?.pickup?.name  || "",
          drop:         priceDetails?.dropoff?.address || priceDetails?.dropoff?.name || "",
          city:         selectedCity.name,
          distance:     priceDetails?.distance || 0,
          duration:     typeof priceDetails?.duration === 'number' ? Math.round(priceDetails.duration) : 0,
          driverName:   driverInfo?.name  || "",
          driverPhone:  driverInfo?.phone || "",
        }
      });
      if (!data.success) throw new Error(data.error || "Failed to send invoice");
      setInvoiceSent(true);
      speak("Invoice sent to your email. Have a safe journey!");
    } catch (e) {
      setInvoiceError(e.message);
    } finally {
      setSendingInvoice(false);
    }
  };

  const trustPoints = useMemo(() => [
    { icon: '🛡️', title: 'Verified Drivers',   desc: 'All drivers are background-verified' },
    { icon: '💰', title: 'Transparent Pricing', desc: 'No hidden charges ever' },
    { icon: '🕐', title: '24/7 Support',        desc: 'Always available to help' },
    { icon: '🚗', title: 'Safe Rides',          desc: 'Well-maintained vehicles' },
  ], []);

  const isApp          = Capacitor.isNativePlatform();
  const canSubmit      = !!pickup && !!drop && !!selectedCar && flowStep === "FORM" && !bookingLocked;
  const showCarSection = !!pickup && !!drop && drop.length > 2;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;}
        body{margin:0;font-family:'DM Sans',sans-serif;}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.5;}}
        @keyframes ripple{0%{transform:scale(1);opacity:1;}100%{transform:scale(2.2);opacity:0;}}
        @keyframes locPulse{0%,100%{box-shadow:0 0 0 0 rgba(48,43,99,.35);}50%{box-shadow:0 0 0 12px rgba(48,43,99,0);}}

        .lp-wrapper{min-height:100vh;background:linear-gradient(135deg,#0f0c29,#302b63,#24243e);display:flex;align-items:flex-start;justify-content:center;padding:5rem 1.5rem 3rem;}
        .lp-inner{width:100%;max-width:1160px;display:grid;grid-template-columns:1fr 380px;gap:2rem;animation:fadeUp .5s ease both;}
        @media(max-width:860px){.lp-inner{grid-template-columns:1fr;}}

        .lp-card{background:#fff;border-radius:20px;padding:2.25rem;box-shadow:0 24px 64px rgba(0,0,0,.28);}
        .lp-title{font-family:'DM Serif Display',serif;font-size:2.2rem;color:#1a1a2e;margin:0 0 1.5rem;line-height:1.15;}

        .city-row{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-bottom:1.5rem;position:relative;z-index:10;}
        .city-badge{display:flex;align-items:center;gap:.4rem;background:#f0f0ff;border-radius:999px;padding:.35rem .85rem;font-weight:600;color:#302b63;font-size:.95rem;}
        .city-btn{background:none;border:none;color:#f4511e;cursor:pointer;font-size:.88rem;font-weight:600;text-decoration:underline;padding:0;}
        .city-box{position:absolute;top:calc(100% + 8px);left:0;right:0;background:#fff;border:1.5px solid #ddd;border-radius:14px;padding:1rem;box-shadow:0 8px 32px rgba(0,0,0,.12);z-index:400;}
        .city-inp{width:100%;padding:.7rem 1rem;border:1.5px solid #ddd;border-radius:10px;font-size:.95rem;font-family:'DM Sans',sans-serif;outline:none;}
        .city-inp:focus{border-color:#302b63;}

        .chips-row{display:flex;gap:.5rem;margin-bottom:1.25rem;flex-wrap:wrap;}
        .chip{background:#fafafa;border:1.5px solid #eee;border-radius:999px;padding:.4rem 1rem;font-size:.85rem;color:#555;font-weight:500;}

        .gps-btn{display:flex;align-items:center;justify-content:center;gap:.5rem;width:100%;background:none;border:1.5px dashed #a0a0d0;border-radius:12px;padding:.7rem 1rem;cursor:pointer;font-weight:600;font-size:.9rem;color:#302b63;font-family:'DM Sans',sans-serif;margin-bottom:1rem;transition:background .2s,border-color .2s;}
        .gps-btn:hover{background:#f0f0ff;border-color:#302b63;}
        .gps-btn:disabled{opacity:.5;cursor:not-allowed;}

        .route-box{background:#f8f8fc;border:1.5px solid #e4e4f0;border-radius:16px;margin-bottom:1rem;position:relative;overflow:visible;}
        .route-dot{position:absolute;left:1.55rem;top:3.2rem;bottom:3.2rem;width:2px;background:repeating-linear-gradient(to bottom,#ccc 0,#ccc 4px,transparent 4px,transparent 8px);pointer-events:none;z-index:0;}
        .route-divider{height:1px;background:#e4e4f0;}

        .city-scope-hint{display:inline-flex;align-items:center;gap:.3rem;background:#f0f0ff;color:#302b63;font-size:.72rem;font-weight:600;padding:3px 10px;border-radius:999px;margin-bottom:.6rem;}
        .dist-badge{display:inline-flex;align-items:center;gap:.4rem;background:#fff8f0;border:1.5px solid #f4511e33;color:#c84a1a;font-size:.8rem;font-weight:700;padding:4px 12px;border-radius:999px;margin-bottom:.75rem;}

        .submit-btn{width:100%;padding:1rem;border-radius:14px;font-weight:700;font-size:1rem;border:none;cursor:pointer;margin-top:1.25rem;transition:transform .15s,box-shadow .15s;font-family:'DM Sans',sans-serif;}
        .submit-on{background:linear-gradient(135deg,#f4511e,#ff8c42);color:#fff;box-shadow:0 6px 20px rgba(244,81,30,.35);}
        .submit-on:hover{transform:translateY(-1px);box-shadow:0 10px 28px rgba(244,81,30,.45);}
        .submit-off{background:#eee;color:#aaa;cursor:not-allowed;}
        .calc-bar{display:flex;align-items:center;gap:.75rem;background:#f7f7ff;border-radius:12px;padding:.9rem 1.2rem;margin-top:1rem;animation:pulse 1.5s ease-in-out infinite;color:#302b63;font-weight:600;font-size:.95rem;}

        .rp-card{background:linear-gradient(160deg,#1a1a2e,#16213e);border-radius:20px;padding:2rem;box-shadow:0 24px 64px rgba(0,0,0,.28);color:#fff;display:flex;flex-direction:column;}
        .rp-title{font-family:'DM Serif Display',serif;font-size:1.5rem;color:#f4511e;margin:0 0 1.75rem;}
        .trust-item{display:flex;align-items:flex-start;gap:1rem;margin-bottom:1.5rem;}
        .trust-icon{font-size:1.4rem;width:40px;height:40px;background:rgba(244,81,30,.15);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .trust-name{font-weight:700;font-size:.95rem;margin-bottom:2px;}
        .trust-desc{font-size:.82rem;color:rgba(255,255,255,.55);line-height:1.4;}

        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;z-index:500;padding:1.5rem;animation:fadeUp .25s ease both;}
        .modal-card{background:#fff;border-radius:20px;padding:2rem;max-width:480px;width:100%;position:relative;box-shadow:0 24px 64px rgba(0,0,0,.3);max-height:90vh;overflow-y:auto;}
        .modal-close{position:absolute;top:1.1rem;right:1.1rem;background:none;border:none;font-size:1.3rem;cursor:pointer;color:#888;}
        .modal-title{font-family:'DM Serif Display',serif;font-size:1.5rem;color:#1a1a2e;margin:0 0 1.25rem;}
        .price-row{display:flex;justify-content:space-between;padding:.65rem 0;border-bottom:1px solid #f0f0f0;font-size:.93rem;color:#444;}
        .price-row span:last-child{font-weight:600;color:#1a1a2e;}
        .price-total{display:flex;justify-content:space-between;padding:.9rem 0 0;margin-top:.5rem;font-size:1.1rem;font-weight:700;color:#1a1a2e;}

        .searching-overlay{position:fixed;inset:0;background:linear-gradient(135deg,#0f0c29cc,#302b63cc);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:600;color:#fff;gap:1.25rem;}
        .searching-spinner{width:56px;height:56px;border:4px solid rgba(255,255,255,.2);border-top-color:#f4511e;border-radius:50%;animation:spin .9s linear infinite;}
        .searching-text{font-family:'DM Serif Display',serif;font-size:1.5rem;text-align:center;}
        .searching-sub{font-size:.9rem;opacity:.6;}

        .error-snack{position:fixed;bottom:calc(80px + env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%);background:#d32f2f;color:#fff;padding:.9rem 2rem;border-radius:10px;z-index:700;font-weight:600;font-size:.9rem;box-shadow:0 4px 20px rgba(0,0,0,.25);animation:fadeUp .3s ease both;display:flex;align-items:center;gap:.75rem;}
        .error-dismiss{background:none;border:none;color:#fff;cursor:pointer;font-size:1rem;opacity:.7;padding:0;line-height:1;}

        /* ── Payment modal styles ── */
        .pay-modal{background:#fff;border-radius:20px;padding:2rem;max-width:520px;width:100%;position:relative;box-shadow:0 24px 64px rgba(0,0,0,.3);max-height:92vh;overflow-y:auto;}
        .pay-title{font-family:'DM Serif Display',serif;font-size:1.6rem;color:#302b63;margin:0 0 .25rem;}
        .pay-subtitle{font-size:.88rem;color:#888;margin:0 0 1.5rem;}
        .qr-wrap{display:flex;flex-direction:column;align-items:center;background:linear-gradient(135deg,#f0f4ff,#fff);border:2px solid #d0d8ff;border-radius:16px;padding:1.25rem;margin-bottom:1.25rem;}
        .qr-img{width:200px;height:200px;object-fit:contain;border-radius:10px;box-shadow:0 4px 16px rgba(48,43,99,.18);}
        .qr-hint{font-size:.78rem;color:#888;margin-top:.6rem;text-align:center;}
        .pay-details{background:#f8f8fc;border-radius:12px;padding:1rem 1.25rem;margin-bottom:1.25rem;}
        .pay-detail-row{display:flex;justify-content:space-between;padding:.45rem 0;border-bottom:1px solid #eee;font-size:.9rem;color:#444;}
        .pay-detail-row:last-child{border-bottom:none;}
        .pay-detail-row span:last-child{font-weight:700;color:#1a1a2e;}
        .pay-total-row{display:flex;justify-content:space-between;padding:.75rem 0 0;font-size:1.1rem;font-weight:700;}
        .pay-btn-primary{width:100%;padding:1rem;border-radius:14px;font-weight:700;font-size:1rem;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;background:linear-gradient(135deg,#302b63,#4a3fa0);color:#fff;box-shadow:0 6px 20px rgba(48,43,99,.3);transition:transform .15s,box-shadow .15s;margin-bottom:.75rem;}
        .pay-btn-primary:hover{transform:translateY(-1px);box-shadow:0 10px 28px rgba(48,43,99,.4);}
        .pay-btn-primary:disabled{opacity:.6;cursor:not-allowed;transform:none;}
        .pay-btn-green{width:100%;padding:1rem;border-radius:14px;font-weight:700;font-size:1rem;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;background:linear-gradient(135deg,#1b5e20,#2e7d32);color:#fff;box-shadow:0 6px 20px rgba(30,100,30,.3);transition:transform .15s;margin-bottom:.75rem;}
        .pay-btn-green:hover{transform:translateY(-1px);}
        .invoice-success{display:flex;align-items:center;gap:.6rem;background:#e8f5e9;border:1.5px solid #a5d6a7;border-radius:10px;padding:.75rem 1rem;font-size:.88rem;color:#2e7d32;font-weight:600;margin-bottom:.75rem;}
        .track-btn{width:100%;padding:1rem;border-radius:14px;font-weight:700;font-size:1rem;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;background:linear-gradient(135deg,#f4511e,#ff8c42);color:#fff;box-shadow:0 6px 20px rgba(244,81,30,.35);transition:transform .15s;}
        .track-btn:hover{transform:translateY(-1px);}

        /* ── Share Location Modal ── */
        .loc-modal{background:#fff;border-radius:24px;padding:2rem;max-width:500px;width:100%;position:relative;box-shadow:0 32px 80px rgba(0,0,0,.35);max-height:92vh;overflow-y:auto;animation:fadeUp .3s ease both;}
        .loc-hero{display:flex;flex-direction:column;align-items:center;text-align:center;padding:1.5rem 0 1.75rem;}
        .loc-icon-ring{width:80px;height:80px;background:linear-gradient(135deg,#302b63,#4a3fa0);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2rem;margin-bottom:1rem;animation:locPulse 2s ease-in-out infinite;}
        .loc-hero-title{font-family:'DM Serif Display',serif;font-size:1.6rem;color:#1a1a2e;margin:0 0 .4rem;}
        .loc-hero-sub{font-size:.88rem;color:#777;line-height:1.55;max-width:340px;}
        .loc-gps-btn{display:flex;align-items:center;justify-content:center;gap:.6rem;width:100%;background:linear-gradient(135deg,#302b63,#4a3fa0);color:#fff;border:none;border-radius:14px;padding:1rem;font-weight:700;font-size:.97rem;cursor:pointer;font-family:'DM Sans',sans-serif;box-shadow:0 6px 20px rgba(48,43,99,.3);transition:transform .15s,box-shadow .15s;margin-bottom:1rem;}
        .loc-gps-btn:hover{transform:translateY(-1px);box-shadow:0 10px 28px rgba(48,43,99,.4);}
        .loc-gps-btn:disabled{opacity:.6;cursor:not-allowed;transform:none;}
        .loc-divider{display:flex;align-items:center;gap:.75rem;margin:.25rem 0 1rem;color:#bbb;font-size:.82rem;}
        .loc-divider::before,.loc-divider::after{content:'';flex:1;height:1px;background:#eee;}
        .loc-search-wrap{position:relative;margin-bottom:.75rem;}
        .loc-search-input{width:100%;padding:.85rem 1rem .85rem 2.75rem;border:1.5px solid #e0e0f0;border-radius:12px;font-size:.93rem;font-family:'DM Sans',sans-serif;color:#1a1a2e;outline:none;background:#f8f8fc;transition:border-color .2s;}
        .loc-search-input:focus{border-color:#302b63;background:#fff;}
        .loc-search-icon{position:absolute;left:.85rem;top:50%;transform:translateY(-50%);font-size:1rem;pointer-events:none;}
        .loc-sugg-list{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1.5px solid #e0e0f0;border-radius:14px;max-height:220px;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,.12);z-index:600;}
        .loc-sugg-item{padding:.7rem 1rem;cursor:pointer;border-bottom:1px solid #f5f5f5;font-size:.9rem;}
        .loc-sugg-item:last-child{border-bottom:none;}
        .loc-sugg-item:hover{background:#f5f5ff;}
        .loc-sugg-name{font-weight:600;color:#1a1a2e;font-size:.9rem;}
        .loc-sugg-addr{font-size:.78rem;color:#888;margin-top:2px;}
        .loc-confirmed{display:flex;align-items:flex-start;gap:.75rem;background:linear-gradient(135deg,#f0fdf4,#e8f5e9);border:2px solid #86efac;border-radius:14px;padding:1rem 1.25rem;margin-bottom:1rem;}
        .loc-confirmed-icon{font-size:1.4rem;flex-shrink:0;margin-top:2px;}
        .loc-confirmed-text{flex:1;}
        .loc-confirmed-label{font-weight:700;color:#1b5e20;font-size:.88rem;margin-bottom:3px;}
        .loc-confirmed-addr{font-size:.84rem;color:#2e7d32;line-height:1.4;}
        .loc-proceed-btn{width:100%;padding:1rem;border-radius:14px;font-weight:700;font-size:1rem;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;background:linear-gradient(135deg,#f4511e,#ff8c42);color:#fff;box-shadow:0 6px 20px rgba(244,81,30,.35);transition:transform .15s;margin-bottom:.75rem;}
        .loc-proceed-btn:hover{transform:translateY(-1px);}
        .loc-proceed-btn:disabled{opacity:.6;cursor:not-allowed;transform:none;}
        .loc-skip-btn{width:100%;padding:.75rem;border-radius:12px;font-weight:600;font-size:.9rem;border:1.5px solid #eee;cursor:pointer;font-family:'DM Sans',sans-serif;background:#fff;color:#999;transition:background .2s,color .2s;}
        .loc-skip-btn:hover{background:#f5f5f5;color:#555;}
        .loc-err{background:#fef2f2;border:1.5px solid #fca5a5;border-radius:10px;padding:.7rem 1rem;font-size:.85rem;color:#b91c1c;font-weight:600;margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem;}
        .loc-driver-hint{background:linear-gradient(135deg,#fffbeb,#fff7ed);border:1.5px solid #fcd34d;border-radius:12px;padding:.85rem 1rem;margin-bottom:1.25rem;font-size:.84rem;color:#92400e;display:flex;align-items:center;gap:.6rem;line-height:1.45;}

        /* ── APP OVERRIDES ── */
        .app-wrapper{min-height:100vh;background:#f5f5f5;padding:0;padding-top:calc(60px + env(safe-area-inset-top,0px));padding-bottom:80px;display:flex;flex-direction:column;}
        .app-form-card{background:#fff;border-radius:0;padding:1.25rem 1rem;box-shadow:none;border-bottom:1px solid #eee;flex:1;}
        .app-title{font-size:1.2rem;font-weight:700;color:#1a1a2e;margin:0 0 1rem;}
        .app-section-label{font-size:.75rem;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin:1rem 0 .5rem;}
        .app-quick-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:.75rem;margin-bottom:1.25rem;}
        .app-quick-btn{display:flex;align-items:center;gap:.75rem;background:#f8f8fc;border:1.5px solid #eee;border-radius:14px;padding:.85rem 1rem;cursor:pointer;font-family:'DM Sans',sans-serif;transition:background .15s;}
        .app-quick-btn:active{background:#f0f0ff;}
        .app-quick-icon{font-size:1.4rem;width:40px;height:40px;background:#fff;border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.08);flex-shrink:0;}
        .app-quick-label{font-size:.85rem;font-weight:700;color:#1a1a2e;line-height:1.2;}
        .app-quick-sub{font-size:.72rem;color:#888;margin-top:1px;}
        .app-route-card{background:#fff;border-radius:16px;border:1.5px solid #eee;margin-bottom:1rem;overflow:visible;position:relative;}
        .app-route-dot{position:absolute;left:2.1rem;top:3.5rem;bottom:3.5rem;width:2px;background:repeating-linear-gradient(to bottom,#ccc 0,#ccc 4px,transparent 4px,transparent 8px);pointer-events:none;z-index:0;}
        .app-gps-btn{display:flex;align-items:center;justify-content:center;gap:.5rem;width:100%;background:none;border:1.5px dashed #a0a0d0;border-radius:12px;padding:.65rem 1rem;cursor:pointer;font-weight:600;font-size:.85rem;color:#302b63;font-family:'DM Sans',sans-serif;margin-bottom:.75rem;transition:background .2s;}
        .app-gps-btn:active{background:#f0f0ff;}
        .app-submit-btn{width:100%;padding:.95rem;border-radius:14px;font-weight:700;font-size:.97rem;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;margin-top:1rem;}
        .app-dist-badge{display:inline-flex;align-items:center;gap:.4rem;background:#fff8f0;border:1.5px solid #f4511e33;color:#c84a1a;font-size:.78rem;font-weight:700;padding:3px 10px;border-radius:999px;margin-bottom:.75rem;}
        .app-city-row{display:flex;align-items:center;gap:.5rem;margin-bottom:1rem;flex-wrap:wrap;position:relative;z-index:10;}
        .app-city-badge{display:flex;align-items:center;gap:.4rem;background:#f0f0ff;border-radius:999px;padding:.3rem .75rem;font-weight:600;color:#302b63;font-size:.85rem;}
        .app-city-btn{background:none;border:none;color:#f4511e;cursor:pointer;font-size:.82rem;font-weight:600;text-decoration:underline;padding:0;}
      `}</style>

      {/* ── Searching / Saving overlay ── */}
      {(flowStep === "SEARCHING" || flowStep === "SAVING") && (
        <div className="searching-overlay">
          <div className="searching-spinner" />
          <div className="searching-text">
            {flowStep === "SAVING" ? "Saving booking…" : "Finding your driver…"}
          </div>
          <div className="searching-sub">Please wait, this may take a moment</div>
          {flowStep === "SEARCHING" && (
            <button
              onClick={() => stopSearching("Ride cancelled by user.")}
              style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.4)', color: '#fff', padding: '0.7rem 2rem', borderRadius: '999px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
            >
              ✕ Cancel Search
            </button>
          )}
        </div>
      )}
      {isApp ? (
        /* ═══════════════════════════════
           APP LAYOUT — Uber/Ola style
           ═══════════════════════════════ */
        <div className="app-wrapper">
          <div className="app-form-card">
            <h2 className="app-title">Book a Ride</h2>

            {/* City selector */}
            <div className="app-city-row">
              <div className="app-city-badge"><span>📍</span><span>{selectedCity.name}</span></div>
              <button className="app-city-btn" onClick={() => setShowCitySearch(v => !v)}>
                {showCitySearch ? "Cancel" : "Change"}
              </button>
              {showCitySearch && (
                <div className="city-box">
                  <input ref={cityInputRef} type="text" placeholder="Type city name…" value={cityQuery}
                    onChange={e => { setCityQuery(e.target.value); searchCity(e.target.value); }}
                    className="city-inp" autoFocus />
                  {loadingCity && <div style={{ textAlign: 'center', padding: '.75rem' }}><div style={{ width: 20, height: 20, border: '2px solid #eee', borderTopColor: '#302b63', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto' }} /></div>}
                  {citySugg.length > 0 && (
                    <div style={{ marginTop: '.5rem', maxHeight: 220, overflowY: 'auto' }}>
                      {citySugg.map((c, i) => (
                        <div key={i} style={{ padding: '.7rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f5f5f5' }}
                          onClick={() => selectCity(c)}
                          onMouseEnter={e => e.currentTarget.style.background = '#f5f5ff'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}>
                          <div style={{ fontWeight: 600, fontSize: '.92rem', color: '#1a1a2e' }}>{c.placeName || c.name}</div>
                          {c.placeAddress && <div style={{ fontSize: '.8rem', color: '#888' }}>{c.placeAddress}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick action tiles */}
            <div className="app-section-label">What do you need?</div>
            <div className="app-quick-actions">
              {[
                { label: 'Pickup Now',  sub: 'Instant ride',       icon: '🚖', action: () => pickupInputRef.current?.focus() },
                { label: 'Airport',     sub: 'Terminal drop/pick',  icon: '✈️', action: () => pickupInputRef.current?.focus() },
                { label: 'Outstation',  sub: 'Intercity travel',    icon: '🛣️', action: () => pickupInputRef.current?.focus() },
                { label: 'Round Trip',  sub: 'Go & return',         icon: '🔄', action: () => pickupInputRef.current?.focus() },
              ].map((a) => (
                <button key={a.label} className="app-quick-btn" onClick={a.action}>
                  <div className="app-quick-icon">{a.icon}</div>
                  <div>
                    <div className="app-quick-label">{a.label}</div>
                    <div className="app-quick-sub">{a.sub}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* GPS button */}
            <button className="app-gps-btn" onClick={detectCurrentLocation} disabled={pickupLoading}>
              {pickupLoading
                ? <><div style={{ width: 13, height: 13, border: '2px solid #ccc', borderTopColor: '#302b63', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />Detecting…</>
                : <>🎯 Use my current location</>}
            </button>

            {/* Route input box */}
            <div className="app-section-label">Enter route</div>
            <div className="app-route-card">
              <div className="app-route-dot" />
              <LocationInput
                icon="🟢" placeholder={`Pickup in ${selectedCity.name}…`}
                value={pickup} onChange={handlePickupChange}
                onSelectGPS={detectCurrentLocation}
                suggestions={pickupSugg} loading={pickupLoading}
                confirmed={pickupConfirmed} disabled={pickupLoading}
                inputRef={pickupInputRef} onSelect={selectPickupPlace}
                onClear={() => { setPickup(''); setPickupSugg([]); setPickupConfirmed(false); setSelectedCar(null); setPickupData({ placeId: '', name: '', address: '', eLoc: '', lat: null, lng: null }); }}
              />
              <div className="route-divider" />
              <LocationInput
                icon="🔴" placeholder={`Drop-off in ${selectedCity.name}…`}
                value={drop} onChange={handleDropChange}
                onSelectGPS={null}
                suggestions={dropSugg} loading={dropLoading || dropSearching}
                confirmed={false} disabled={false}
                inputRef={dropInputRef} onSelect={selectDropPlace}
                onClear={() => { setDrop(''); setDropSugg([]); setSelectedCar(null); setDistance(null); setDuration(null); setDropData({ placeId: '', name: '', address: '', eLoc: '', lat: null, lng: null }); }}
              />
            </div>

            {/* Distance badge */}
            {distance && duration && (
              <div className="app-dist-badge">
                📏 {distance.toFixed(2)} km · ⏱ {Math.round(duration)} min
                {distSource === 'hv' && <span style={{ opacity: 0.6, fontWeight: 400 }}> (est.)</span>}
              </div>
            )}

            {/* Car selection — reuse existing component */}
            {showCarSection && (
              <CarSelection distance={distance} duration={duration} selectedCar={selectedCar} onCarSelect={setSelectedCar} />
            )}

            {/* Submit */}
            {flowStep === "CALCULATING" ? (
              <div className="calc-bar">
                <div style={{ width: 18, height: 18, border: '2px solid rgba(48,43,99,.2)', borderTopColor: '#302b63', borderRadius: '50%', animation: 'spin .8s linear infinite', flexShrink: 0 }} />
                Calculating route…
              </div>
            ) : (
              <button className={`app-submit-btn ${canSubmit ? 'submit-on' : 'submit-off'}`} onClick={handleSubmit} disabled={!canSubmit}>
                {!pickup ? 'Enter pickup location' : !drop ? 'Enter drop location' : !selectedCar ? 'Select a vehicle' : '🚗 Confirm Booking'}
              </button>
            )}

            {/* Pricing note */}
            <div style={{ textAlign: 'center', fontSize: '.72rem', color: '#aaa', marginTop: '.75rem', paddingBottom: '1rem' }}>
              ₹12/km · 5% GST · No hidden charges
            </div>
          </div>
        </div>

      ) : (
      
      <div className="lp-wrapper">
        <div className="lp-inner">
          <div className="lp-card">
            <h2 className="lp-title">Request a ride</h2>

            {/* CITY */}
            <div className="city-row">
              <div className="city-badge"><span>📍</span><span>{selectedCity.name}, IN</span></div>
              <button className="city-btn" onClick={() => setShowCitySearch(v => !v)}>
                {showCitySearch ? "Cancel" : "Change city"}
              </button>
              {showCitySearch && (
                <div className="city-box">
                  <input ref={cityInputRef} type="text" placeholder="Type city name…" value={cityQuery}
                    onChange={e => { setCityQuery(e.target.value); searchCity(e.target.value); }}
                    className="city-inp" autoFocus />
                  {loadingCity && <div style={{ textAlign: 'center', padding: '.75rem' }}><div style={{ width: 20, height: 20, border: '2px solid #eee', borderTopColor: '#302b63', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto' }} /></div>}
                  {citySugg.length > 0 && (
                    <div style={{ marginTop: '.5rem', maxHeight: 220, overflowY: 'auto' }}>
                      {citySugg.map((c, i) => (
                        <div key={i} style={{ padding: '.7rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f5f5f5' }}
                          onClick={() => selectCity(c)}
                          onMouseEnter={e => e.currentTarget.style.background = '#f5f5ff'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}>
                          <div style={{ fontWeight: 600, fontSize: '.92rem', color: '#1a1a2e' }}>{c.placeName || c.name}</div>
                          {c.placeAddress && <div style={{ fontSize: '.8rem', color: '#888' }}>{c.placeAddress}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CHIPS */}
            <div className="chips-row">
              <span className="chip">🕐 Pickup now</span>
              <span className="chip">🔄 Round trip</span>
            </div>

            {/* GPS */}
            <button className="gps-btn" onClick={detectCurrentLocation} disabled={pickupLoading}>
              {pickupLoading
                ? <><div style={{ width: 14, height: 14, border: '2px solid #ccc', borderTopColor: '#302b63', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />Detecting…</>
                : <>🎯 Use current location as pickup</>}
            </button>

            <div style={{ marginBottom: '.5rem' }}>
              <span className="city-scope-hint">📍 Results within {selectedCity.name}</span>
            </div>

            {/* ROUTE BOX */}
            <div className="route-box">
              <div className="route-dot" />
              <LocationInput
                icon="🟢" placeholder={`Pickup in ${selectedCity.name}…`}
                value={pickup} onChange={handlePickupChange}
                onSelectGPS={detectCurrentLocation}
                suggestions={pickupSugg} loading={pickupLoading}
                confirmed={pickupConfirmed} disabled={pickupLoading}
                inputRef={pickupInputRef} onSelect={selectPickupPlace}
                onClear={() => { setPickup(''); setPickupSugg([]); setPickupConfirmed(false); setSelectedCar(null); setPickupData({ placeId: '', name: '', address: '', eLoc: '', lat: null, lng: null }); }}
              />
              <div className="route-divider" />
              <LocationInput
                icon="🔴" placeholder={`Drop-off in ${selectedCity.name}…`}
                value={drop} onChange={handleDropChange}
                onSelectGPS={null}
                suggestions={dropSugg} loading={dropLoading || dropSearching}
                confirmed={false} disabled={false}
                inputRef={dropInputRef} onSelect={selectDropPlace}
                onClear={() => { setDrop(''); setDropSugg([]); setSelectedCar(null); setDistance(null); setDuration(null); setDropData({ placeId: '', name: '', address: '', eLoc: '', lat: null, lng: null }); }}
              />
            </div>

            {/* DISTANCE BADGE */}
            {distance && duration && (
              <div style={{ marginBottom: '.25rem' }}>
                <span className="dist-badge">
                  📏 {distance.toFixed(2)} km &nbsp;·&nbsp; ⏱ {Math.round(duration)} min
                  {distSource === 'hv' && <span style={{ opacity: 0.6, fontWeight: 400 }}>&nbsp;(est.)</span>}
                </span>
              </div>
            )}

            {/* CAR SELECTION */}
            {showCarSection && (
              <CarSelection distance={distance} duration={duration} selectedCar={selectedCar} onCarSelect={setSelectedCar} />
            )}

            {/* SUBMIT */}
            {flowStep === "CALCULATING" ? (
              <div className="calc-bar">
                <div style={{ width: 20, height: 20, border: '2.5px solid rgba(48,43,99,.2)', borderTopColor: '#302b63', borderRadius: '50%', animation: 'spin .8s linear infinite', flexShrink: 0 }} />
                Calculating route & pricing…
              </div>
            ) : (
              <button className={`submit-btn ${canSubmit ? 'submit-on' : 'submit-off'}`} onClick={handleSubmit} disabled={!canSubmit}>
                {!pickup ? 'Enter pickup location' : !drop ? 'Enter drop location' : !selectedCar ? 'Select a vehicle' : '🚗 Confirm Booking'}
              </button>
            )}
          </div>

          {/* RIGHT CARD */}
          <div className="rp-card">
            <h3 className="rp-title">Why choose us</h3>
            {trustPoints.map((item, idx) => (
              <div key={idx} className="trust-item">
                <div className="trust-icon">{item.icon}</div>
                <div>
                  <div className="trust-name">{item.title}</div>
                  <div className="trust-desc">{item.desc}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,.1)' }}>
              <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.4)', lineHeight: 1.6 }}>
                ₹{PRICING.perKmRate}/km · {PRICING.gstPercentage}% GST included · No hidden charges
              </div>
            </div>
          </div>
        </div>
      </div>
     )}
      {/* ════════════════════════════════════════
          STEP 1 — DRIVER FOUND → Go for Payment
          ════════════════════════════════════════ */}
      {flowStep === "PAYMENT" && driverInfo && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title" style={{ color: '#2e7d32' }}>✅ Driver Found!</h3>

            {/* Driver card */}
            <div style={{ background: '#f0fdf4', border: '2px solid #86efac', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#302b63,#24243e)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>👨‍✈️</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a2e' }}>{driverInfo.name}</div>
                  <div style={{ fontSize: '0.82rem', color: '#555' }}>Your driver</div>
                </div>
              </div>
              {driverInfo.phone && (
                <div className="price-row">
                  <span>📞 Phone</span>
                  <a href={`tel:${driverInfo.phone}`} style={{ color: '#1d6f42', fontWeight: 700, textDecoration: 'none' }}>{driverInfo.phone}</a>
                </div>
              )}
              {driverInfo.vehicleType && <div className="price-row"><span>🚗 Vehicle</span><span>{driverInfo.vehicleType}</span></div>}
              {driverInfo.vehicleNumber && (
                <div className="price-row">
                  <span>🔢 Number Plate</span>
                  <span style={{ background: '#1a1a2e', color: '#fff', padding: '2px 10px', borderRadius: '6px', fontWeight: 700, letterSpacing: '1px', fontSize: '0.9rem' }}>{driverInfo.vehicleNumber}</span>
                </div>
              )}
            </div>

            {/* Fare summary */}
            {priceDetails && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div className="price-row"><span>📍 Pickup</span><span style={{ maxWidth: '60%', textAlign: 'right', fontSize: '0.85rem' }}>{priceDetails.pickup?.address || priceDetails.pickup?.name}</span></div>
                <div className="price-row"><span>🏁 Drop</span><span style={{ maxWidth: '60%', textAlign: 'right', fontSize: '0.85rem' }}>{priceDetails.dropoff?.address || priceDetails.dropoff?.name}</span></div>
                <div className="price-total"><span>Total Fare</span><span style={{ color: '#f4511e' }}>₹{priceDetails.totalFare}</span></div>
              </div>
            )}

            {/* ── Go for Payment button ── */}
            <button className="submit-btn submit-on" onClick={() => setFlowStep("PAY_QR")}>
              💳 Go for Payment
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          STEP 2 — QR PAYMENT SCREEN
          ════════════════════════════════════════ */}
      {flowStep === "PAY_QR" && (
        <div className="modal-overlay">
          <div className="pay-modal">
            <h3 className="pay-title">💳 Complete Payment</h3>
            <p className="pay-subtitle">Scan the QR code below to pay your driver</p>

            {/* QR Code */}
            <div className="qr-wrap">
              <img src={QrImage} alt="Payment QR Code" className="qr-img" />
              <div className="qr-hint">Scan with any UPI app · Google Pay · PhonePe · Paytm</div>
            </div>

            {/* Booking details */}
            <div className="pay-details">
              {driverInfo?.name && (
                <div className="pay-detail-row"><span>👨‍✈️ Driver</span><span>{driverInfo.name}</span></div>
              )}
              {driverInfo?.vehicleType && (
                <div className="pay-detail-row"><span>🚗 Vehicle</span><span>{driverInfo.vehicleType}</span></div>
              )}
              {driverInfo?.vehicleNumber && (
                <div className="pay-detail-row"><span>🔢 Plate</span><span>{driverInfo.vehicleNumber}</span></div>
              )}
              {priceDetails && (
                <>
                  <div className="pay-detail-row"><span>📍 Pickup</span><span style={{ maxWidth: '55%', textAlign: 'right', fontSize: '0.82rem' }}>{priceDetails.pickup?.address || priceDetails.pickup?.name}</span></div>
                  <div className="pay-detail-row"><span>🏁 Drop</span><span style={{ maxWidth: '55%', textAlign: 'right', fontSize: '0.82rem' }}>{priceDetails.dropoff?.address || priceDetails.dropoff?.name}</span></div>
                  <div className="pay-detail-row"><span>📏 Distance</span><span>{typeof priceDetails.distance === 'number' ? priceDetails.distance.toFixed(2) : priceDetails.distance} km</span></div>
                  <div className="pay-detail-row"><span>⏱ Duration</span><span>{typeof priceDetails.duration === 'number' ? Math.round(priceDetails.duration) : priceDetails.duration} min</span></div>
                  <div className="pay-detail-row"><span>🚘 Vehicle</span><span>{priceDetails.car?.name || priceDetails.carName}</span></div>
                  <div className="pay-detail-row"><span>Base (₹12/km)</span><span>₹{priceDetails.subtotal}</span></div>
                  <div className="pay-detail-row"><span>GST (5%)</span><span>₹{priceDetails.gstAmount}</span></div>
                  <div className="pay-total-row">
                    <span>💰 Total</span>
                    <span style={{ color: '#f4511e', fontSize: '1.3rem' }}>₹{priceDetails.totalFare}</span>
                  </div>
                </>
              )}
            </div>

            {/* I have made payment */}
            <button className="pay-btn-primary" onClick={() => setFlowStep("POST_PAY")}>
              ✅ I Have Made Payment
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          STEP 3 — POST PAYMENT: Send Invoice + Live Tracking
          ════════════════════════════════════════ */}
      {flowStep === "POST_PAY" && (
        <div className="modal-overlay">
          <div className="pay-modal">
            <h3 className="pay-title" style={{ color: '#2e7d32' }}>🎉 Payment Done!</h3>
            <p className="pay-subtitle">Your ride is confirmed. Send your invoice or start tracking.</p>

            {/* Quick summary */}
            {priceDetails && (
              <div className="pay-details" style={{ marginBottom: '1.25rem' }}>
                <div className="pay-detail-row"><span>📍 Pickup</span><span style={{ maxWidth: '55%', textAlign: 'right', fontSize: '0.82rem' }}>{priceDetails.pickup?.address || priceDetails.pickup?.name}</span></div>
                <div className="pay-detail-row"><span>🏁 Drop</span><span style={{ maxWidth: '55%', textAlign: 'right', fontSize: '0.82rem' }}>{priceDetails.dropoff?.address || priceDetails.dropoff?.name}</span></div>
                <div className="pay-total-row">
                  <span>Total Paid</span>
                  <span style={{ color: '#2e7d32' }}>₹{priceDetails.totalFare}</span>
                </div>
              </div>
            )}

            {/* Send invoice button / success */}
            {!invoiceSent ? (
              <>
                <button className="pay-btn-primary" onClick={sendInvoice} disabled={sendingInvoice}>
                  {sendingInvoice
                    ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.6rem' }}><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />Sending Invoice…</span>
                    : '📧 Send Invoice to Email'}
                </button>
                {invoiceError && <div style={{ color: '#d32f2f', fontSize: '.85rem', marginBottom: '.75rem', textAlign: 'center' }}>⚠️ {invoiceError}</div>}
              </>
            ) : (
              <div className="invoice-success">
                ✅ Invoice sent to your email successfully!
              </div>
            )}

            {/* ── Go for Live Tracking → now goes to SHARE_LOCATION first ── */}
            <button className="track-btn" onClick={() => {
              // Reset location state each time
              setUserLocation(null);
              setUserLocAddress('');
              setUserLocQuery('');
              setUserLocSugg([]);
              setUserLocConfirmed(false);
              setUserLocError('');
              setFlowStep("SHARE_LOCATION");
            }}>
              🗺️ Go for Live Tracking
            </button>

            {/* Cancel ride */}
            <button
              className="submit-btn"
              style={{ background: '#fee2e2', color: '#b91c1c', fontWeight: 700, marginTop: '.75rem' }}
              onClick={() => {
                if (window.confirm('Cancel this ride?')) {
                  setFlowStep("FORM"); setRideId(null); setDriverInfo(null); setPriceDetails(null);
                  setDistance(null); setDuration(null); setPickup(''); setDrop('');
                  setPickupData({ placeId: '', name: '', address: '', eLoc: '', lat: null, lng: null });
                  setDropData({ placeId: '', name: '', address: '', eLoc: '', lat: null, lng: null });
                  setPickupConfirmed(false); setSelectedCar(null);
                  setInvoiceSent(false); setInvoiceError('');
                }
              }}
            >
              ❌ Cancel Ride
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          STEP 3.5 — SHARE LOCATION WITH DRIVER
          ════════════════════════════════════════ */}
      {flowStep === "SHARE_LOCATION" && (
        <div className="modal-overlay">
          <div className="loc-modal">

            {/* Hero */}
            <div className="loc-hero">
              <div className="loc-icon-ring">📍</div>
              <h3 className="loc-hero-title">Share your location</h3>
              <p className="loc-hero-sub">
                Let your driver know exactly where you are right now so they can navigate to you quickly.
              </p>
            </div>

            {/* Driver hint */}
            <div className="loc-driver-hint">
              🚗 <span><strong>{driverInfo?.name || 'Your driver'}</strong> is on the way. Share your live location or confirm your pickup point so they don&apos;t have to search for you.</span>
            </div>

            {/* GPS detect button */}
            <button
              className="loc-gps-btn"
              onClick={detectUserLiveLocation}
              disabled={detectingUserLoc}
            >
              {detectingUserLoc
                ? <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} /> Detecting your location…</>
                : <>🎯 Auto-detect my current location</>}
            </button>

            {/* Divider */}
            <div className="loc-divider">or type your pickup address</div>

            {/* Manual search */}
            <div className="loc-search-wrap">
              <span className="loc-search-icon">🔍</span>
              <input
                type="text"
                className="loc-search-input"
                placeholder={`Search pickup address in ${selectedCity.name}…`}
                value={userLocQuery}
                autoComplete="off"
                onChange={e => handleUserLocQueryChange(e.target.value)}
              />
              {userLocSearching && (
                <div style={{ position: 'absolute', right: '.85rem', top: '50%', transform: 'translateY(-50%)' }}>
                  <div style={{ width: 15, height: 15, border: '2px solid #eee', borderTopColor: '#302b63', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                </div>
              )}
              {userLocSugg.length > 0 && (
                <div className="loc-sugg-list">
                  {userLocSugg.map((place, i) => (
                    <div
                      key={i}
                      className="loc-sugg-item"
                      onMouseDown={e => { e.preventDefault(); selectUserLocPlace(place); }}
                    >
                      <div className="loc-sugg-name">{place.placeName || place.name}</div>
                      {(place.placeAddress || place.address) && (
                        <div className="loc-sugg-addr">{place.placeAddress || place.address}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {userLocError && (
              <div className="loc-err">
                ⚠️ {userLocError}
              </div>
            )}

            {/* Confirmed location preview */}
            {userLocConfirmed && userLocation && (
              <div className="loc-confirmed">
                <div className="loc-confirmed-icon">✅</div>
                <div className="loc-confirmed-text">
                  <div className="loc-confirmed-label">Location confirmed</div>
                  <div className="loc-confirmed-addr">{userLocAddress || `${userLocation.lat?.toFixed(5)}, ${userLocation.lng?.toFixed(5)}`}</div>
                  {userLocation.lat && userLocation.lng && (
                    <div style={{ fontSize: '.75rem', color: '#4ade80', marginTop: 3, fontFamily: 'monospace' }}>
                      {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Proceed button */}
            <button
              className="loc-proceed-btn"
              onClick={saveUserLocationAndProceed}
              disabled={!userLocConfirmed || !userLocation || savingUserLoc}
            >
              {savingUserLoc
                ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.6rem' }}>
                    <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                    Sharing with driver…
                  </span>
                : '🗺️ Share & Go for Live Tracking'}
            </button>

            {/* Skip */}
            <button className="loc-skip-btn" onClick={skipLocationSharing}>
              Skip for now — proceed without sharing
            </button>

          </div>
        </div>
      )}

      {/* SUMMARY MODAL */}
      {flowStep === "SUMMARY" && priceDetails && (
        <div className="modal-overlay">
          <div className="modal-card">
            <button className="modal-close" onClick={() => setFlowStep("FORM")}>✕</button>
            <h3 className="modal-title">Booking Summary</h3>
            <div className="price-row"><span>Pickup</span><span style={{ maxWidth: '60%', textAlign: 'right' }}>{priceDetails.pickup.address || priceDetails.pickup.name}</span></div>
            <div className="price-row"><span>Drop</span><span style={{ maxWidth: '60%', textAlign: 'right' }}>{priceDetails.dropoff.address || priceDetails.dropoff.name}</span></div>
            <div className="price-row"><span>Distance</span><span>{typeof priceDetails.distance === 'number' ? priceDetails.distance.toFixed(2) : priceDetails.distance} km</span></div>
            <div className="price-row"><span>Duration</span><span>{typeof priceDetails.duration === 'number' ? Math.round(priceDetails.duration) : priceDetails.duration} min</span></div>
            <div className="price-row"><span>Vehicle</span><span>{priceDetails.car?.name || priceDetails.carName}</span></div>
            <div className="price-row"><span>Base fare (₹12/km × {typeof priceDetails.distance === 'number' ? priceDetails.distance.toFixed(2) : priceDetails.distance} km)</span><span>₹{priceDetails.subtotal}</span></div>
            <div className="price-row"><span>GST (5%)</span><span>₹{priceDetails.gstAmount}</span></div>
            <div className="price-total"><span>Total</span><span style={{ color: '#f4511e' }}>₹{priceDetails.totalFare}</span></div>
            <button className="submit-btn submit-on" style={{ marginTop: '1.25rem' }} onClick={confirmAndCreateRide}>
              ✅ Confirm & Find Driver
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          LIVE TRACKING — Full screen MapMyIndia map
          ════════════════════════════════════════ */}
      {flowStep === "LIVE_TRACK" && (
        <LocalRideTrackingPage
          rideId={rideId}
          driverInfo={driverInfo}
          priceDetails={priceDetails}
          onClose={() => setFlowStep("POST_PAY")}
        />
      )}

      {error && (
        <div className="error-snack">
          ⚠️ {error}
          <button className="error-dismiss" onClick={() => setError('')}>✕</button>
        </div>
      )}
    </>
  );
}