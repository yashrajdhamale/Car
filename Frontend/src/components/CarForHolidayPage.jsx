import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getState,
  getPackagesByState,
} from "../utils/holidayPackages";
import vehicles from "../vehicles.json";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { X, ChevronDown } from "lucide-react";

function ItineraryModal({ open, onClose, pkg, showAll, setShowAll }) {
  if (!open || !pkg) return null;

  const itinerary = Array.isArray(pkg.itinerary) ? pkg.itinerary : [];
  const formattedItems =
    itinerary.length && typeof itinerary[0] === "object"
      ? itinerary
      : itinerary.map((day) => ({ day, details: "" }));
  const visibleItems = showAll ? formattedItems : formattedItems.slice(0, 2);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6 relative border border-gray-100">
        <button
          type="button"
          onClick={() => { setShowAll(false); onClose(); }}
          aria-label="Close"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-sm font-semibold text-gray-800 mb-1">{pkg.name}</h2>
        <p className="text-xs text-gray-400 mb-4 pb-3 border-b border-gray-100">Itinerary</p>
        <div className="max-h-[55vh] overflow-y-auto space-y-3 pr-1">
          {visibleItems.map((item, idx) => (
            <div key={idx} className="flex gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-500 text-white font-semibold text-[10px] flex items-center justify-center mt-0.5">
                {idx + 1}
              </span>

              <div className="flex-1">
                <p className="font-medium text-gray-700 text-sm">
                  {item.day}
                </p>

                {item.images?.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 mb-3">
                    {item.images.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`${item.day}-${index}`}
                        className="w-full h-52 object-cover rounded-lg border shadow-sm"
                      />
                    ))}
                  </div>
                )}

                {Array.isArray(item.details) ? (
                  <ul className="list-disc pl-5 space-y-2 text-gray-600 text-sm leading-6">
                    {item.details.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm leading-6 whitespace-pre-line">
                    {item.details}
                  </p>
                )}
              </div>
            </div>
          ))}
          {!showAll && formattedItems.length > 2 && (
            <button
              className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-700 font-medium mt-1"
              onClick={() => setShowAll(true)}
            >
              Show all days <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CarForHolidayPage() {
  const location = useLocation();
  const searchQuery = location.state?.searchQuery || "";

  const [selectedState, setSelectedState] = useState({
    bgImage: "",
    packages: [],
  });
  const [guestCounts, setGuestCounts] = useState({});
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: "" });
  const [loggedIn, setLoggedIn] = useState(false);
  const navigate = useNavigate();

  const [modalPkg, setModalPkg] = useState(null);
  const [showAllModalDays, setShowAllModalDays] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => setLoggedIn(!!user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {

    const loadPackages = async () => {

      if (!searchQuery) return;

      try {

        const stateName = searchQuery
          .split(" ")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        const state = await getState(stateName);

        const packages = await getPackagesByState(stateName);

        setSelectedState({
          bgImage: state?.bgImage || "",
          packages,
        });

      } catch (err) {

        console.error(err);

        setSelectedState({
          bgImage: "",
          packages: [],
        });

      }

    };

    loadPackages();

  }, [searchQuery]);

  const updateGuestCount = (pkgIndex, value) => {
    setGuestCounts((prev) => {
      const current = prev[pkgIndex] || 1;
      return { ...prev, [pkgIndex]: Math.max(1, Math.min(10, current + value)) };
    });
  };

  const showTooltip = (event, text) => {
    const rect = event.target.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top > 80 ? rect.top - 44 : rect.bottom + 12,
      text,
    });
  };

  const hideTooltip = () => setTooltip({ visible: false, x: 0, y: 0, text: "" });

  const handleBook = (pkg, veh, vIdx, pkgIdx) => {
    const rateObj = pkg.rates?.find((r) => r.vehicle === (veh.name || veh));
    if (!rateObj) return;

    const vehicleCapacity = veh.capacity || 4;
    const guests = guestCounts[pkgIdx] || 1;

    if (guests > vehicleCapacity) {
      alert(`${veh.name || veh} fits max ${vehicleCapacity} guests.`);
      return;
    }

    if (!loggedIn) {
      navigate("/login", { state: { from: location } });
    } else {
      navigate("/book", {
        state: {
          package: pkg,
          vehicle: veh,
          guests,
          price: rateObj.price,
        },
      });
    }
  };

  if (selectedState.packages.length === 0) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)" }}
      >
        <p className="text-gray-400 text-sm">No packages found for "{searchQuery}"</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(160deg, #fff7ed 0%, #ffedd5 40%, #fef3c7 70%, #fff7ed 100%)",
      }}
    >
      <style>{`
        .page-bg::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: radial-gradient(circle, #f9731620 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
          z-index: 0;
        }

        /* Mobile: stack each package as a card */
        @media (max-width: 640px) {
          .pkg-table { display: none; }
          .pkg-cards { display: flex; flex-direction: column; gap: 12px; }
        }
        @media (min-width: 641px) {
          .pkg-table { display: table; }
          .pkg-cards { display: none; }
        }
      `}</style>

      <div className="page-bg relative z-10">
        {/* Hero */}
        <div
          className="w-full bg-center bg-cover relative"
          style={{ height: "180px", backgroundImage: `url(${selectedState.bgImage})` }}
        >
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute bottom-4 left-6">
            <span className="text-white text-lg font-bold tracking-wide drop-shadow-md">
              {searchQuery}
            </span>
            <p className="text-white/75 text-xs mt-0.5">Holiday Packages</p>
          </div>
        </div>

        <div className="px-3 sm:px-6 py-6">
          {/* Section header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-5 w-1 rounded-full bg-orange-500" />
            <h2 className="text-sm font-semibold text-gray-700 tracking-wide uppercase">
              Available Packages
            </h2>
            <div className="flex-1 h-px bg-orange-200/60" />
          </div>

          {/* ── DESKTOP TABLE ── */}
          <div
            className="pkg-table w-full bg-white rounded-2xl overflow-hidden"
            style={{
              border: "1px solid #fed7aa",
              boxShadow:
                "0 1px 3px rgba(249,115,22,0.08), 0 4px 24px rgba(249,115,22,0.07), 0 0 0 1px rgba(249,115,22,0.04)",
            }}
          >
            <table className="w-full border-collapse" style={{ tableLayout: "auto" }}>
              <thead>
                <tr style={{ background: "linear-gradient(90deg, #f97316 0%, #ea580c 100%)" }}>
                  <th className="px-5 py-3.5 text-left text-white font-semibold text-sm border-r border-white/20 whitespace-nowrap">
                    Package Details
                  </th>
                  {vehicles.map((veh, idx) => (
                    <th
                      key={idx}
                      className="px-3 py-3.5 text-center text-white font-semibold text-sm border-r border-white/20"
                    >
                      {veh.name || veh}
                    </th>
                  ))}
                  <th className="px-3 py-3.5 text-center text-white font-semibold text-sm whitespace-nowrap">
                    Guests
                  </th>
                </tr>
              </thead>

              <tbody>
                {selectedState.packages.map((pkg, i) => (
                  <tr
                    key={i}
                    className="hover:bg-orange-50/60 transition-colors"
                    style={{
                      background: i % 2 === 0 ? "#ffffff" : "#fffbf7",
                      borderBottom: "1px solid #fde8d0",
                    }}
                  >
                    {/* Package Info */}
                    <td className="px-5 py-4 align-middle" style={{ borderRight: "1px solid #fde8d0" }}>
                      <p className="font-semibold text-gray-800 text-sm leading-snug">{pkg.name}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{pkg.duration}</p>
                      <button
                        className="text-xs text-orange-500 hover:text-orange-700 underline underline-offset-2 mt-1.5 block transition-colors"
                        onClick={() => { setModalPkg(pkg); setShowAllModalDays(false); }}
                      >
                        View Itinerary
                      </button>
                      <span
                        className="inline-block mt-2 text-[11px] bg-orange-50 text-orange-500 border border-orange-200 rounded-md px-2 py-0.5 cursor-default font-medium"
                        onMouseEnter={(e) => showTooltip(e, `Km Limit: ${pkg.kmLimit}`)}
                        onMouseLeave={hideTooltip}
                      >
                        📍 Km Limit
                      </span>
                    </td>

                    {/* Per-vehicle: price + small Book button */}
                    {vehicles.map((veh, vIdx) => {
                      const rateObj = pkg.rates?.find((r) => r.vehicle === (veh.name || veh));
                      return (
                        <td
                          key={vIdx}
                          className="px-2 py-3 text-center align-middle"
                          style={{ borderRight: "1px solid #fde8d0" }}
                        >
                          {rateObj ? (
                            <div className="flex flex-col items-center gap-1.5">
                              <span className="font-semibold text-sm text-gray-700">
                                ₹{rateObj.price.toLocaleString()}
                              </span>
                              <button
                                onClick={() => handleBook(pkg, veh, vIdx, i)}
                                className="text-[11px] px-2.5 py-1 rounded-md font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-sm hover:shadow-md transition-all whitespace-nowrap leading-tight"
                              >
                                Book
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-300 text-sm">—</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Guest Counter */}
                    <td className="px-3 py-4 align-middle">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => updateGuestCount(i, -1)}
                          className="w-6 h-6 rounded-md border border-orange-200 text-orange-400 hover:bg-orange-50 hover:border-orange-400 text-sm font-bold flex items-center justify-center transition-colors bg-white"
                          aria-label="Decrease"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-medium text-gray-700">
                          {guestCounts[i] || 1}
                        </span>
                        <button
                          onClick={() => updateGuestCount(i, +1)}
                          className="w-6 h-6 rounded-md border border-orange-200 text-orange-400 hover:bg-orange-50 hover:border-orange-400 text-sm font-bold flex items-center justify-center transition-colors bg-white"
                          aria-label="Increase"
                        >
                          +
                        </button>
                      </div>
                      {guestCounts[i] >= 10 && (
                        <p className="text-[10px] text-red-400 text-center mt-1">Max 10</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── MOBILE CARDS ── */}
          <div className="pkg-cards">
            {selectedState.packages.map((pkg, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden"
                style={{
                  border: "1px solid #fed7aa",
                  boxShadow: "0 2px 12px rgba(249,115,22,0.09)",
                }}
              >
                {/* Card header */}
                <div
                  className="px-4 py-3"
                  style={{ borderBottom: "1px solid #fde8d0" }}
                >
                  <p className="font-semibold text-gray-800 text-sm">{pkg.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{pkg.duration}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      className="text-xs text-orange-500 hover:text-orange-700 underline underline-offset-2 transition-colors"
                      onClick={() => { setModalPkg(pkg); setShowAllModalDays(false); }}
                    >
                      View Itinerary
                    </button>
                    <span className="text-[11px] bg-orange-50 text-orange-500 border border-orange-200 rounded-md px-2 py-0.5 font-medium">
                      📍 {pkg.kmLimit}
                    </span>
                  </div>
                </div>

                {/* Vehicle rows */}
                {vehicles.map((veh, vIdx) => {
                  const rateObj = pkg.rates?.find((r) => r.vehicle === (veh.name || veh));
                  if (!rateObj) return null;
                  return (
                    <div
                      key={vIdx}
                      className="flex items-center justify-between px-4 py-2.5"
                      style={{ borderBottom: "1px solid #fde8d0" }}
                    >
                      <span className="text-xs font-medium text-gray-600">{veh.name || veh}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-800">
                          ₹{rateObj.price.toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleBook(pkg, veh, vIdx, i)}
                          className="text-[11px] px-2.5 py-1 rounded-md font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-sm transition-all whitespace-nowrap"
                        >
                          Book
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Guest counter */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Guests</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateGuestCount(i, -1)}
                      className="w-6 h-6 rounded-md border border-orange-200 text-orange-400 hover:bg-orange-50 text-sm font-bold flex items-center justify-center transition-colors bg-white"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-medium text-gray-700">
                      {guestCounts[i] || 1}
                    </span>
                    <button
                      onClick={() => updateGuestCount(i, +1)}
                      className="w-6 h-6 rounded-md border border-orange-200 text-orange-400 hover:bg-orange-50 text-sm font-bold flex items-center justify-center transition-colors bg-white"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 mt-3 text-center">
            Prices are per trip inclusive of driver
          </p>
        </div>
      </div>

      {/* Itinerary Modal */}
      <ItineraryModal
        open={!!modalPkg}
        onClose={() => setModalPkg(null)}
        pkg={modalPkg}
        showAll={showAllModalDays}
        setShowAll={setShowAllModalDays}
      />

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="fixed z-50 px-2.5 py-1 rounded-md bg-gray-800 text-white text-xs pointer-events-none shadow-lg whitespace-nowrap"
          style={{
            top: tooltip.y,
            left: tooltip.x,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div dangerouslySetInnerHTML={{ __html: tooltip.text }} />
        </div>
      )}
    </div>
  );
}