import React, { useEffect, useState } from 'react';
import { Features, Grids, FaqSection, Hero2, ScrollToTop } from "@components"
// import { useUser } from '../context/UserContext';
import { Menu, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

const Home = () => {
    const users = [
        {
            name: 'Pune Tour Packages',
            image:
                'https://assets-news.housing.com/news/wp-content/uploads/2022/06/21091913/Top-10-places-to-visit-in-Pune-and-things-to-do-13.jpg',
            position: 'Vibrant Maharashtrian Spirit',
        },
        {
            name: 'Kochi Tour Packages',
            image:
                'https://travelsetu.com/apps/uploads/new_destinations_photos/destination/2023/12/14/0120528ad45d17654e50eef115d97f10_1000x1000.jpg',
            position: "God's Own Country",
        },
        {
            name: 'Mumbai Tour Packages',
            image:
                'https://i.pinimg.com/736x/b4/3f/a1/b43fa13581b70f12a1f638067976d9f1.jpg',
            position: 'Where India Awakens',
        },
        {
            name: 'Kashmir Tour Packages',
            image:
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTOgM8_WfQxZE8p-WolFbQt2kwn0CqkfcMnrg&s',
            position: 'Paradise on Earth',
        },
        {
            name: 'Ladakh Tour Packages',
            image:
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQf9iZLih2gNSklGLldYlJ-kyYuulxa6qtiTPMAW9T54g&s',
            position: 'Mountain Majesty',
        },
        {
            name: 'Goa Tour Packages',
            image:
                'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/06/20/29/1b/the-lalit-golf-spa-resort.jpg',
            position: 'Beaches & Bliss',
        },

    ]

    const transportation = [
        {
            name: 'Cars',
            image:
                'https://stimg.cardekho.com/images/carexteriorimages/630x420/Maruti/Swift-Dzire/10243/1686044076724/front-left-side-47.jpg',
            position: 'Take Family upto 4',
        },
        {
            name: `SUV's`,
            image:
                'https://stimg.cardekho.com/images/carexteriorimages/630x420/Toyota/Innova-Crysta/9612/1697698611076/front-left-side-47.jpg',
            position: "Take Family upto 8",
        },
        {
            name: 'Traveller',
            image: 'https://placehold.co/630x420/4f46e5/ffffff?text=Traveller+Vehicle',
            position: 'Take Family upto 20',
        },
        // {
        //     name: 'Bus',
        //     image:
        //         'https://busimg.cardekho.com/p/630x420/in/tata/starbus-ultra-staff-contract/tata-starbus-ultra-staff-contract.jpg?impolicy=resize&imwidth=420',
        //     position: 'Take Family upto 50',
        // },
        // {
        //     name: 'Ladakh Tour Packages',
        //     image:
        //         'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQf9iZLih2gNSklGLldYlJ-kyYuulxa6qtiTPMAW9T54g&s',
        //     position: 'Mountain Majesty',
        // },
        // {
        //     name: 'Goa Tour Packages',
        //     image:
        //         'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/06/20/29/1b/the-lalit-golf-spa-resort.jpg',
        //     position: 'Beaches & Bliss',
        // },

    ]

    const [isMenuOpen, setIsMenuOpen] = React.useState(false)
    const [isMobile, setIsMobile] = useState(false);
    const isApp = Capacitor.isNativePlatform();

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768); // Adjust the breakpoint as needed
        };

        handleResize(); // Check initial size
        window.addEventListener('resize', handleResize); // Listen for window resize events

        return () => window.removeEventListener('resize', handleResize); // Clean up event listener
    }, []);


    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen)
    }

    return (
        <div className={`w-full ${isApp ? 'pb-20' : ''}`}
            style={isApp ? { paddingTop: 'calc(64px + env(safe-area-inset-top, 0px))' } : {}}>

    {isApp ? (
      /* ── APP LAYOUT ── */
      <div className="bg-gray-50 min-h-screen">

        {/* Quick Action Tiles (Uber/Ola style) */}
        <div className="bg-white px-4 pt-4 pb-5 mb-3 shadow-sm">
          <p className="text-base font-semibold text-gray-700 mb-3">What do you need?</p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Local Pickup', icon: '🚖', href: '/pickup' },
              { label: 'Airport', icon: '✈️', href: '/local-pickup' },
              { label: 'Outstation', icon: '🛣️', href: '/outstation' },
              { label: 'Holidays', icon: '🏖️', href: '/search-holidays' },
            ].map((action) => (
              <a key={action.href} href={action.href}
                className="flex flex-col items-center gap-1">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-2xl shadow-sm">
                  {action.icon}
                </div>
                <span className="text-xs text-center text-gray-600 font-medium leading-tight">
                  {action.label}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Transport Options (horizontal scroll like Rapido) */}
        <div className="bg-white px-4 py-4 mb-3 shadow-sm">
          <p className="text-base font-semibold text-gray-700 mb-3">Choose your ride</p>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {transportation.map((t) => (
              <div key={t.name}
                className="flex-shrink-0 w-36 rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden shadow-sm">
                <img src={t.image} alt={t.name}
                  className="w-full h-24 object-cover" />
                <div className="p-2">
                  <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.position}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tour Packages (horizontal scroll) */}
        <div className="bg-white px-4 py-4 mb-3 shadow-sm">
          <p className="text-base font-semibold text-gray-700 mb-1">Tour Packages</p>
          <p className="text-xs text-gray-400 mb-3">Discover India with us</p>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {users.map((u) => (
              <div key={u.name}
                className="flex-shrink-0 w-40 rounded-2xl overflow-hidden shadow-sm relative">
                <img src={u.image} alt={u.name}
                  className="w-full h-28 object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-white text-xs font-semibold leading-tight">{u.name}</p>
                  <p className="text-orange-300 text-xs">{u.position}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trending Destinations */}
        <div className="bg-white px-4 py-4 mb-3 shadow-sm">
          <p className="text-base font-semibold text-gray-700 mb-3">Trending Destinations</p>
          <div className="rounded-2xl overflow-hidden mb-3">
            <img src="https://images.unsplash.com/photo-1564507592333-c60657eea523"
              alt="Taj Mahal" className="w-full h-44 object-cover" />
            <div className="p-2 bg-gray-50">
              <span className="text-xs text-gray-500 font-semibold">TAJ MAHAL, AGRA</span>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                A timeless symbol of love, beauty, and architectural brilliance
              </p>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { city: 'Bangalore', img: 'https://media.istockphoto.com/id/1389319139/photo/18-december-2021-santhebennur-karnataka-india-musafirkhana-and-honda-the-large-pond-has-its.webp?b=1&s=170667a&w=0&k=20&c=KkGLJqCyA1U_toiUZJIryPFauySiZ8fgcN6WXjTo0-M=' },
              { city: 'Chennai', img: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220' },
              { city: 'Mumbai', img: 'https://plus.unsplash.com/premium_photo-1694475160399-aa6d3eb585a2' },
            ].map((d) => (
              <div key={d.city} className="flex-shrink-0 w-28 rounded-xl overflow-hidden shadow-sm relative">
                <img src={d.img} alt={d.city} className="w-full h-20 object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                  <p className="text-white text-xs font-semibold">{d.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features + FAQ still rendered */}
        <div className="bg-white mb-3 shadow-sm"><Features /></div>
        <div className="bg-white mb-3 shadow-sm"><FaqSection /></div>

      </div>

    ) : (
        <div className="w-full">

            {/* HERO SECTION */}
            <Hero2 />

            {/* FEATURES SECTION */}
            <Features />

            <div className="mx-auto max-w-7xl px-2">

                {/* greetings */}
                <div className="mt-16 flex justify-center items-center">
                    <div className="space-y-0">
                        {/* <div className="max-w-max rounded-full border bg-gray-50 p-1 px-3">
                            <p className="text-xs font-semibold leading-normal md:text-sm">Join Us &rarr;</p>
                        </div> */}
                        {/* <p className="text-3xl w-full font-bold text-gray-900 md:text-4xl">Meet our team</p>
                    */}

                        <p className="w-full text-lg text-center text-black md:text-xl p-4">
                            Discover India with us!

                            <span className='font-semibold text-black text-2xl decoration-orange-400 underline py-1 px-3'>
                                Book your tour packages
                            </span>
                            at the lowest rates with guaranteed services.
                            We pride ourselves on being one of the best travel agency, offering tailored experiences based on your preferences.
                        </p>
                        <div></div>
                    </div>
                </div>
                <Grids users={users} />

            </div>

            <div className="mx-auto max-w-7xl px-2">

                {/* greetings */}
                <div className="mt-12 flex justify-center items-center">
                    <div className="">


                        <h2 className="text-3xl font-semibold leading-tight text-black sm:text-xl lg:text-4xl text-center">
                            Transport Chart
                        </h2>
                        <p className="w-full text-lg text-center text-black md:text-xl p-4">
                            We provide best experince to our clients with the best from

                            <span className='font-semibold text-black text-2xl decoration-orange-400 underline py-1 px-3'>
                                hotel bookings to transportation.
                            </span>

                            You can avail of mini-coaches, luxury coaches, and cars to make each plan special.


                        </p>
                        <div></div>
                    </div>
                </div>
                {/* TEAM */}
                <Grids users={transportation} />


            </div>


            {/* TRENDING DESTINATIONS */}
            <div className="mx-auto max-w-7xl px-2 lg:mt-10">

                <div className="mx-auto max-w-7xl lg:max-w-7xl mb-5 lg:mb-10">
                    <div className="mx-auto mb-14 text-center">
                        {/* <span className="mb-4 inline-block rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-black">
                                        OUR BLOG
                                    </span> */}
                        {/* <h1 className="text-5xl font-bold">Latest news from our blog</h1> */}
                        <h2 className="text-3xl font-semibold leading-tight text-black sm:text-xl lg:text-4xl text-center">
                            Trending destinations
                        </h2>
                        <p className="w-full text-lg text-center  text-black md:text-xl p-4 lg:pl-10 lg:pr-10">
                            We provide best experince to our clients with the best from

                            <span className='font-semibold text-black text-2xl decoration-orange-400 underline py-1 px-3'>
                                hotel bookings to transportation.
                            </span>

                            You can avail of mini-coaches, luxury coaches, and cars to make each plan special.


                        </p>
                    </div>


                    <div className="my-18 -mx-4 flex flex-wrap px-4">
                        <div className="mb-12 w-full px-4 lg:mb-0 lg:w-1/2">
                            <a className="group block w-full" >
                                <img
                                    className="mb-5 block w-full rounded-lg object-cover"
                                    src="https://images.unsplash.com/photo-1564507592333-c60657eea523"
                                    alt=""
                                />
                                <span className="text-lg font-semibold mb-2 block text-gray-500">TAJ MAHAL, AGRA</span>
                                <h4 className="mb-5 text-3xl font-semibold text-gray-900">
                                    A timeless symbol of love, beauty, and architectural brilliance
                                </h4>
                                {/* <p className="max-w-xl text-lg text-gray-500">
                                    INDIA 
                                </p> */}
                            </a>
                        </div>


                        {!isMobile ?
                        <div className="w-full px-4 lg:w-1/2">
                            <a className="group mb-8 md:flex" >
                                <img
                                    className="h-40 w-48 rounded-lg object-cover"
                                    src="https://media.istockphoto.com/id/1389319139/photo/18-december-2021-santhebennur-karnataka-india-musafirkhana-and-honda-the-large-pond-has-its.webp?b=1&s=170667a&w=0&k=20&c=KkGLJqCyA1U_toiUZJIryPFauySiZ8fgcN6WXjTo0-M="
                                    alt=""
                                />
                                <div className="my-4 pt-2 md:ml-6 md:mt-0">
                                    <span className="text-lg font-semibold mb-2 block text-gray-500">
                                        Bangalore</span>
                                    <h4 className="text-xl font-semibold text-gray-900">
                                        The vibrant city of gardens, innovation, and rich cultural heritage
                                    </h4>
                                </div>
                            </a>
                            <a className="group mb-8 md:flex" >
                                <img
                                    className="h-40 w-48 rounded-lg object-cover"
                                    src="https://images.unsplash.com/photo-1582510003544-4d00b7f74220"
                                    alt=""
                                />
                                <div className="my-4 pt-2 md:ml-6 md:mt-0">
                                    <span className="text-lg font-semibold mb-2 block text-gray-500">
                                        Chennai</span>
                                    <h4 className="text-xl font-semibold text-gray-900">
                                        The vibrant city of gardens, innovation, and rich cultural heritage.
                                    </h4>
                                </div>
                            </a>
                            <a className="group mb-8 md:flex" >
                                <img
                                    className="h-40 w-48 rounded-lg object-cover"
                                    src="https://plus.unsplash.com/premium_photo-1694475160399-aa6d3eb585a2"
                                    alt=""
                                />
                                <div className="my-4 pt-2 md:ml-6 md:mt-0">
                                    <span className="text-lg font-semibold mb-2 block text-gray-500">
                                        Mumbai

                                    </span>
                                    <h4 className="text-xl font-semibold text-gray-900">
                                        The dynamic heart of India, where dreams and reality
                                        blend seamlessly.
                                    </h4>
                                </div>
                            </a>
                        </div>
                            : ''}
                    </div>
                    {/* <div className="mt-14 text-center">
                        <button
                            type="button"
                            className="rounded-md border border-black px-3 py-2 text-sm font-semibold text-black shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                        >
                            View All Posts
                        </button>
                    </div> */}
                </div>





            </div>

            {/* FAQ SECTION */}
            <FaqSection />

            {/* LINE BORDER  */}
            <hr className="mt-6" />
        </div>
    )}

    </div>  
  );
}

export default ScrollToTop(Home);