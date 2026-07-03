import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, query, where, doc, getDoc } from 'firebase/firestore';
import { getUserDocument } from '@config/functions';
import { useNotification } from '../../context/NotificationContext';
import { RideAcceptedPopup } from '../../components/RideAcceptedPopup';
import { Button, Card, CardBody, Typography, Spinner } from '@material-tailwind/react';

function DriverDashboard() {
    const navigate = useNavigate();
    const { addNotification } = useNotification();
    const [userData, setUserData] = useState(null);
    
    // Background image style
    const backgroundStyle = {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('/force-traveller-3350.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        padding: '1rem 0' // Add some padding to prevent content from touching edges
    };
    
    // Get greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };
    const [loading, setLoading] = useState(true);
    const [availableRides, setAvailableRides] = useState([]);
    const [acceptedRide, setAcceptedRide] = useState(null);
    const [showAcceptedPopup, setShowAcceptedPopup] = useState(false);
    const [processingRide, setProcessingRide] = useState(false);

    // Fetch available rides in real-time
    useEffect(() => {
        if (!userData) return;
        
        const q = query(
            collection(db, 'availableRides'),
            where('status', '==', 'pending'),
            where('expiresAt', '>', new Date())
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const rides = [];
            snapshot.forEach((doc) => {
                rides.push({ id: doc.id, ...doc.data() });
            });
            setAvailableRides(rides);
        });
        
        return () => unsubscribe();
    }, [userData]);

    // Handle ride acceptance
    const handleAcceptRide = async (rideId) => {
        if (processingRide) return;
        
        try {
            setProcessingRide(true);
            const rideDoc = await getDoc(doc(db, 'availableRides', rideId));
            if (!rideDoc.exists()) {
                throw new Error('Ride no longer available');
            }
            
            // Get the full ride details from the rides collection
            const fullRideDoc = await getDoc(doc(db, 'rides', rideId));
            if (!fullRideDoc.exists()) {
                throw new Error('Ride details not found');
            }
            
            const rideData = {
                ...fullRideDoc.data(),
                ...rideDoc.data(),
                id: rideDoc.id
            };
            
            setAcceptedRide(rideData);
            setShowAcceptedPopup(true);
            
        } catch (error) {
            console.error('Error accepting ride:', error);
            addNotification(error.message || 'Failed to accept ride', 'error');
        } finally {
            setProcessingRide(false);
        }
    };
    
    // Fetch user data on mount
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const currentUser = auth.currentUser;
                if (!currentUser) {
                    navigate('/login');
                    return;
                }

                const data = await getUserDocument(currentUser.uid);
                if (!data || data.type !== 'driver') {
                    addNotification('Access denied. Driver account required.', 'error');
                    navigate('/');
                    return;
                }

                if (data.status !== 'approved') {
                    addNotification('Your driver account is not yet approved.', 'warning');
                    navigate('/');
                    return;
                }

                setUserData(data);
            } catch (error) {
                console.error('Error fetching user data:', error);
                addNotification('Error loading dashboard. Please try again.', 'error');
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [navigate, addNotification]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
            addNotification('Successfully logged out', 'success');
        } catch (error) {
            console.error('Error signing out:', error);
            addNotification('Error signing out', 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner className="h-12 w-12" />
            </div>
        );
    }

    if (!userData) {
        return null; // Redirect will happen in useEffect
    }

    return (
        <div style={backgroundStyle} className="min-h-screen">
            <div className="relative z-10 p-4">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6 shadow-lg">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold text-white">
                                    {getGreeting()}, {userData.fullName || 'Driver'}! 👋
                                </h1>
                                <p className="text-gray-200 mt-1">Welcome back to your dashboard. Ready for your next trip?</p>
                            </div>
                            <Button color="red" onClick={handleLogout} className="shrink-0">
                                Logout
                            </Button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Profile */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card className="overflow-hidden">
                                <div className="bg-blue-600 p-4 text-white">
                                    <Typography variant="h5" className="text-white">Profile Information</Typography>
                                </div>
                                <div className="p-4">
                                    <dl className="divide-y divide-gray-200">
                                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                            <dt className="text-sm font-medium text-gray-500">Full name</dt>
                                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                                {userData.fullName || 'N/A'}
                                            </dd>
                                        </div>
                                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                            <dt className="text-sm font-medium text-gray-500">Email</dt>
                                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                                {userData.email || 'N/A'}
                                            </dd>
                                        </div>
                                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                            <dt className="text-sm font-medium text-gray-500">Phone</dt>
                                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                                {userData.phone || 'N/A'}
                                            </dd>
                                        </div>
                                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                            <dt className="text-sm font-medium text-gray-500">Status</dt>
                                            <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                    ${userData.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                                      userData.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                                      'bg-red-100 text-red-800'}`}>
                                                    {userData.status?.toUpperCase() || 'N/A'}
                                                </span>
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </Card>

                            {/* Documents Section */}
                            <Card>
                                <div className="bg-blue-600 p-4 text-white">
                                    <Typography variant="h5" className="text-white">Documents</Typography>
                                </div>
                                <div className="p-4">
                                    <div className="space-y-4">
                                        {userData.documents?.length > 0 ? (
                                            userData.documents.map((doc, index) => (
                                                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                                    <span className="text-sm font-medium text-gray-700">{doc.type}</span>
                                                    {doc.url ? (
                                                        <a 
                                                            href={doc.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-blue-600 hover:text-blue-800"
                                                        >
                                                            View
                                                        </a>
                                                    ) : (
                                                        <span className="text-sm text-gray-500">Not uploaded</span>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500">No documents uploaded</p>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Right Column - Rides */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Available Rides */}
                            <Card>
                                <div className="bg-blue-600 p-4 text-white">
                                    <Typography variant="h5" className="text-white">Available Rides</Typography>
                                </div>
                                <div className="p-4">
                                    {availableRides.length === 0 ? (
                                        <div className="text-center py-4">
                                            <Typography className="text-gray-500">No rides available at the moment</Typography>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {availableRides.map((ride) => (
                                                <Card key={ride.id} className="hover:shadow-md transition-shadow">
                                                    <CardBody className="p-4">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <Typography variant="h6" className="mb-1">
                                                                    {ride.pickup} → {ride.drop}
                                                                </Typography>
                                                                <Typography variant="small" color="gray" className="mb-3">
                                                                    {new Date(ride.pickupTime?.toDate()).toLocaleString()}
                                                                </Typography>
                                                                {ride.passengerName && (
                                                                    <div className="flex items-center text-sm text-gray-600">
                                                                        <span className="mr-2">Passenger:</span>
                                                                        <span className="font-medium">{ride.passengerName}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <Button 
                                                                color="green" 
                                                                size="sm"
                                                                onClick={() => handleAcceptRide(ride.id)}
                                                                disabled={processingRide}
                                                                className="whitespace-nowrap bg-green-600 hover:bg-green-700 text-white"
                                                            >
                                                                {processingRide ? 'Processing...' : 'Accept Ride'}
                                                            </Button>
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Your Rides */}
                            <Card>
                                <div className="bg-blue-600 p-4 text-white">
                                    <Typography variant="h5" className="text-white">Your Active Ride</Typography>
                                </div>
                                <div className="p-4">
                                    {acceptedRide ? (
                                        <Card className="border-l-4 border-green-500">
                                            <CardBody>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <Typography variant="h6" className="mb-1">
                                                            {acceptedRide.pickup} → {acceptedRide.drop}
                                                        </Typography>
                                                        <Typography variant="small" color="gray" className="mb-2">
                                                            {new Date(acceptedRide.pickupTime?.toDate()).toLocaleString()}
                                                        </Typography>
                                                        <div className="flex items-center">
                                                            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                                                            <span className="text-sm font-medium text-gray-700">
                                                                {acceptedRide.status?.charAt(0).toUpperCase() + acceptedRide.status?.slice(1)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Button 
                                                        variant="outlined" 
                                                        size="sm"
                                                        onClick={() => setShowAcceptedPopup(true)}
                                                    >
                                                        View Details
                                                    </Button>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    ) : (
                                        <div className="text-center py-4">
                                            <Typography className="text-gray-500">No active rides</Typography>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Ride Accepted Popup */}
                <RideAcceptedPopup 
                    ride={acceptedRide}
                    open={showAcceptedPopup}
                    onClose={() => setShowAcceptedPopup(false)}
                />
            </div>
        </div>
    );
}


