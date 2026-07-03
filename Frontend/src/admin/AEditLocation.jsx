import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Plus, ArrowBigRightDash } from "lucide-react"
import { Dialog, DialogHeader, DialogBody, DialogFooter, Button } from '@material-tailwind/react';
import { db , auth} from '@config/firebase.js';
import { collection, query, getDocs, getDoc, doc, addDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from 'firebase/auth';

const AEditLocation = () => {

    const Location_local = "kochi ";

    const location = useLocation();
    const { state } = location;
    const navigate = useNavigate();

    useEffect(() => {
        // Add an authentication observer
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is signed in
                // setUser(user);
                // console.log(user);
            } else {
                // User is signed out
                setUser(null);
                navigate('/admin/login')
            }
        });

        return () => unsubscribe();
    }, []);


    const [UniqueLocations, setUniqueLocations] = useState([null]);

    useEffect(() => {
        const fetchHolidays = async () => {
            try {
                const q = query(collection(db, "test"), where("role", "==", "ADMIN"));
                const querySnapshot = await getDocs(q);

                const locations = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    // console.log(data);
                    if (!locations.includes(data.location)) {
                        locations.push(data.location);
                    }
                });
                setUniqueLocations(locations);
                console.log(locations)

            } catch (error) {
                console.error('Error fetching holidays:', error);
            }
        };
        fetchHolidays();
    }, []);






    const [holidayData, setholidayData] = useState({
        location_id: "LJ2okzPyqhWRmT3BQfPB",
        include: "All parking routes, Morning Snacks",
        duration: [
            3,
            4
        ],
        images: [
            "https://a0.muscache.com/im/pictures/miso/Hosting-1074443584868984071/original/7f40d497-6831-4c82-8e50-3c653327125b.jpeg?im_w=960",
            "https://a0.muscache.com/im/pictures/miso/Hosting-1074443584868984071/original/40f64163-5368-4881-ab68-8ae658385e61.jpeg?im_w=720",
            "https://a0.muscache.com/im/pictures/miso/Hosting-1074443584868984071/original/0a139e7d-fe3f-4e7f-b5ab-4dfedd713eca.jpeg?im_w=1200",
            "https://a0.muscache.com/im/pictures/miso/Hosting-1074443584868984071/original/7347bbf4-9efb-41f3-a3f5-7b98c1c00720.jpeg?im_w=720",
            "https://a0.muscache.com/im/pictures/miso/Hosting-1074443584868984071/original/8867b6c2-46c8-4fc8-a9af-62defdd76f87.jpeg?im_w=1200",
            "https://a0.muscache.com/im/pictures/miso/Hosting-1074443584868984071/original/3e5e6fc9-f653-4acb-b33b-0afb5b1fd39d.jpeg?im_w=720"
        ],

        vehicle: [
            {
                "price": 2000,
                "guest_count": 2,
                "vehicle_name": "bike"
            },
            {
                "guest_count": 4,
                "vehicle_name": "Swift",
                "price": 300003
            },
            {
                "price": 40000,
                "vehicle_name": "Innova",
                "guest_count": 7
            },
            {
                "vehicle_name": "truck",
                "guest_count": 13,
                "price": 90000
            },
            {
                "guest_count": 40,
                "price": 50000,
                "vehicle_name": "bus"
            },
            {
                "vehicle_name": "tractor",
                "price": 909090,
                "guest_count": 50
            }
        ],
        description: "111This place includes beautifle scenary and this text is the description of  This place includes beautifle scenary and this text is the description of",
        location_description: "Kochi, nestled along the southwestern coast of India, captivates with its rich blend of cultural heritage and serene backwaters. Known for its historic Fort Kochi, vibrant spice markets, and tranquil houseboat cruises, Kochi offers a picturesque gateway to Kerala's diverse landscapes.",
        location: "kochi",
        itenary: [
            {
                "header": "Day 01 : Kochi – Munnar ",
                "description": "In the Afternoon, Arrive at Kochi Airport and then transfers to Munnar (Appr.3 hrs ) .Later check into hotel. Visit to to local sightseeing which includes Eco Point, Mattupetty Dam, Blossom Garden Parl Tata Tea Plantation, Kundala Lake, etc. Rest of the day at own leisure. Overnight stay in Munnar."
            },
            {
                "header": "Day 02 : Munnar",
                "description": "In the morning, proceed to visit Rajamalai and Eravikulam Wildlife Sanctuary famous for the Nilgiri Tahr and tea gardens,Devikulam,Attukal Dreamland Spice park Waterfalls etc. Overnight stay in Munnar. "
            },
            {
                "header": "Day 03 : Munnar –Alleppey",
                "description": "After having breakfast,in the hotel check out from hotel drive to Alleppey. On Arrival,check into Backwater Resort. Enjoy the beautiful view and nature of Kerala . Also visit to Marari Beach , Vembanand Lake and get to know why it calls ‘Gods Own Country”. Overnight stay in Alleppey."
            },
            {
                "description": "In the morning, after breakfast visit to Aruvikkuzhi Waterfall, Kumarakom Bird Sanctuary, Bay Island Driftwood Museum, Kumarakom Craft Museum, Juma Masjid etc. Back to Alleppey for overnight stay.",
                "header": "Day 04 : Alleppey – Kumarakom – Alleppey"
            },
            {
                "header": "Day 05 : Alleppey to Kochi sightseeing and then Departure.",
                "description": "After having breakfast, check out from resort and drive back to Kochi. In kochi visit to Bolgatty Palace ,Cherai Beach, Wonderla Amusement Park, Marine Drive,Willingdon Island etc. Later drop to airport for homeward journey. Tour End."
            }
        ],
        package_name: "3 Days 3 Night Munnar",
        km_limit: "450",
        selectedplan: {
            "VechileName": "Swift",
            "Price": 300003,
            "GuestCount": 4
        }
    });



    useEffect(() => {
        const fetchPackageData = async () => {
            try {
                const docRef = doc(db, "test", docId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    // Update state with fetched data
                    setholidayData(docSnap.data());
                    console.log('Updated', docSnap.data());
                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchPackageData();
    }, []);


    useEffect(() => {
        // console.log("hello world", holidayData);
    }, [holidayData]);




    const [isOpen, setIsOpen] = useState(false);
    // const [isOpenItnerary, setIsOpenItnerary] = useState(false);


    const [selectedQuestion, setSelectedQuestion] = useState(null);
    // const [selectedItenary, setSelectedItenary] = useState(null);


    const [originalVehicleName, setOriginalVehicleName] = useState('');
    const [originalItenary, setOriginalItenary] = useState('');
    const [BasicDetailsData, setBasicDetailsData] = useState({
        location: 'pppp',
        include: 'pppp',
        duration: [2, 3],
        description: 'pppp',
        package_name: 'pppp',
        km_limit: 750,
    });










    const addVechile = () => {
        setIsOpen(true);
        setSelectedQuestion({
            price: 0,
            guest_count: 0,
            vehicle_name: "name"
        });
    };

    const [selectedItenary, setSelectedItenary] = useState(null);
    const [isOpenItinerary, setIsOpenItinerary] = useState(false);

    const [selectedBasicDetails, setSelectedBasicDetails] = useState(null);
    const [isOpenBasicDetails, setIsOpenBasicDetails] = useState(false);

    const addItenary = () => {
        setIsOpenItinerary(true);
        setSelectedItenary({
            header: '',
            description: '',
        });
    };



    const handleEdit = (item) => {
        console.log(item);
        setIsOpen(true);
        setOriginalVehicleName(item.vehicle_name);
        setSelectedQuestion(item);
    };





    const handleSubmit = () => {
        // Find the existing vehicle object based on vehicle_name
        const existingVehicleIndex = holidayData.vehicle.findIndex(
            (vehicle) => vehicle.vehicle_name === originalVehicleName
        );

        if (existingVehicleIndex !== -1) {
            // Update the existing vehicle object directly
            setholidayData((prevState) => ({
                ...prevState,
                vehicle: prevState.vehicle.map((vehicle, index) =>
                    index === existingVehicleIndex
                        ? {
                            ...vehicle,
                            vehicle_name: selectedQuestion.vehicle_name, // Update the vehicle_name
                            price: selectedQuestion.price,
                            guest_count: selectedQuestion.guest_count,
                        }
                        : vehicle
                ),
            }));
        } else {
            // Add a new vehicle object
            setholidayData((prevState) => ({
                ...prevState,
                vehicle: [...prevState.vehicle, selectedQuestion],
            }));
        }

        setIsOpen(false);
    };


    const handleSubmitItinerary = () => {

        // const existingItenaryIndex = holidayData.itenary.findIndex(
        //     (Itenary) => Itenary.header === originalItenary
        // );

        if (selectedItenary) {
            const updatedItenary = [...holidayData.itenary];
            const index = updatedItenary.findIndex(item => item.header === originalItenary);
            if (index !== -1) {
                // Editing existing itinerary item
                updatedItenary[index] = selectedItenary;
            } else {
                // Adding new itinerary item
                updatedItenary.push(selectedItenary);
            }
            setholidayData(prevState => ({
                ...prevState,
                itenary: updatedItenary
            }));
        }
        setIsOpenItinerary(false);
    };

    const handleEditItenary = (item) => {
        console.log('handleEditItenary', item);
        setSelectedItenary(item);
        setOriginalItenary(item.header)
        setIsOpenItinerary(true);
    };





    const handleSubmitBasicDetails = () => {


        setIsOpenBasicDetails(false);
    };

    const handleEditBasicDetails = () => {
        setIsOpenBasicDetails(true);
    };





    const EditPackage = () => {
        // Reference to the specific document using its ID
        const documentRef = doc(db, 'test', docId);

        const newData = holidayData;
        // Update the document with the new data
        return updateDoc(documentRef, newData)
            .then(() => {
                console.log("Document successfully updated!");
                // return true; // Return true indicating successful update
            })
            .catch((error) => {
                console.error("Error updating document: ", error);
                // return false; // Return false indicating failure
            });
    };







    const [pickupInputTupe, setPickupInputType] = useState("date");
    const pickupText = () => {
        setPickupInputType('text');
    }


    const pickupDate = () => {
        setPickupInputType('date');
    }

    const handlePickupDateChange = (e) => {
        setPickupInputType(e.target.value);
    };

    const [dropoffInputTupe, setDropOffInputType] = useState("date");
    const dropoffText = () => {
        setDropOffInputType('text')
    }
    const dropOffDate = () => {
        setDropOffInputType('date')
    }


    const handleDropupDateChange = (e) => {
        setDropOffInputType(e.target.value);
    };



    const handleChange = (e, index) => {
        const { value } = e.target;
        setholidayData(prevState => {
            // Update the URL in the corresponding index of the images array
            const updatedImages = [...prevState.images];
            updatedImages[index] = value;
            return { ...prevState, images: updatedImages };
        });
    };


    return (
        <div className='flex justify-center items-center'>

            {/* Vehicle POPUP */}
            <Dialog size={"xxl"} open={isOpen} handler={() => setIsOpen(false)} className="h-xl overflow-scroll">
                <DialogHeader className="text-black px-6 py-4 text-xl font-semibold">Add/Edit Question</DialogHeader>
                <DialogBody className="px-6 py-4">
                    <label htmlFor="questionInput" className="block text-md font-bold text-black mb-2">Vehicle Name</label>
                    <input
                        id="questionInput"
                        type="text"
                        placeholder="Enter your question here"
                        value={selectedQuestion ? selectedQuestion.vehicle_name : ''}
                        onChange={e => setSelectedQuestion(prevState => ({ ...prevState, vehicle_name: e.target.value }))}
                        className="w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 mb-4 focus:outline-none focus:border-blue-500"
                    />

                    <label htmlFor="answerSelect" className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                    <input
                        id="questionInput"
                        type="number"
                        placeholder="Enter your question here"
                        value={selectedQuestion ? selectedQuestion.price : ''}
                        onChange={e => setSelectedQuestion(prevState => ({ ...prevState, price: e.target.value }))}
                        className="w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 mb-4 focus:outline-none focus:border-blue-500"
                    />



                    <label htmlFor="answerSelect" className="block text-sm font-medium text-gray-700 mb-2">Guest Count</label>
                    <input
                        id="questionInput"
                        type="number"
                        placeholder="Enter your question here"
                        value={selectedQuestion ? selectedQuestion.guest_count : ''}
                        onChange={e => setSelectedQuestion(prevState => ({ ...prevState, guest_count: e.target.value }))}
                        className="w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 mb-4 focus:outline-none focus:border-blue-500"
                    />




                </DialogBody>
                <DialogFooter className="px-6 py-4 bg-gray-50 flex justify-end rounded-lg">
                    <Button
                        variant="text"
                        color="red"
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-2 rounded-md bg-red-500 text-white mr-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="gradient"
                        color="green"
                        onClick={handleSubmit}
                        className="px-4 py-2 rounded-md text-black hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        Confirm
                    </Button>
                </DialogFooter>
            </Dialog>





            {/* INTENARY POPUP */}
            <Dialog size={"xxl"} open={isOpenItinerary} handler={() => setIsOpenItinerary(false)} className="h-xl overflow-scroll">
                <DialogHeader className="text-black px-6 py-4 text-xl font-semibold">Add/Edit Itenary</DialogHeader>
                <DialogBody className="px-6 py-4">
                    <label htmlFor="questionInput" className="block text-md font-bold text-black mb-2">Itnerary Headings {' '} {' '} {"[ e.g: DAY 01: TEXT ]"}</label>
                    <input
                        id="questionInput"
                        type="text"
                        placeholder="Enter your question here"
                        value={selectedItenary ? selectedItenary.header : ''}
                        onChange={e => setSelectedItenary(prevState => ({ ...prevState, header: e.target.value }))}
                        className="w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 mb-4 focus:outline-none focus:border-blue-500"
                    />

                    <label htmlFor="answerSelect" className="block text-md font-bold text-black mb-2">Itnerary Description</label>
                    <input
                        id="questionInput"
                        type="text"
                        placeholder="Enter your question here"
                        value={selectedItenary ? selectedItenary.description : ''}
                        onChange={e => setSelectedItenary(prevState => ({ ...prevState, description: e.target.value }))}
                        className="w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 mb-4 focus:outline-none focus:border-blue-500"
                        style={{ height: '120px' }} // Adjust the height as needed
                    />




                </DialogBody>
                <DialogFooter className="px-6 py-4 bg-gray-50 flex justify-end rounded-lg">
                    <Button
                        variant="text"
                        color="red"
                        onClick={() => setIsOpenItinerary(false)}
                        className="px-4 py-2 rounded-md bg-red-500 text-white mr-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="gradient"
                        color="green"
                        onClick={handleSubmitItinerary}
                        className="px-4 py-2 rounded-md text-black hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        Confirm
                    </Button>
                </DialogFooter>
            </Dialog>


            {/* BASIC DETAILS */}
            <Dialog size={"xxl"} open={isOpenBasicDetails} handler={() => setIsOpenBasicDetails(false)} className="h-xl overflow-scroll">
                <DialogHeader className="text-black px-6 py-4 text-xl font-semibold">Add/Edit Basic Details</DialogHeader>
                <DialogBody className="px-6 py-4">
                    <label htmlFor="questionInput" className="block text-md font-bold text-black mb-2">Location</label>
                    {/* <input
                        id="questionInput"
                        type="text"
                        placeholder="Enter your question here"
                        value={holidayData ? holidayData.location : ''}
                        onChange={e => setholidayData(prevState => ({ ...prevState, location: e.target.value }))}
                        className="w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 mb-4 focus:outline-none focus:border-blue-500"
                    /> */}

                    <select
                        id="answerSelect"
                        value={holidayData.location} // Use the value from state
                        onChange={e => setholidayData(prevState => ({ ...prevState, location: e.target.value }))}
                        className="w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 mb-4 focus:outline-none focus:border-blue-500"
                    >
                        <option value="">Select location</option>
                        {UniqueLocations.map((option, optionIndex) => (
                            <option key={optionIndex} value={option}>{option}</option>
                        ))}
                    </select>


                    <label htmlFor="questionInput" className="block text-md font-bold text-black mb-2">Package Name</label>
                    <input
                        id="questionInput"
                        type="text"
                        placeholder="Enter your question here"
                        value={holidayData ? holidayData.package_name : ''}
                        onChange={e => setholidayData(prevState => ({ ...prevState, location: e.target.value }))}
                        className="w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 mb-4 focus:outline-none focus:border-blue-500"
                    />


                    <label htmlFor="questionInput" className="block text-md font-bold text-black mb-2">Duration</label>
                    <div className='flex justify-between gap-2 w-80'>


                        <input
                            id="durationInput1"
                            type="number"
                            placeholder="Enter duration 1 here"
                            value={holidayData ? holidayData.duration[0] : ''}
                            onChange={e =>
                                setholidayData(prevState => ({
                                    ...prevState,
                                    duration: [e.target.value, holidayData.duration[1]] // Update the duration array with the new value of the first element
                                }))
                            }
                            className="w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 mb-4 focus:outline-none focus:border-blue-500"
                        />

                        <input
                            id="durationInput2"
                            type="number"
                            placeholder="Enter duration 2 here"
                            value={holidayData ? holidayData.duration[1] : ''}
                            onChange={e =>
                                setholidayData(prevState => ({
                                    ...prevState,
                                    duration: [holidayData.duration[0], e.target.value] // Update the duration array with the new value of the second element
                                }))
                            }
                            className="w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 mb-4 focus:outline-none focus:border-blue-500"
                        />



                    </div>


                    <label htmlFor="questionInput" className="block text-md font-bold text-black mb-2">Description</label>
                    <input
                        id="questionInput"
                        type="text"
                        placeholder="Enter location description"
                        value={holidayData ? holidayData.description : ''}
                        onChange={e => setholidayData(prevState => ({ ...prevState, description: e.target.value }))}
                        className="w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 mb-4 focus:outline-none focus:border-blue-500"
                    />

                    <label htmlFor="questionInput" className="block text-md font-bold text-black mb-2">KM Limit</label>
                    <input
                        id="questionInput"
                        type="number"
                        placeholder="Enter location description"
                        value={holidayData ? holidayData.km_limit : ''}
                        onChange={e => setholidayData(prevState => ({ ...prevState, km_limit: e.target.value }))}
                        className="w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 mb-4 focus:outline-none focus:border-blue-500"
                    />


                    <label htmlFor="questionInput" className="block text-md font-bold text-black mb-2">INLCUDES</label>
                    <input
                        id="questionInput"
                        type="text"
                        placeholder="Enter location description"
                        value={holidayData ? holidayData.include : ''}
                        onChange={e => setholidayData(prevState => ({ ...prevState, include: e.target.value }))}
                        className="w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 mb-4 focus:outline-none focus:border-blue-500"
                    />





                </DialogBody>
                <DialogFooter className="px-6 py-4 bg-gray-50 flex justify-end rounded-lg">
                    <Button
                        variant="text"
                        color="red"
                        onClick={() => setIsOpenBasicDetails(false)}
                        className="px-4 py-2 rounded-md bg-red-500 text-white mr-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="gradient"
                        color="green"
                        onClick={handleSubmitBasicDetails}
                        className="px-4 py-2 rounded-md text-black hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        Confirm
                    </Button>
                </DialogFooter>
            </Dialog>

            <div className="overflow-hidden  w-full m-10">
                {/* <div className="mb-4 flex items-center rounded-lg py-2">
                    <div className="flex flex-1">
                        <p className="text-2xl font-bold ">
                            Test Details
                        </p>
                    </div>
                </div> */}

                <div className="my-5 flex items-center justify-between lg:flex-row flex-col py-2">
                    <div className="flex">
                        <p className="text-2xl font-bold ">
                            Holiday Package Details
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={EditPackage}
                        className="bg-green-400 text-white  flex items-center gap-2 px-3 py-2 rounded-lg  transition-transform duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-md"

                    >
                        Edit Package <ArrowBigRightDash />
                        {/* <Plus size={20} /> */}
                    </button>
                </div>


                {/* <div className='flex w-full gap-5 flex-col lg:flex-row '>
                    <div className='border-2 rounded-lg p-5 w-full'>
                        <p className="p-2 text-lg font-bold">Test Information</p>
                        <div className="w-full">
                            <label
                                className="text-md font-medium"
                                htmlFor="Name"
                            >
                                Test title
                            </label>
                            <input
                                className="flex hover:bg-yellow-50 hover:text-lg hover:font-bold h-10 w-full rounded-md border border-black/30 bg-transparent px-3 py-2 text-md placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                type="text"
                                placeholder="Enter test name"
                                id="Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}

                            ></input>
                        </div>
                        <div className="w-full">
                            <label
                                className="text-md font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                htmlFor="EmailID"
                            >
                                Test Duration
                            </label>
                            <input
                                className="flex h-10 w-full hover:bg-yellow-50 hover:text-lg hover:font-bold rounded-md border border-black/30 bg-transparent px-3 py-2 text-md placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                type="text"
                                placeholder="Enter test duration ( minutes )"
                                id="duration"
                                name="duration"
                                value={formData.duration}
                                onChange={handleChange}
                            ></input>
                        </div>
                    </div>
                    <div className='border-2 rounded-lg p-5 w-full'>
                        <p className="p-2 text-lg font-bold ">Choose Exam Dates:</p>
                        <div className="w-full">
                            <label
                                className="text-md font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                htmlFor="start-date"
                            >
                                Exam Start Date
                            </label>
                            <input
                                type="date"
                                id="examStartDate"
                                placeholder="Pick Up Date"
                                className="flex h-10 w-full hover:bg-yellow-50 hover:text-lg hover:font-bold rounded-md border border-black/30 bg-transparent px-3 py-2 text-md placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                name="examStartDate"
                                value={formData.examStartDate}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="w-full">
                            <label
                                className="text-md font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                htmlFor="end-date"
                            >
                                Exam End Date
                            </label>
                            <input
                                type="date"
                                id="end-date"
                                placeholder="Pick Up Date"
                                className="flex h-10 w-full 
                                hover:bg-yellow-50 hover:text-lg hover:font-bold
                                rounded-md border border-black/30 bg-transparent px-3 py-2 text-md placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                name="examEndDate"
                                value={formData.examEndDate}
                                onChange={handleChange}

                            />
                        </div>
                    </div>
                    <div className='border-2 rounded-lg p-5 w-full'>
                        <p className="p-2 text-lg font-bold">Marking</p>
                        <div className="w-full">
                            <label
                                className="text-md font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                htmlFor="total-marks"
                            >
                                Total Marks
                            </label>
                            <input
                                className="flex h-10 w-full 
                                hover:bg-yellow-50 hover:text-lg hover:font-bold
                                rounded-md border border-black/30 bg-transparent px-3 py-2 text-md placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                type="number"
                                placeholder="Enter Total Marks"
                                id="total-marks"
                                name="totalmarks"
                                value={formData.totalmarks}
                                onChange={handleChange}

                            ></input>
                        </div>

                        <div className="w-full">
                            <label
                                className="text-md font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                htmlFor="active"
                            >
                                Active
                            </label>
                            <select
                                id="active"
                                className="flex h-10 w-full hover:bg-yellow-50 hover:text-lg hover:font-bold rounded-md border border-black/30 bg-transparent px-3 py-2 text-md placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                name="active"
                                value={formData.active}
                                onChange={handleChange}
                            >
                                <option value={true} className={`  ${formData.active === 'true' ? 'bg-green-100 text-black' : ''}`} >True</option>
                                <option value={false}
                                    className={`  ${formData.active === 'false' ? 'bg-green-100 text-black' : ''}`}
                                >False</option>
                            </select>
                        </div>
                    </div>



                </div> */}


                <div className='border-2 p-5 shadow-md'>
                    <table className="w-full border border-black">
                        <tbody>
                            {/* Personal Details Section */}
                            <tr>
                                <th colSpan="2" className="p-2 text-lg font-bold border border-black bg-gray-200">


                                    {/* <div className='my-5 flex items-center justify-between lg:flex-row flex-col py-2'> */}

                                    Basic Details
                                    <div className='flex justify-end'>
                                        {/* Use justify-end to align items to the right */}


                                        <button
                                            type="button"
                                            onClick={handleEditBasicDetails}
                                            className="bg-black text-sm text-white flex items-center gap-2 px-3 py-2 rounded-lg  transition-transform duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-md"
                                        >
                                            Edit Basic Details <Plus size={20} />
                                        </button>
                                    </div>
                                    {/* </div> */}


                                </th>
                            </tr>


                            <tr className='hover:bg-yellow-100'>
                                <th className="p-2 text-lg font-bold border border-black">location</th>
                                <td className="text-lg font-bold border border-black w-1/2 text-center">
                                    {holidayData.location}
                                </td>
                            </tr>

                            <tr className='hover:bg-yellow-100'>
                                <th className="p-2 text-lg font-bold border border-black">Package Name</th>
                                <td className="text-lg font-bold border border-black w-1/2 text-center">
                                    {holidayData.package_name}

                                </td>
                            </tr>

                            <tr className='hover:bg-yellow-100'>
                                <th className="p-2 text-lg font-bold border border-black">description</th>
                                <td className="text-lg font-bold border border-black w-1/2 p-3">
                                    {/* {"Kochi, nestled along the southwestern coast of India, captivates with its rich blend of cultural heritage and serene backwaters. Known for its historic Fort Kochi, vibrant spice markets, and tranquil houseboat cruises, Kochi offers a picturesque gateway to Kerala's diverse landscapes."} */}
                                    {holidayData.description}
                                </td>
                            </tr>

                            {/* <tr>
                                <th colSpan="2" className="p-2 text-lg font-bold border border-black bg-gray-200">
                                    Contact
                                </th>
                            </tr> */}


                            <tr className='hover:bg-yellow-100'>
                                <th className="p-2 text-lg font-bold border border-black">Duration</th>
                                <td className="text-lg font-bold border border-black w-1/2 text-center">
                                    {/* {"3 DAYS 4 NIGHTS"} */}
                                    {holidayData.duration[0] + " DAYS " + holidayData.duration[1] + " NIGHTS "}
                                </td>
                            </tr>
                            <tr className='hover:bg-yellow-100'>
                                <th className="p-2 text-lg font-bold border border-black">km_limit</th>
                                <td className="text-lg font-bold border border-black w-1/2 text-center">
                                    {/* {"750 K/M"} */}
                                    {holidayData.km_limit}
                                </td>
                            </tr>

                            <tr className='hover:bg-yellow-100'>
                                <th className="p-2 text-lg font-bold border border-black">include
                                </th>
                                <td className="text-lg font-bold border border-black w-1/2 text-center">
                                    {/* {"All parking routes, Morning Snacks"} */}
                                    {holidayData.include}
                                </td>
                            </tr>


                        </tbody>
                    </table>





                </div>





                <div className="my-5 flex items-center justify-between lg:flex-row flex-col py-2">
                    <div className="flex">
                        <p className="text-2xl font-bold ">
                            Vehicle Details
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={addVechile}
                        // className="bg-black text-white flex items-center gap-2 px-3 py-2 rounded-lg"
                        className="bg-black text-white flex items-center gap-2 px-3 py-2 rounded-lg  transition-transform duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-md"

                    >
                        Add Vehicle <Plus size={20} />
                    </button>
                </div>


                <div className='border-2 p-5 shadow-md'>
                    <table className="w-full border border-black">
                        <thead>
                            <tr className='bg-gray-200'>
                                <th className="text-lg font-bold border border-black w-20">Sr. No.</th>
                                <th className="p-2 text-lg font-bold border border-black">Vehicle</th>
                                <th className="p-2 text-lg font-bold border border-black">Price</th>
                                <th className="p-2 text-lg font-bold border border-black">GuestCount</th>
                                <th className="p-2 text-lg font-bold border border-black">Action</th>

                            </tr>
                        </thead>
                        <tbody>
                            {holidayData.vehicle.map((item, index) => (
                                <tr key={index}>
                                    <td className="border border-black">{index + 1}</td>
                                    <td className="p-2 border border-black">{item.vehicle_name}</td>
                                    <td className="p-2 border border-black">{item.price}</td>
                                    <td className="p-2 border border-black">{item.guest_count}</td>
                                    <td className='border border-black flex items-center justify-center p-1'>
                                        <button
                                            className="px-5 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            onClick={() => handleEdit(item)}
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>









                <div className="my-5 flex items-center justify-between lg:flex-row flex-col py-2">
                    <div className="flex">
                        <p className="text-2xl font-bold ">
                            Itnerary Details
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={addItenary}
                        // className="bg-black text-white flex items-center gap-2 px-3 py-2 rounded-lg"
                        className="bg-black text-white flex items-center gap-2 px-3 py-2 rounded-lg  transition-transform duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-md"

                    >
                        Add Itnerarary <Plus size={20} />
                    </button>
                </div>


                <div className='border-2 p-5 shadow-md'>
                    <table className="w-full border border-black">
                        <thead>
                            <tr className='bg-gray-200'>
                                <th className="text-lg font-bold border border-black w-20">Sr. No.</th>
                                <th className="p-2 text-lg font-bold border border-black">Itnerary Heading</th>
                                <th className="p-2 text-lg font-bold border border-black">Itnerary Description</th>
                                <th className="p-2 text-lg font-bold border border-black">Action</th>

                            </tr>
                        </thead>
                        <tbody>
                            {holidayData.itenary.map((item, index) => (
                                <tr key={index}>
                                    <td className="border border-black">{index + 1}</td>
                                    <td className="p-2 border border-black">{item.header}</td>
                                    <td className="p-2 border border-black first-letter">{item.description}</td>
                                    <td className='border border-black flex items-center justify-center p-1'>
                                        <button
                                            className="px-5 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            onClick={() => handleEditItenary(item)}
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>




                <div className="my-5 flex items-center justify-between lg:flex-row flex-col py-2">
                    <div className="flex">
                        <p className="text-2xl font-bold ">
                            Image Gallery
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={addItenary}
                        // className="bg-black text-white flex items-center gap-2 px-3 py-2 rounded-lg"
                        className="bg-black text-white flex items-center gap-2 px-3 py-2 rounded-lg  transition-transform duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-md"

                    >
                        Add Image <Plus size={20} />
                    </button>
                </div>


                <div className='border-2'>
                    <table className="w-full border border-black">
                        <thead>
                            <tr className='bg-gray-200'>
                                <th className="p-2 text-lg font-bold border border-black">Image Link</th>
                                <th className="p-2 text-lg font-bold border border-black">Image</th>

                            </tr>
                        </thead>
                        <tbody>
                            {holidayData.images.map((image, index) => (
                                <tr key={index}>
                                    <td className="text-lg font-bold border border-black w-1/2 text-center">
                                        <input
                                            type="text"
                                            className="bg-red-200 py-2 w-[90%] rounded-lg"
                                            id={`image_link_${index}`}
                                            value={image || ''} // Set the value from the state
                                            onChange={e => handleChange(e, index)} // Pass the index to handleChange function
                                            placeholder="Enter image URL"
                                        />
                                    </td>
                                    <td className="text-lg font-bold border border-black w-1/2 text-center">
                                        <div className="w-full rounded-md px-3 py-2 text-sm placeholder:text-gray-600 text-center justify-center items-center">
                                            <img
                                                className="w-40 h-40 object-cover object-center items-center justify-center"
                                                src={image}
                                                alt={`Image ${index}`}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>

                    </table>
                </div>



            </div>
        </div>
    )
}

export default AEditLocation