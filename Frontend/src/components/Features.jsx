import { useState, useEffect } from 'react'
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { MapPin, Hotel, Headset, TicketPercent } from "lucide-react";


const Features = () => {


    const features = [
        {
            icon: <MapPin className="text-blue-900" />,
            bgColor: "bg-blue-100",
            title: "Multiple Location",
            description: "Tailored travel plans based on customer preferences and interests.",
        },
        {
            icon: <Hotel className="text-orange-500" />,
            bgColor: "bg-orange-100",
            title: "Hotel Services",
            description: "Assistance with booking accommodations such as hotels, resorts, and vacation rentals.",
        },
        {
            icon: <Headset className="text-green-500" />,
            bgColor: "bg-green-100",
            title: "24/7 Customer Support",
            description: "Round-the-clock support for any queries, emergencies, or assistance needed during the trip.",
        },
        {
            icon: <TicketPercent className="text-red-500" />,
            bgColor: "bg-red-100",
            title: "Filter Blocks",
            description: "Access to exclusive deals, discounts, and packages for budget-friendly travel.",
        },
    ];


    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3000,
    };




    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768); // Adjust the breakpoint as needed
        };

        handleResize(); // Check initial size
        window.addEventListener('resize', handleResize); // Listen for window resize events

        return () => window.removeEventListener('resize', handleResize); // Clean up event listener
    }, []);


    return (
        <>
                {/* <h2 className="text-3xl font-bold leading-tight mb-10 text-black sm:text-4xl lg:text-3xl text-center"> */}
            {/* <div className="mx-auto my-32 max-w-7xl px-2 lg:px-8">
                <h2 className="text-3xl font-semibold leading-tight mb-5 lg:mb-10 text-black sm:text-xl lg:text-3xl text-center">
                    Our Services Excel Above the Rest
                </h2>
                <div className="grid grid-cols-1 gap-y-8 text-center sm:grid-cols-2 sm:gap-12 lg:grid-cols-4">
                    <div>

                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                            <MapPin className='text-blue-900' />
                        </div>
                        <h3 className="mt-8 text-lg font-semibold text-black">Multiple Location</h3>
                        <p className="mt-4 text-sm text-gray-600">
                            Tailored travel plans based on customer preferences and interests.
                        </p>
                    </div>
                    <div>
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-100">
                            <Hotel className='text-orange-500'/>
                        </div>
                        <h3 className="mt-8 text-lg font-semibold text-black">Hotel Services</h3>
                        <p className="mt-4 text-sm text-gray-600">
                            Assistance with booking accommodations such as hotels, resorts, and vacation rentals.

                        </p>
                    </div>
                    <div>
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                            <Headset className='text-green-500'/>
                        </div>
                        <h3 className="mt-8 text-lg font-semibold text-black">24/7 Customer Support</h3>
                        <p className="mt-4 text-sm text-gray-600">
                            Round-the-clock support for any queries, emergencies, or assistance needed during the trip.
                        </p>
                    </div>
                    <div>
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                            <TicketPercent className='text-red-500'/>
                        </div>
                        <h3 className="mt-8 text-lg font-semibold text-black">Filter Blocks</h3>
                        <p className="mt-4 text-sm text-gray-600">
                            Access to exclusive deals, discounts, and packages for budget-friendly travel.
                        </p>
                    </div>
                </div>
            </div> */}


            {/*  */}

            <div className="mx-auto my-32 max-w-7xl px-2 lg:px-8">
                <h2 className="text-3xl font-semibold leading-tight mb-5 lg:mb-10 text-black sm:text-xl lg:text-3xl text-center">
                    {isMobile ?
                        "Our Services" :
                        "Our Services Excel Above the Rest"}
                </h2>


                <div className="lg:hidden">
                    <Slider {...settings}>
                        <div className="text-center">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                                <MapPin className="text-blue-900" />
                            </div>
                            <h3 className="mt-8 text-lg font-semibold text-black">Multiple Location</h3>
                            <p className="mt-4 text-sm text-gray-600 px-10">
                                Tailored travel plans based on customer preferences and interests.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-100">
                                <Hotel className="text-orange-500" />
                            </div>
                            <h3 className="mt-8 text-lg font-semibold text-black">Hotel Services</h3>
                            <p className="mt-4 text-sm text-gray-600 px-10">
                                Assistance with booking accommodations such as hotels, resorts, and vacation rentals.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                                <Headset className="text-green-500" />
                            </div>
                            <h3 className="mt-8 text-lg font-semibold text-black">24/7 Customer Support</h3>
                            <p className="mt-4 text-sm text-gray-600 px-10">
                                Round-the-clock support for any queries, emergencies, or assistance needed during the trip.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                                <TicketPercent className="text-red-500" />
                            </div>
                            <h3 className="mt-8 text-lg font-semibold text-black">Filter Blocks</h3>
                            <p className="mt-4 text-sm text-gray-600 px-10">
                                Access to exclusive deals, discounts, and packages for budget-friendly travel.
                            </p>
                        </div>
                    </Slider>
                </div>


                {/* LARGE SCREENS */}
                <div className="hidden lg:grid grid-cols-1 gap-y-8 text-center sm:grid-cols-2 sm:gap-12 lg:grid-cols-4">
                    <div>
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                            <MapPin className="text-blue-900" />
                        </div>
                        <h3 className="mt-8 text-lg font-semibold text-black">Multiple Location</h3>
                        <p className="mt-4 text-sm text-gray-600">
                            Tailored travel plans based on customer preferences and interests.
                        </p>
                    </div>
                    <div>
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-100">
                            <Hotel className="text-orange-500" />
                        </div>
                        <h3 className="mt-8 text-lg font-semibold text-black">Hotel Services</h3>
                        <p className="mt-4 text-sm text-gray-600">
                            Assistance with booking accommodations such as hotels, resorts, and vacation rentals.
                        </p>
                    </div>
                    <div>
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                            <Headset className="text-green-500" />
                        </div>
                        <h3 className="mt-8 text-lg font-semibold text-black">24/7 Customer Support</h3>
                        <p className="mt-4 text-sm text-gray-600">
                            Round-the-clock support for any queries, emergencies, or assistance needed during the trip.
                        </p>
                    </div>
                    <div>
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                            <TicketPercent className="text-red-500" />
                        </div>
                        <h3 className="mt-8 text-lg font-semibold text-black">Filter Blocks</h3>
                        <p className="mt-4 text-sm text-gray-600">
                            Access to exclusive deals, discounts, and packages for budget-friendly travel.
                        </p>
                    </div>
                </div>
            </div>
            {/*  */}

        </>
    )
}

export default Features
