import React, { useState, useEffect } from "react";
import { Search, MapPin, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getHolidayStates,
  getPackagesByState,
} from "../utils/holidayPackages";



export default function SearchHolidaysPage() {
  const [search, setSearch] = useState("");
  const [popularDestinations, setPopularDestinations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflowX = "hidden";

    return () => {
      document.body.style.margin = "";
      document.body.style.padding = "";
      document.body.style.overflowX = "";
    };
  }, []);

  const handleSearch = () => {
    const query = search.trim().toLowerCase();
    if (query) {
      navigate("/carforholidays", {
        state: { searchQuery: query },
      });
    }
  };

  const handleDestinationClick = (destination) => {
    setSearch(destination.label);
    navigate("/carforholidays", {
      state: { searchQuery: destination.value },
    });
  };

  useEffect(() => {
    const loadStates = async () => {
      try {
        const states = await getHolidayStates();

        const result = [];

        for (const state of states) {
          const packages = await getPackagesByState(state.name);

          // Only show states that actually have packages
          if (packages.length > 0) {
            result.push({
              label: state.name,
              value: state.name.toLowerCase(),
              packages: packages.length,
            });
          }
        }

        result.sort((a, b) => a.label.localeCompare(b.label));

        setPopularDestinations(result);
      } catch (err) {
        console.error(err);
      }
    };

    loadStates();
  }, []);

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative"
      style={{ paddingTop: "100px", paddingBottom: "100px" }}
    >
      {/* Background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage:
            'url("https://wallpaperaccess.com/full/3918832.jpg")',
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-32 right-16 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-700" />

      {/* Main content */}
      <div className="relative z-10 max-w-3xl w-full px-4">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Sparkles className="w-16 h-16 text-yellow-400 animate-pulse" />
            <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-xl" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-6xl font-bold text-center mb-4">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            From Himalayas to Beaches
          </span>
        </h1>

        <p className="text-xl text-center mb-10 text-gray-200">
          India Awaits You 🏖️
        </p>

        {/* Search Card */}
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="w-5 h-5 text-orange-400" />
            <p className="text-white/90 text-sm font-medium">
              Discover curated holiday packages across India
            </p>
          </div>

          {/* Search Input */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by destination, city or experience (e.g. Kerala, Munnar, Kaziranga, Shillong)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full py-4 pl-12 pr-4 rounded-xl bg-black/40 text-white border border-white/20 placeholder-gray-400 focus:ring-2 focus:ring-orange-400 outline-none"
              />
            </div>

            <button
              onClick={handleSearch}
              className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-4 rounded-xl text-white font-semibold hover:scale-105 transition"
            >
              <Search className="inline w-5 h-5 mr-2" />
              Search
            </button>
          </div>

          {/* Popular Destinations */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-white/60 text-xs mb-3 font-medium">
              POPULAR DESTINATIONS
            </p>

            <div className="flex flex-wrap gap-3">
              {popularDestinations.map((d) => (
                <button
                  key={d.value}
                  onClick={() => handleDestinationClick(d)}
                  className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/90 text-sm border border-white/10 hover:border-white/30 transition"
                >
                  {d.label}
                  <span className="ml-2 text-xs text-white/50">
                    · {d.packages} packages
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer line */}
        <p className="text-center mt-8 text-white/50 text-sm">
          Handpicked tour packages · Transparent pricing · Trusted routes
        </p>
      </div>
    </div>
  );
}
