import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Hero2 = () => {
  // Mock navigation function for demonstration
  const navigate = useNavigate();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [showCabMenu, setShowCabMenu] = useState(false); // ✅ added missing state
  const [searchQuery, setSearchQuery] = useState("");

  // Background images
  const images = [
    "https://images.unsplash.com/photo-1654641325054-1dfbfcb4d3f7?q=80&w=1171&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1754567016706-35cfb462e9a3?q=80&w=1170&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?fm=jpg&q=60&w=3000&auto=format&fit=crop",
  ];

  // Services data
  const services = [
    { 
      icon: "",
      title: "Local Pickup",
      description: "Quick and reliable rides within your city",
      path: "/pickup",
      color: "from-orange-50 to-orange-100",
      hover: "hover:shadow-orange-200"
    },
    { 
      icon: "✈️",
      title: "Airport Transfer",
      description: "Hassle-free rides to and from airports with flight tracking",
      path: "/local-pickup",
      color: "from-blue-50 to-blue-100",
      hover: "hover:shadow-blue-200"
    },
    { 
      icon: "",
      title: "Outstation",
      description: "Comfortable intercity travel with experienced drivers",
      path: "/outstation", // Update with your actual route
      color: "from-green-50 to-green-100",
      hover: "hover:shadow-green-200"
    },
    { 
      icon: "🏖️",
      title: "Holiday Packages",
      description: "All-inclusive getaways to dream destinations",
      path: "/search-holidays", // Update with your actual route
      color: "from-amber-50 to-amber-100",
      hover: "hover:shadow-amber-200"
    },
    { 
      icon: "🌎",
      title: "International",
      description: "Seamless car rentals across the globe", // Update with your actual route
      color: "from-purple-50 to-purple-100",
      hover: "hover:shadow-purple-200"
    }
  ];

  // Handle card click
  const handleCardClick = (path) => {
    navigate(path);
  };

  // Search handler
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate("/search-holidays", { state: { search: searchQuery.trim() } });
    }
  };

  // Testimonials
  const testimonials = [
    { text: "Best travel experience ever! ⭐⭐⭐⭐⭐", author: "Rahul S." },
    { text: "Affordable and reliable service", author: "Priya M." },
    { text: "24/7 customer support is amazing", author: "Amit K." }
  ];

  // Rotate background images
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isHovered) {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isHovered]);

  // Auto-scroll testimonials
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 7000);
    return () => clearInterval(testimonialInterval);
  }, []);

  return (
    <div
      className="relative w-full -mx-4 mt-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background with overlay */}
      <div className="relative min-h-screen w-screen overflow-hidden">
        {/* Background Image with Fade Effect */}
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={image}
              alt="Travel destination"
              className="w-screen h-full object-cover object-center"
              style={{ width: '100vw', left: '50%', right: '50%', marginLeft: '-50vw', marginRight: '-50vw', position: 'relative' }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/30 to-orange-900/40" />
          </div>
        ))}

        {/* Animated particles overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-orange-300 rounded-full animate-pulse delay-100"></div>
          <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-200"></div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center pt-16 pb-20">
          {/* Heading Section */}
          <div className="text-center max-w-4xl mx-auto mb-8 animate-fade-in">
            <div className="inline-block mb-3 px-4 py-1.5 bg-orange-500/20 backdrop-blur-md rounded-full border border-orange-400/30">
              <span className="text-orange-300 font-semibold text-xs tracking-wide">
                ✨ PREMIUM TRAVEL SERVICES
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 leading-tight px-4 sm:px-0">
              Discover Your Next
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-orange-400 via-orange-300 to-amber-400 bg-clip-text text-transparent animate-gradient">
                Adventure
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-gray-100 mb-6 max-w-2xl mx-auto leading-relaxed font-light px-4 sm:px-0">
              Experience seamless travel planning with our premium services. 
              From airport transfers to dream vacations, we've got you covered.
            </p>

            {/* Enhanced Search Bar */}
          </div>
          {/* Enhanced Search Bar */}
          <div className="w-full max-w-3xl mx-4 sm:mx-auto bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-1.5 border border-white/20 hover:shadow-orange-500/20 transition-all duration-300">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex items-center flex-1 px-3 py-2 sm:py-0">
                <svg
                  className="w-5 h-5 text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Where would you like to go?"
                  className="flex-1 px-3 py-2 sm:py-3 focus:outline-none text-gray-700 text-base bg-transparent w-full"
                />
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-6 sm:px-8 py-2 sm:py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                <span className="flex items-center justify-center gap-2 text-sm sm:text-base">
                  Search
                  <svg
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
              </button>
            </form>
          </div>
<br />
          {/* Services Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 px-2 sm:px-0 mb-8">
            {services.map((service, index) => (
              <div
                key={index}
                onClick={() => handleCardClick(service.path)}
                style={{ animationDelay: `${index * 100}ms` }}
                className={`group relative bg-gradient-to-br ${service.color} backdrop-blur-sm rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 sm:hover:-translate-y-2 border-2 border-white/40 ${service.hover} overflow-hidden`}
              >
                {/* Shine effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-white/40 backdrop-blur-md text-lg sm:text-xl mb-1 sm:mb-2 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                    {service.icon}
                  </div>
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 mb-1 sm:mb-2 group-hover:text-gray-900 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-gray-700 text-xs sm:text-sm leading-relaxed mb-2 sm:mb-3 line-clamp-2">
                    {service.description}
                  </p>
                  <div className="flex items-center text-orange-600 font-bold text-sm group-hover:text-orange-700 transition-colors">
                    <span className="group-hover:translate-x-1 transition-transform duration-300">
                      Explore more
                    </span>
                    <svg
                      className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          {/* You can render testimonials here later if you want */}
        </div>

        {/* Trust Badges */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl py-3 sm:py-4 border-t-2 border-orange-200/50 shadow-2xl">
          <div className="container mx-auto px-2 sm:px-4">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center items-center gap-2 sm:gap-4 md:gap-6 lg:gap-8 text-gray-700">
                <div className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 rounded-lg group cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="text-xl sm:text-2xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                    🏆
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm sm:text-base text-gray-800 leading-tight">
                      24/7 Support
                    </div>
                    <div className="text-[10px] xs:text-xs text-gray-600 leading-tight">
                      Always here
                    </div>
                  </div>
                </div>
              <div className="hidden sm:block w-px h-8 sm:h-10 bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
              <div className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 rounded-lg group cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="text-xl sm:text-2xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  ✅
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm sm:text-base text-gray-800 leading-tight">
                    5000+ Customers
                  </div>
                  <div className="text-[10px] xs:text-xs text-gray-600 leading-tight">
                    Trusted by many
                  </div>
                </div>
              </div>
              <div className="hidden sm:block w-px h-8 sm:h-10 bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
              <div className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 rounded-lg group cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="text-xl sm:text-2xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  ⭐
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm sm:text-base text-gray-800 leading-tight">
                    4.9/5 Rating
                  </div>
                  <div className="text-[10px] xs:text-xs text-gray-600 leading-tight">
                    Top reviews
                  </div>
                </div>
              </div>
            </div>

            {/* Only one "Search Cab" button is shown, and its dropdown */}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero2;
