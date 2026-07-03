import { useState, useEffect } from 'react';
import BookForm from './BookForm';

const Hero = () => {

    const [filledStars, setFilledStars] = useState(-1);

    useEffect(() => {
        const fillStars = () => {
            if (filledStars < 5) {
                setTimeout(() => {
                    setFilledStars((prevStars) => prevStars + 1);
                }, 400);
            }
        };

        fillStars();
    }, [filledStars]);

    return (
        <>
            <div className="h-screen py-20 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1533473359331-0135ef1b58bf')" }}>
                {/* <div className="flex flex-col mx-auto justify-center lg:ml-[20%] max-w-[90%] lg:max-w-[80%]"> */}
                {/* <div className="mt-8 flex max-w-max items-center space-x-2 rounded-full bg-gray-100 p-1 cursor-default">
                        <div className="rounded-full bg-green-100 p-1 px-2">
                            <p className="text-sm font-medium">Plan your trip now</p>
                        </div>
                        <p className="text-lg font-large pr-3">&rarr;</p>
                    </div> */}
                <BookForm />
            </div>
            {/* </div> */}
        </>
    )
}

export default Hero;
