import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";




export default function FaqSection() {

    const faqItems = [
        {
            question: 'What documents needed to rent a car?',
            answer: 'You will need a valid driver’s license, a credit card in your name, and sometimes an additional form of identification such as a passport or national ID. International tourists may also need an  (IDP).',
        },
        {
            question: 'What is the minimum age requirement to book?',
            answer: 'The minimum age requirement varies by location but is typically between 21 and 25 years old. Some state may charge an additional fee for tolls',
        },
        {
            question: 'Can I rent a car with a debit card?',
            answer: 'Some rental companies accept debit cards, but this can vary. It’s best to check with the specific rental company in advance. When using a debit card, additional identification.',
        },
        {
            question: 'Do I need to purchase additional insurance?',
            answer: 'Basic insurance coverage is often included in the rental price, but you may want to consider additional coverage for extra protection.',
        },
        {
            question: 'Can I return the rental car to a different location?',
            answer: 'Yes, many rental companies offer one-way rentals, allowing you to return the car to a different location. However, this service often incurs an additional fee.',
        },
        {
            question: 'What should I do in case of an accident or breakdown?',
            answer: 'In the event of an accident, contact the rental company immediately for assistance and follow their instructions. Report the incident to the local police and obtain a copy of the police report.',
        },
    ];

    // State to track the visibility of answer content
    const [openIndex, setOpenIndex] = useState(null);

    // Function to toggle the visibility of answer content
    const toggleAnswer = (index) => {
        setOpenIndex((prevIndex) => (prevIndex === index ? null : index));
    };



    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3000,
    };


    return (
        // <section className="mx-auto max-w-7xl px-2 py-10 md:px-0">
        //     {/* Your existing JSX code */}
        //     <div className="mx-auto mt-8 max-w-3xl space-y-4 md:mt-16">

        //         <h2 class="text-3xl font-bold leading-tight mb-10 text-black sm:text-4xl lg:text-3xl text-center">
        //             Frequently Asked Questions
        //         </h2>

        //         {faqItems.map((item, index) => (
        //             <div
        //                 key={index}
        //                 className="cursor-pointer rounded-md border border-gray-400 shadow-lg transition-all duration-200"
        //             >
        //                 <button
        //                     type="button"
        //                     className="flex w-full items-center justify-between px-4 py-5 sm:p-6"
        //                     onClick={() => toggleAnswer(index)}
        //                 >
        //                     <span className="flex text-lg font-semibold text-black">{item.question}</span>
        //                     {/* Conditional rendering of Chevron icon based on whether the item is open */}
        //                     {openIndex === index ? (
        //                         <ChevronUp className="h-5 w-5 text-gray-500" />
        //                     ) : (
        //                         <ChevronDown className="h-5 w-5 text-gray-500" />
        //                     )}
        //                 </button>
        //                 {/* Conditional rendering of answer content based on whether the item is open */}
        //                 {openIndex === index && (
        //                     <div className="px-4 pb-5 sm:px-6 sm:pb-6">
        //                         <p className="text-gray-500">{item.answer}</p>
        //                     </div>
        //                 )}
        //             </div>
        //         ))}
        //     </div>
        // </section>






          <section className="px-2">
            <div className="mx-auto max-w-7xl py-10">
                <div>
                    <div className="max-w-2xl">
                        <h1 className="text-2xl font-bold text-black">Frequently Asked Questions</h1>
                        <p className="mt-4 text-sm leading-6 tracking-wide text-gray-500">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.
                        </p>
                    </div>
                    <div className="hidden mt-6 lg:grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                        {/* {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="rounded-md border border-black/30 p-6">
                                <dt className="text-lg font-semibold leading-6 text-gray-900">
                                    How do I get started?
                                </dt>
                                <dd className="mt-2 text-sm text-gray-500">
                                    Lorem ipsum dolor sit amet consectetur, adipisicing elit. In, et? Obcaecati, nemo
                                    sit. Delectus, totam obcaecati aliquid omnis cumque ex.
                                </dd>
                            </div>
                        ))} */}

                        {faqItems.map((item, index) => 
                            <div key={index} className="rounded-md border border-black/30 p-6">
                            <dt className="text-lg font-semibold leading-6 text-gray-900">
                                {item.question}
                            </dt>
                            <dd className="mt-2 text-sm text-gray-500">
                               {item.answer}
                            </dd>
                        </div>
                        )}

                       


                    </div>

                    
                    <div className="block mt-6 lg:hidden">
                    <Slider {...settings}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="rounded-md border border-black/30 p-6">
                                <dt className="text-lg font-semibold leading-6 text-gray-900">
                                    How do I get started?
                                </dt>
                                <dd className="mt-2 text-sm text-gray-500">
                                    Lorem ipsum dolor sit amet consectetur, adipisicing elit. In, et? Obcaecati, nemo
                                    sit. Delectus, totam obcaecati aliquid omnis cumque ex.
                                </dd>
                            </div>
                        ))}
                    </Slider>
                    </div>
                
                </div>
            </div>
        </section>
    );
};

