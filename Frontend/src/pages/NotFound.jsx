import { ArrowLeft } from 'lucide-react'
import React from 'react'
import { useNavigate } from 'react-router-dom'

const NotFound = () => {

    const navigate = useNavigate();
    const goToDashboard = () => {
        navigate("/");
    }

    return (
        <div className='w-screen h-screen flex items-center justify-center'>
            <div className="lg:flex lg:items-center lg:space-x-10 border-2 border-black p-10 rounded-xl ">
                <img
                    src="https://illustrations.popsy.co/white/resistance-band.svg"
                    alt="question-mark"
                    className="h-[300px] w-auto"
                />
                <div>
                    <p className="mt-6 text-4xl font-semibold text-black">404 error</p>
                    <h1 className="mt-3 text-lg font-semibold text-gray-800 md:text-lg">
                        We can&apos;t find that page
                    </h1>
                    <p className="mt-4 text-gray-500">
                        Sorry, the page you are looking for doesn&apos;t exist or has been moved.
                    </p>
                    <div className="mt-6 flex items-center space-x-3">
                        <button
                            type="button"
                            className="inline-flex items-center rounded-md border border-black px-3 py-2 text-sm font-semibold text-black shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                            onClick={goToDashboard}
                        >
                            <ArrowLeft size={16} className="mr-2" />
                            Go to Dashboard
                        </button>
                        <button
                            type="button"
                            className="rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                        >
                            Contact us
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default NotFound