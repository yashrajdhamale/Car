import { Spinner } from "@material-tailwind/react";
// import './spin.css'

const SpinnerComponent = ({ name }) => {

    return (
        <>
            <div className="flex flex-col items-center justify-center w-screen h-screen bg-gray-100">
                <div className="rounded-full p-8 bg-white shadow-lg animate-bounce">
                    <Spinner className="h-16 w-16 text-blue-500 animate-spin" />
                </div>
                <p className="mt-4 text-gray-700 text-lg font-semibold animate-pulse">{name}</p>
            </div>
            {/* <div className="loader flex justify-center items-center top-52 bg-black">
                <svg height="0" width="0" viewBox="0 0 64 64" class="absolute">
                    <defs class="s-xJBuHA073rTt" xmlns="http://www.w3.org/2000/svg">
                        <linearGradient class="s-xJBuHA073rTt" gradientUnits="userSpaceOnUse" y2="2" x2="0" y1="62" x1="0" id="b">
                            <stop class="s-xJBuHA073rTt" stop-color="#973BED"></stop>
                            <stop class="s-xJBuHA073rTt" stop-color="#007CFF" offset="1"></stop>
                        </linearGradient>
                        <linearGradient class="s-xJBuHA073rTt" gradientUnits="userSpaceOnUse" y2="0" x2="0" y1="64" x1="0" id="c">
                            <stop class="s-xJBuHA073rTt" stop-color="#FFC800"></stop>
                            <stop class="s-xJBuHA073rTt" stop-color="#F0F" offset="1"></stop>
                            <animateTransform repeatCount="indefinite" keySplines=".42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1" keyTimes="0; 0.125; 0.25; 0.375; 0.5; 0.625; 0.75; 0.875; 1" dur="8s" values="0 32 32;-270 32 32;-270 32 32;-540 32 32;-540 32 32;-810 32 32;-810 32 32;-1080 32 32;-1080 32 32" type="rotate" attributeName="gradientTransform"></animateTransform>
                        </linearGradient>
                        <linearGradient class="s-xJBuHA073rTt" gradientUnits="userSpaceOnUse" y2="2" x2="0" y1="62" x1="0" id="d">
                            <stop class="s-xJBuHA073rTt" stop-color="#00E0ED"></stop>
                            <stop class="s-xJBuHA073rTt" stop-color="#00DA72" offset="1"></stop>
                        </linearGradient>
                    </defs>
                </svg>

                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" height="64" width="64" class="inline-block">
                    <path stroke-linejoin="round" stroke-linecap="round" stroke-width="8" stroke="url(#b)" d="M 8,8 H 56 V 16 H 36 V 56 H 28 V 16 H 8 Z" class="dash" id="t" pathLength="360"></path>
                </svg>

                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" height="64" width="64" class="inline-block">
                    <path stroke-linejoin="round" stroke-linecap="round" stroke-width="8" stroke="url(#c)" d="M 8,8 H 36 C 45.941125,8 54,16.058875 54,26 C 54,35.941125 45.941125,44 36,44 H 28 V 56 H 20 V 8 Z M 28,36 H 36 C 41.522847,36 46,31.522847 46,26 C 46,20.477153 41.522847,16 36,16 H 28 Z" class="dash" id="r" pathLength="360"></path>
                </svg>

                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" height="64" width="64" class="inline-block">
                    <path stroke-linejoin="round" stroke-linecap="round" stroke-width="8" stroke="url(#d)" d="M 32,8 L 8,56 H 18 L 26,40 H 38 L 46,56 H 56 L 32,8 Z M 30,30 H 34 L 38,40 H 26 Z" class="dash" id="a" pathLength="360"></path>
                </svg>

                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" height="64" width="64" class="inline-block">
                    <path stroke-linejoin="round" stroke-linecap="round" stroke-width="8" stroke="url(#b)" d="M 8,8 L 32,56 L 56,8 H 44 L 32,40 L 20,8 Z" class="dash" id="v" pathLength="360"></path>
                </svg>

                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" height="64" width="64" class="inline-block">
                    <path stroke-linejoin="round" stroke-linecap="round" stroke-width="8" stroke="url(#c)" d="M 8,8 H 56 V 16 H 16 V 24 H 56 V 32 H 16 V 40 H 56 V 48 H 8 Z" class="dash" id="e" pathLength="360"></path>
                </svg>

                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" height="64" width="64" class="inline-block">
                    <path stroke-linejoin="round" stroke-linecap="round" stroke-width="8" stroke="url(#d)" d="M 8,8 H 16 V 56 H 56 V 48 H 16 V 8 Z" class="dash" id="l" pathLength="360"></path>
                </svg>

                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" height="64" width="64" class="inline-block">
                    <path stroke-linejoin="round" stroke-linecap="round" stroke-width="8" stroke="url(#b)" d="M 32,8 A 24,24 0 1 1 32,56 A 24,24 0 1 1 32,8 M 32,16 A 16,16 0 1 0 32,48 A 16,16 0 1 0 32,16 Z" class="dash" id="o" pathLength="360"></path>
                </svg>


                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" height="64" width="64" class="inline-block">
                    <path stroke-linejoin="round" stroke-linecap="round" stroke-width="8" stroke="url(#c)" d="M 32,8 A 24,24 0 1 1 8,32 H 16 A 16,16 0 1 0 32,48 A 16,16 0 1 0 32,8 M 32,32 V 24 H 48 V 32 H 32 Z" class="dash" id="g" pathLength="360"></path>
                </svg>

            </div> */}

        </>

    )
};

export default SpinnerComponent;