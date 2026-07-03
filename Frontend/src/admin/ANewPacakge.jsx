import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Plus, ArrowBigRightDash } from "lucide-react"
import { Dialog, DialogHeader, DialogBody, DialogFooter, Button } from '@material-tailwind/react';
import { db, auth, storage } from '@config/firebase.js';
import { collection, query, getDocs, getDoc, doc, addDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { AuthCheck } from '@components';

// NOTIFICATION
import { useNotification } from '../context/NotificationContext';

const ANewPacakge = () => {

    const { addNotification } = useNotification();

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


    // const docId = "LJ2okzPyqhWRmT3BQfPB";

    const location = useLocation();
    const { state } = location;
    const navigate = useNavigate();
    const [UniqueLocations, setUniqueLocations] = useState([null])




    const [holidayData, setholidayData] = useState({
        location_id: "",
        include: "",
        duration: [
            0,
            0
        ],
        images: [],
        vehicle: [],
        package_name: "",
        km_limit: "",
        description: "",
        location_description: "",
        location: "",
        itenary: [],
    });



    useEffect(() => {
        const fetchHolidays = async () => {
            try {
                const q = query(collection(db, "test"));
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





    const [isOpen, setIsOpen] = useState(false);
    // const [isOpenItnerary, setIsOpenItnerary] = useState(false);


    const [selectedQuestion, setSelectedQuestion] = useState(null);
    // const [selectedItenary, setSelectedItenary] = useState(null);


    const [originalVehicleName, setOriginalVehicleName] = useState('');
    const [originalItenary, setOriginalItenary] = useState('');
    const [BasicDetailsData, setBasicDetailsData] = useState({
        location: '1111',
        include: '11111',
        duration: [111, 111],
        description: '111',
        package_name: '111',
        km_limit: 750,
    });










    const addVechile = () => {
        setIsOpen(true);
        setSelectedQuestion({
            price: null,
            guest_count: null,
            vehicle_name: ""
        });
    };

    const [selectedItenary, setSelectedItenary] = useState(null);
    const [isOpenItinerary, setIsOpenItinerary] = useState(false);

    const [selectedImage, setSelectedImage] = useState([null]);
    // const [isOpenImage, setIsOpenImage] = useState(false);
    const [OriginalImage, setOriginalImage] = useState(null);


    // const [uploadData, setUploadData] = useState(false);
    const [selectedImages, setSelectedImages] = useState([]);


    const [selectedBasicDetails, setSelectedBasicDetails] = useState(null);
    const [isOpenBasicDetails, setIsOpenBasicDetails] = useState(false);

    const addItenary = () => {
        setIsOpenItinerary(true);
        setSelectedItenary({
            header: '',
            description: '',
        });
    };

    // const addImage = () => {
    //     setFileUploadUrl("https://media.istockphoto.com/id/1222357475/vector/image-preview-icon-picture-placeholder-for-website-or-ui-ux-design-vector-illustration.jpg?s=612x612&w=0&k=20&c=KuCo-dRBYV7nz2gbk4J9w1WtTAgpTdznHu55W9FjimE=")
    //     setIsOpenImage(true);
    //     setSelectedImage({
    //         image_link: 'https://media.istockphoto.com/id/1222357475/vector/image-preview-icon-picture-placeholder-for-website-or-ui-ux-design-vector-illustration.jpg?s=612x612&w=0&k=20&c=KuCo-dRBYV7nz2gbk4J9w1WtTAgpTdznHu55W9FjimE='
    //     });
    // };



    //ADD IMAGE LOGIC STARTS

    const [isOpenImage, setIsOpenImage] = useState(false);
    const [fileUploadUrls, setFileUploadUrls] = useState([]);
    const [uploadData, setuploadData] = useState(false);
    const [FileUploadUrl, setFileUploadUrl] = useState("https://media.istockphoto.com/id/1222357475/vector/image-preview-icon-picture-placeholder-for-website-or-ui-ux-design-vector-illustration.jpg?s=612x612&w=0&k=20&c=KuCo-dRBYV7nz2gbk4J9w1WtTAgpTdznHu55W9FjimE=");


    const generateRandomName = () => {
        return Math.random().toString(36).substring(2, 15);
    };

    const uploadImageToFirebaseStorage = async (file) => {
        try {
            // Create a storage reference
            const randomName = generateRandomName();
            const storageRef = ref(storage, `Holiday_Images/image_${randomName}`);

            // Upload the file to Firebase Storage
            await uploadBytes(storageRef, file);

            // Get the download URL of the uploaded image
            const downloadURL = await getDownloadURL(storageRef);

            // Return the download URL
            return downloadURL;
        } catch (error) {
            console.error("Error uploading image to Firebase Storage: ", error);
            throw error; // Rethrow the error
        }
    };

    const [ImageGalleryDisabled, setImageGalleryDisabled] = useState(false);

    const handleFileUpload = async (event) => {

        setImageGalleryDisabled(true);
        if (ImageGalleryDisabled == true) {
            alert("First Confirm then Upload New Images");
        }
        else {

            const files = event.target.files;
            const uploadPromises = Array.from(files).map(file => uploadImageToFirebaseStorage(file));

            try {
                setuploadData(true);
                const urls = await Promise.all(uploadPromises);
                setFileUploadUrls(prevUrls => [...prevUrls, ...urls]);
                setuploadData(false);
            } catch (error) {
                console.error("Error uploading image: ", error);
                setuploadData(false);
            }
        }

    };


    const handleSubmitImage = () => {
        if (fileUploadUrls.length === 0) {
            alert("Upload Image");
            return;
        }

        const uniqueUrls = fileUploadUrls.filter(url => !holidayData.images.includes(url));

        if (uniqueUrls.length === 0) {
            alert('All uploaded images are duplicates. Please upload different images.');
            return;
        }

        setholidayData(prevState => ({
            ...prevState,
            images: [...prevState.images, ...uniqueUrls]
        }));

        setIsOpenImage(false);
        setFileUploadUrls([]);
    };


    // ADD IMAGE LOGIC ENDS

    const addImage = () => {
        setIsOpenImage(true);
    };



    const handleEdit = (item) => {
        // console.log(item);
        setIsOpen(true);
        // setOriginalVehicleName(item.vehicle_name);
        // setSelectedQuestion(item);
    };







    const [inputText, setInputText] = useState('');
    const [itinerary2, setItinerary] = useState({ cleanedHeadings: [], cleanedDescriptions: [] });

    const handleExtract = () => {
        const result = extractItinerary(inputText);
        setItinerary(result);
    };

    const handleHeaderChange = (index, value) => {
        const updatedHeadings = [...itinerary2.cleanedHeadings];
        updatedHeadings[index] = value;
        setItinerary({ ...itinerary2, cleanedHeadings: updatedHeadings });
    };

    const handleDescriptionChange = (index, value) => {
        const updatedDescriptions = [...itinerary2.cleanedDescriptions];
        updatedDescriptions[index] = value;
        setItinerary({ ...itinerary2, cleanedDescriptions: updatedDescriptions });
    };


    const extractItinerary = (text) => {
        const headingPattern = /Day \d+[^:]*: [^\n]+/g;
        const descriptionPattern = /(?<=:)[^:]*?(?=(Day \d+|$|Tour End))/gs;

        const headings = text.match(headingPattern) || [];
        let descriptions = text.match(descriptionPattern) || [];

        // Clean descriptions: remove extra new lines and spaces, then filter out empty descriptions
        const cleanedDescriptions = descriptions
            .map(description => description.replace(/\n+/g, ' ').trim())
            .filter(description => description.length > 0);

        // Filter out empty headings
        const cleanedHeadings = headings.filter(heading => heading !== '');

        return {
            cleanedHeadings,
            cleanedDescriptions
        };
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

        // console.log(selectedItenary);

        // if (selectedItenary) {
        //     const updatedItenary = [...holidayData.itenary];
        //     const index = updatedItenary.findIndex(item => item.header === originalItenary);
        //     if (index !== -1) {
        //         // Editing existing itinerary item
        //         updatedItenary[index] = selectedItenary;
        //     } else {
        //         // Adding new itinerary item
        //         updatedItenary.push(selectedItenary);
        //     }
        //     setholidayData(prevState => ({
        //         ...prevState,
        //         itenary: updatedItenary
        //     }));
        // }


        const transformed = itinerary2.cleanedHeadings.map((header, index) => ({
            header,
            description: itinerary2.cleanedDescriptions[index],
        }));

        console.log('================================');
        console.log(transformed);



        setholidayData(prevState => ({
            ...prevState,
            itenary: transformed
        }));

        setIsOpenItinerary(false);
    };

    const handleEditItenary = (item) => {
        console.log('handleEditItenary', item);
        setSelectedItenary(item);
        setOriginalItenary(item.header)
        setIsOpenItinerary(true);
    };



    // const handleChangeImage = (e, index) => {
    //     console.log(e);
    //     console.log('before', holidayData.images);
    //     const newImages = [...holidayData.images]; // Create a copy of the images array
    //     newImages[index] = e.target.value; // Update the image link at the specified index
    //     setholidayData(prevState => ({ ...prevState, images: newImages })); // Update holidayData state
    //     console.log('after', holidayData.images);
    // };





    const handleSubmitBasicDetails = () => {


        setIsOpenBasicDetails(false);
    };

    const handleEditBasicDetails = () => {
        setIsOpenBasicDetails(true);
    };


    // const handleSubmitImage = () => {

    //     if (FileUploadUrl === "https://media.istockphoto.com/id/1222357475/vector/image-preview-icon-picture-placeholder-for-website-or-ui-ux-design-vector-illustration.jpg?s=612x612&w=0&k=20&c=KuCo-dRBYV7nz2gbk4J9w1WtTAgpTdznHu55W9FjimE=") {
    //         // alert("Upload Image");
    //         addNotification("Upload Image", "error")
    //         return;
    //     };

    //     if (selectedImage.image_link.trim() === '' && selectedImage.image_link == 'https://media.istockphoto.com/id/1222357475/vector/image-preview-icon-picture-placeholder-for-website-or-ui-ux-design-vector-illustration.jpg?s=612x612&w=0&k=20&c=KuCo-dRBYV7nz2gbk4J9w1WtTAgpTdznHu55W9FjimE=') {
    //         alert('Please enter a valid image link');
    //         return; // Exit the function if the image link is empty
    //     }

    //     if (holidayData.images.includes(selectedImage.image_link)) {
    //         alert('Duplicate image link. Please enter a different one.');
    //         return; // Exit the function if the image link is a duplicate
    //     }

    //     // if (holidayData.images.length >= 6) {
    //     //     alert('Maximum number of images reached (6).');
    //     //     return; // Exit the function if the maximum number of images is reached
    //     // }

    //     // setholidayData(prevState => ({
    //     //     ...prevState,
    //     //     images: [...prevState.images, selectedImage.image_link]
    //     // }));

    //     setholidayData(prevState => ({
    //         ...prevState,
    //         images: [...prevState.images, FileUploadUrl]
    //     }));

    //     setIsOpenImage(false);
    // }



    const validateHolidayData = (data) => {

        if (!data.location || data.location.trim() === "") {
            addNotification("Please Enter Location", "error");
            return false;
        }

        if (!data.package_name || data.package_name.trim() === "") {
            addNotification("Please Enter Package Name", "error");
            return false;
        }

        if (!data.include || data.include.trim() === "") {
            addNotification("Please Enter Include", "error");
            return false;
        }
        // if (data.duration.length !== 2 || data.duration.some(duration => duration <= 0)) {
        //     addNotification("Please Enter Valid Duration", "error");
        //     return false;
        // }
        if (data.duration[0] == 0 && data.duration[1] == 0) {
            addNotification("Please Enter Valid Duration", "error");
            return false;
        }
        // if (data.images.length === 0) {
        //     addNotification("Please Add at Least One Image", "error");
        //     return false;
        // }
        if (data.vehicle.length === 0) {
            addNotification("Package should contain at least 1 Vehicle", "error");
            return false;
        }
        if (!data.km_limit || data.km_limit === "") {
            addNotification("Please Enter KM Limit", "error");
            return false;
        }
        if (!data.description || data.description.trim() === "") {
            addNotification("Please Enter Description", "error");
            return false;
        }
        // if (!data.location_description || data.location_description.trim() === "") {
        //     addNotification("Please Enter Location Description", "error");
        //     return false;
        // }

        if (data.itenary.length === 0) {
            addNotification("Please Enter Itinerary", "error");
            return false;
        }
        return true;
    };




    const handleAddPackage = async () => {
        if (!validateHolidayData(holidayData)) {
            setDisabledButton(false);
            return;
        }

        const collectionRef = collection(db, 'test');

        // Data for the new document
        // const newData = holidayData;
        // Delete all images in the removed images array
        for (const imageLink of removedImages) {
            const filePath = await getPathFromUrl(imageLink);
            await deleteFileFromFirebase(filePath);
        }

        const newData = { ...holidayData };

        // Add the document to the collection
        return addDoc(collectionRef, newData)
            .then((docRef) => {
                console.log("Document successfully added with ID: ", docRef.id);
                updatePackageLocationId(docRef.id);
            })
            .catch((error) => {
                console.error("Error adding document: ", error);
                throw error;
                setDisabledButton(false);
            });
    };


    // REMOVE IMAGE LOGIC STARTS

    const [removedImages, setRemovedImages] = useState([]);

    const handleRemoveImage = (imageLinkToRemove) => {
        console.log(imageLinkToRemove);

        // Add the image URL to the removed images array
        setRemovedImages(prevState => [...prevState, imageLinkToRemove]);

        // Remove the image from the holidayData state
        setholidayData(prevState => ({
            ...prevState,
            images: prevState.images.filter(image => image !== imageLinkToRemove)
        }));
    };

    // REMOVE IMAGE LOGIC ENDS



    const [DisabledButton, setDisabledButton] = useState(false);

    const CreatePackage = async () => {

        setDisabledButton(true);

        if (holidayData.vehicle.length > 0) {


            handleAddPackage();
        } else {
            addNotification("Package should contain at least 1 Vehicle", "error");
            setDisabledButton(false);
        }
    };




    const updatePackageLocationId = async (docId) => {
        try {
            const docRef = doc(db, 'test', docId);
            await updateDoc(docRef, { location_id: docId });
            console.log("Document location_id updated successfully: ", docId);
            // alert("Package Created successfully ");
            addNotification("Package Created successfully ", "success")
            navigate('/admin/holiday/packages');

            return true;
        } catch (error) {
            console.error("Error updating document location_id: ", error);
            return false;
        }
    };




    const getPathFromUrl = (url) => {
        const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/carzi-00x.appspot.com/o/';
        const pathWithParams = url.split(baseUrl)[1];
        const path = pathWithParams.split('?')[0];
        return decodeURIComponent(path);
    };

    const deleteFileFromFirebase = (filePath) => {
        const storageRef = ref(storage, filePath);

        deleteObject(storageRef).then(() => {
            console.log('File deleted successfully');
        }).catch((error) => {
            console.error('Error deleting file:', error);
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



    // Generate a random name for the image






    // const handleFileUpload = async (event) => {
    //     const file = event.target.files[0];
    //     try {
    //         setuploadData(true);
    //         const downloadURL = await uploadImageToFirebaseStorage(file);
    //         // Use the downloadURL for displaying the preview or any other purpose
    //         console.log("Image uploaded. Preview URL:", downloadURL);
    //         // Set the preview URL to state or display it in the UI
    //         setFileUploadUrl(downloadURL);
    //         setuploadData(false);

    //     } catch (error) {
    //         console.error("Error uploading image: ", error);
    //         // Handle error, e.g., display an error message to the user
    //     }
    // };




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
                        placeholder="Enter Vehicle Name"
                        value={selectedQuestion ? selectedQuestion.vehicle_name : ''}
                        onChange={e => setSelectedQuestion(prevState => ({ ...prevState, vehicle_name: e.target.value }))}
                        className="w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 mb-4 focus:outline-none focus:border-blue-500"
                    />

                    <label htmlFor="answerSelect" className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                    <input
                        id="questionInput"
                        type="number"
                        placeholder="Enter Vehicle Price"
                        value={selectedQuestion ? selectedQuestion.price : ''}
                        onChange={e => setSelectedQuestion(prevState => ({ ...prevState, price: e.target.value }))}
                        className="w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 mb-4 focus:outline-none focus:border-blue-500"
                    />



                    <label htmlFor="answerSelect" className="block text-sm font-medium text-gray-700 mb-2">Guest Count (Capacity)</label>
                    <input
                        id="questionInput"
                        type="number"
                        placeholder="Enter Vehicle Capacity"
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
                    {/* <label htmlFor="questionInput" className="block text-md font-bold text-black mb-2">Itnerary Headings {' '} {' '} {"[ e.g: DAY 01: TEXT ]"}</label>
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
                    /> */}


                    <div className="container mx-auto p-4 text-black">
                        <h1 className="text-2xl font-bold mb-4">Itinerary Extractor</h1>
                        <textarea
                            className="w-full p-2 border border-gray-300 rounded mb-4"
                            rows="10"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Paste the itinerary text here..."
                        />
                        <button
                            className="bg-blue-500 text-white px-4 py-2 rounded"
                            onClick={handleExtract}
                        >
                            Extract Itinerary
                        </button>

                        {itinerary2.cleanedHeadings.length > 0 && (
                            <div className="mt-6">
                                <h2 className="text-xl font-bold mb-4">Extracted Itinerary</h2>
                                <table className="min-w-full border border-gray-300">
                                    <thead>
                                        <tr>
                                            <th className="border border-gray-300 px-4 py-2">Heading</th>
                                            <th className="border border-gray-300 px-4 py-2">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itinerary2.cleanedHeadings.map((heading, index) => (
                                            <tr key={index}>
                                                <td className="w-1/4 border border-gray-300 px-4 py-2">
                                                    <textarea
                                                        value={heading}
                                                        rows="4"
                                                        onChange={(e) => handleHeaderChange(index, e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                                                        placeholder="Heading"
                                                        wrap="soft"
                                                    />
                                                </td>
                                                <td className="w-3/4 border border-gray-300 px-4 py-2">
                                                    <textarea
                                                        value={itinerary2.cleanedDescriptions[index]}
                                                        rows="4"
                                                        onChange={(e) => handleDescriptionChange(index, e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                                                        placeholder="Description"
                                                        wrap="soft"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>



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
                        className="px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        Confirm
                    </Button>
                </DialogFooter>
            </Dialog>


            {/* BASIC DETAILS */}
            <Dialog size={"xxl"} open={isOpenBasicDetails} handler={() => setIsOpenBasicDetails(false)} className="h-xl overflow-scroll">
                <DialogHeader className="text-black px-6 py-4 text-xl font-semibold">Add/Edit Basic Details</DialogHeader>
                <DialogBody className="px-6 py-4">
                    {/* <label htmlFor="questionInput" className="block text-md font-bold text-black mb-2">Location</label> */}
                    {/* <input
                        id="questionInput"
                        type="text"
                        placeholder="Enter your question here"
                        value={holidayData ? holidayData.location : ''}
                        onChange={e => setholidayData(prevState => ({ ...prevState, location: e.target.value }))}
                        className="w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 mb-4 focus:outline-none focus:border-blue-500"
                    /> */}

                    {/* <select
                        id="answerSelect"
                        value={holidayData.location} // Use the value from state
                        onChange={e => setholidayData(prevState => ({ ...prevState, location: e.target.value.toLowerCase() }))}
                        className="w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 mb-4 focus:outline-none focus:border-blue-500"
                    >
                        <option value="">Select location</option>
                        {UniqueLocations.map((option, optionIndex) => (
                            <option key={optionIndex} value={option}>{option}</option>
                        ))}
                    </select> */}

                    <label htmlFor="questionInput" className="block text-md font-bold text-black">Location</label>
                    <input
                        id="questionInput"
                        type="text"
                        placeholder="Enter your question here"
                        value={holidayData ? holidayData.location : ''}
                        onChange={e => setholidayData(prevState => ({ ...prevState, location: e.target.value.toLowerCase() }))}
                        className="w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 mb-4 focus:outline-none focus:border-blue-500"
                    />
                    <p className='text-red-500 mb-2'>*Type location name wisely</p>


                    <label htmlFor="questionInput" className="block text-md font-bold text-black mb-2">Package Name</label>
                    <input
                        type="text"
                        placeholder="Enter your question here"
                        value={holidayData ? holidayData.package_name : ''}
                        onChange={e => setholidayData(prevState => ({ ...prevState, package_name: e.target.value }))}
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
                                    duration: [Number(e.target.value), holidayData.duration[1]] // Update the duration array with the new value of the first element
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
                                    duration: [holidayData.duration[0], Number(e.target.value)] // Update the duration array with the new value of the second element
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


            {/* GALLERY DETAILS */}
            <Dialog size={"xxl"} open={isOpenImage} handler={() => setIsOpenImage(false)} className="h-xl overflow-scroll">
                <DialogHeader className="text-black px-6 py-4 text-xl font-semibold">Add/Edit Image Gallery Details</DialogHeader>
                <DialogBody className="px-6 py-4">
                    <label htmlFor="fileUpload"
                        className={`block text-lg font-bold text-black mb-2

                            ${ImageGalleryDisabled == true ? '' : 'text-gray-800'}
                            `}
                    >
                        Image Upload
                        {uploadData && <span className='pl-20 text-lg text-red-600 font-bold animate-blink'>Please wait, the file is being uploaded.</span>}
                    </label>
                    <input
                        type="file"
                        id="fileUpload"
                        name="fileUpload"
                        accept="image/*"
                        multiple
                        className={`
                            ${ImageGalleryDisabled == true ? 'text-gray-100 cursor-not-allowed' : ''}
                            `}
                        onChange={handleFileUpload}
                    />
                    <div className="flex gap-2 border border-black overflow-auto max-h-lg rounded-md m-4 
                    text-sm placeholder:text-gray-600 text-center justify-center items-center">
                        {fileUploadUrls.map((url, index) => (
                            <img
                                key={url} // Use URL as key assuming URLs are unique
                                className="w-72 h-full border border-black object-cover object-center items-center justify-center m-2"
                                src={url}
                                alt={`Image ${index + 1}`}
                            />
                        ))}
                    </div>
                    <p>*Upload All images at once only</p>
                </DialogBody>
                <DialogFooter className="px-6 py-4 bg-gray-50 flex justify-end rounded-lg">
                    <Button
                        variant="text"
                        color="red"
                        onClick={() => {
                            setIsOpenImage(false);
                            setImageGalleryDisabled(false);
                        }}
                        className="px-4 py-2 rounded-md bg-red-500 text-white mr-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="gradient"
                        color="green"
                        onClick={() => {
                            handleSubmitImage(),
                                setImageGalleryDisabled(false);
                        }}
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
                            ADD NEW Holiday Package
                        </p>
                    </div>


                    <button
                        type="button"
                        onClick={CreatePackage}
                        className={` lg:text-xl  flex items-center gap-2 px-3 
                        py-2 rounded-lg  transition-transform duration-200 
                        hover:-translate-x-1 hover:-translate-y-1 hover:shadow-md
                        ${DisabledButton == true ? 'bg-gray-400 cursor-not-allowed text-red-700 ' : 'bg-green-400 text-white'}  
                        `}

                        disabled={DisabledButton}
                    >
                        Create Package1 <ArrowBigRightDash />
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


                                        {/* <button
                                            type="button"
                                            onClick={handleEditBasicDetails}
                                            className="bg-black text-sm text-white flex items-center gap-2 px-3 py-2 rounded-lg  transition-transform duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-md"
                                        >
                                            Edit Basic Details <Plus size={20} />
                                        </button> */}
                                    </div>
                                    {/* </div> */}


                                </th>
                            </tr>


                            <tr className='hover:bg-yellow-100'>
                                <th className="p-2 text-lg font-bold border border-black">location</th>
                                <td className="text-lg font-bold border border-black flex justify-center items-center p-2">                                    {/* {holidayData.location}
                                    <input
                                        value={holidayData ? holidayData.location : ''}
                                        onChange={e => setholidayData(prevState => ({ ...prevState, location: e.target.value.toLowerCase() }))}
                                    /> */}
                                    <textarea
                                        value={holidayData ? holidayData.location : ''}
                                        onChange={e => setholidayData(prevState => ({ ...prevState, location: e.target.value.toLowerCase() }))}
                                        className="w-full h-10 text-center border border-gray-300 rounded-md items-center justify-center
                                         focus:outline-none focus:border-blue-500 resize-none"
                                        placeholder="enter location name"
                                    />
                                </td>
                            </tr>

                            <tr className='hover:bg-yellow-100'>
                                <th className="p-2 text-lg font-bold border border-black">Package Name</th>
                                <td className="text-lg font-bold border border-black flex justify-center items-center p-2">
                                    {/* {holidayData.package_name} */}

                                    <textarea
                                        value={holidayData ? holidayData.package_name : ''}
                                        onChange={e => setholidayData(prevState => ({ ...prevState, package_name: e.target.value }))}
                                        className="w-full h-10 text-center border border-gray-800 rounded-md items-center justify-center
                                         focus:outline-none focus:border-blue-800"
                                        placeholder="enter package name"
                                    />
                                </td>
                            </tr>

                            <tr className='hover:bg-yellow-100'>
                                <th className="p-2 text-lg font-bold border border-black">description</th>
                                <td className="text-lg font-bold border border-black flex justify-center items-center p-2">
                                    {/* {"Kochi, nestled along the southwestern coast of India, captivates with its rich blend of cultural heritage and serene backwaters. Known for its historic Fort Kochi, vibrant spice markets, and tranquil houseboat cruises, Kochi offers a picturesque gateway to Kerala's diverse landscapes."} */}
                                    {/* {holidayData.description} */}
                                    <textarea
                                        row="4"
                                        value={holidayData ? holidayData.description : ''}
                                        onChange={e => setholidayData(prevState => ({ ...prevState, description: e.target.value }))}
                                        className="w-full h-10 text-center border border-gray-800 rounded-md items-center justify-center
                                         focus:outline-none focus:border-blue-500"
                                        placeholder="enter package description"
                                    />
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
                                    {/* {holidayData.duration[0] + " DAYS " + holidayData.duration[1] + " NIGHTS "} */}
                                    <div className="flex justify-center items-center gap-4">

                                        <input
                                            type="number"
                                            value={holidayData ? holidayData.duration[0] : ''}
                                            onChange={e => setholidayData(prevState => ({
                                                ...prevState,
                                                duration: [Number(e.target.value), holidayData.duration[1]]
                                            }))}
                                            className="w-20 text-center border border-gray-800 rounded-md items-center justify-center
                                         focus:outline-none focus:border-blue-500"
                                            placeholder="enter package description"
                                        />
                                        <span>NIGHTS</span>
                                        <input
                                            type="number"
                                            value={holidayData ? holidayData.duration[1] : ''}
                                            onChange={e => setholidayData(prevState => ({
                                                ...prevState,
                                                duration: [holidayData.duration[0], Number(e.target.value)]
                                            }))}
                                            className="w-20 text-center border border-gray-800 rounded-md items-center justify-center
                                         focus:outline-none focus:border-blue-500"
                                            placeholder="enter package description"
                                        />

                                        <span>DAYS</span>
                                    </div>

                                </td>
                            </tr>
                            <tr className='hover:bg-yellow-100'>
                                <th className="p-2 text-lg font-bold border border-black">km_limit</th>
                                <td className="text-lg font-bold border items-center border-black w-1/2 text-center">
                                    {/* {"750 K/M"} */}
                                    {/* {holidayData.km_limit} */}
                                    <input
                                        type="Number"
                                        value={holidayData ? holidayData.km_limit : ''}
                                        onChange={e => setholidayData(prevState => ({ ...prevState, km_limit: Number(e.target.value) }))}
                                        className="w-80 h-10 text-center border border-gray-800 rounded-md
                                         items-center justify-center
                                         focus:outline-none focus:border-blue-500 resize-none"
                                        placeholder="enter package km_limit"
                                    />
                                </td>
                            </tr>

                            <tr className='hover:bg-yellow-100'>
                                <th className="p-2 text-lg font-bold border border-black">include
                                </th>
                                <td className="text-lg font-bold border flex justify-center items-center p-2">
                                    {/* {"All parking routes, Morning Snacks"} */}
                                    {/* {holidayData.include} */}

                                    <textarea
                                        row="4"
                                        value={holidayData ? holidayData.include : ''}
                                        onChange={e => setholidayData(prevState => ({ ...prevState, include: e.target.value }))}
                                        className="w-full h-10 text-center border border-gray-800 rounded-md
                                         items-center justify-center
                                         focus:outline-none focus:border-blue-500 resize-none"
                                        placeholder="enter package include"
                                    />
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
                            {holidayData.vehicle.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center">Add Vechiles</td>
                                </tr>
                            ) : (
                                holidayData.vehicle.map((item, index) => (
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
                                ))
                            )}

                        </tbody>
                    </table>
                </div>









                <div className="my-5 flex items-center justify-between lg:flex-row flex-col py-2 mt-5">
                    <div className="flex">
                        <p className="text-2xl font-bold ">
                            Itnerary Details
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={addItenary}
                        // className="bg-black text-white flex items-center gap-2 px-3 py-2 rounded-lg"
                        className="bg-black text-white flex items-center gap-2 px-3 py-2 rounded-lg  
                        transition-transform duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-md
                        hover:bg-green-700"

                    >
                        Add/Edit Itnerary <Plus size={20} />
                    </button>
                </div>


                <div className='border-2 p-5 shadow-md '>
                    <table className="w-full border border-black">
                        <thead>
                            <tr className='bg-gray-200'>
                                {/* <th className="text-lg font-bold border border-black w-20">Sr. No.</th> */}
                                <th className="p-2 text-lg font-bold border border-black">Itnerary Heading</th>
                                <th className="p-2 text-lg font-bold border border-black">Itnerary Description</th>
                                {/* <th className="p-2 text-lg font-bold border border-black">Action</th> */}

                            </tr>
                        </thead>
                        <tbody>
                            {
                                holidayData.itenary.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center">Add/Edit Itnerary</td>

                                    </tr>
                                ) : (
                                    holidayData.itenary.map((item, index) => (
                                        <tr key={index}>
                                            {/* <td className="border border-black">{index + 1}</td> */}
                                            <td className="w-1/6 p-4 border border-black">{item.header}</td>
                                            <td className="w-5/6 p-2 border border-black first-letter">{item.description}</td>
                                            {/* <td className='border border-black flex items-center justify-center p-1'>
                                                <button
                                                    className="px-5 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    onClick={() => handleEditItenary(item)}
                                                >
                                                    Edit
                                                </button>
                                            </td> */}
                                        </tr>
                                    ))
                                )
                            }

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
                        onClick={addImage}
                        // className="bg-black text-white flex items-center gap-2 px-3 py-2 rounded-lg"
                        className="bg-black text-white flex items-center gap-2 px-3 py-2 rounded-lg  transition-transform duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-md"

                    >
                        Add Image <Plus size={20} />
                    </button>
                </div>


                <div className='border-2 p-5 shadow-md'>
                    <table className="w-full border border-black">
                        <thead>
                            <tr className='bg-gray-200'>
                                {/* <th className="p-2 text-lg font-bold border border-black">Image Link</th> */}
                                <th className="p-2 text-lg font-bold border border-black">Image</th>
                                <th className="p-2 text-lg font-bold border border-black">Action</th>


                            </tr>
                        </thead>
                        <tbody>
                            {holidayData.images.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center">Add Gallery Images</td>
                                </tr>
                            ) : (
                                holidayData.images.map((image, index) => (
                                    <tr key={index}>
                                        {/* <td className="text-lg font-bold border border-black  text-center">
                                            <input
                                                type="text"
                                                className="bg-red-200 py-2 w-[90%] rounded-lg"
                                                id={`image_link_${index}`}
                                                value={image || ''} // Set the value from the state
                                                onChange={e => handleChange(e, index)} // Pass the index to handleChange function
                                                placeholder="Enter image URL"
                                            />
                                        </td> */}
                                        <td className="text-lg font-bold border border-black  text-center">
                                            <div className="w-full flex justify-center items-center rounded-md px-3 py-2 text-sm placeholder:text-gray-600 text-center
                                             ">
                                                <img
                                                    className="w-40 h-40 object-cover object-center items-center justify-center"
                                                    src={image}
                                                    alt={`Image ${index}`}
                                                />
                                            </div>
                                        </td>
                                        <td className='border border-black p-1'>
                                            <div className='flex gap-2 justify-center items-center'>

                                                <button
                                                    className="px-5 py-2 bg-blue-500 text-white rounded-md
                                                 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    onClick={() => handleRemoveImage(image)}
                                                >
                                                    Remove
                                                </button>
                                            </div>

                                        </td>
                                    </tr>
                                ))
                            )}

                        </tbody>

                    </table>
                </div>



            </div>
        </div>
    )
}

export default AuthCheck(ANewPacakge);