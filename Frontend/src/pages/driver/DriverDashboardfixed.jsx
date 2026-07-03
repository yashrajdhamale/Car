import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  serverTimestamp,
  where,
  getDoc,
  writeBatch,
  updateDoc
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import RideRequestCard from '../../components/driver/RideRequestCard';
import HolidayRideRequestCard from '../../components/driver/HolidayRideRequestCard';
import InterestedRoutesSection from './components/InterestedRoutesSection';
import Sidebar from '../../components/driver/Sidebar';
import { useUser } from '../../context/UserContext';

// 🔊 Notification function
const playNotification = async (message) => {
  try {
    const audioPath = '/audio/notification.mp3';
    for (let i = 0; i < 3; i++) {
      await new Promise((resolve) => {
        const audio = new Audio(audioPath);
        audio.onended = resolve;
        audio.onerror = resolve;
        audio.play().catch(() => resolve());
      });
      await new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = 'hi-IN';
        utterance.rate = 0.9;
        utterance.onend = resolve;
        utterance.onerror = resolve;
        window.speechSynthesis.speak(utterance);
      });
      await new Promise((res) => setTimeout(res, 500));
    }
  } catch (err) {
    console.error('Notification error:', err);
  }
};

const CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad",
  "Chennai", "Kolkata", "Surat", "Pune", "Jaipur", "Lucknow",
  "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam",
  "Pimpri-Chinchwad", "Patna", "Vadodara", "Ghaziabad", "Ludhiana",
  "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Varanasi"
];

const DriverDashboard = () => {
  const [rideRequests, setRideRequests] = useState({ outstation: [], holiday: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const { user: contextUser } = useUser();

  const previousRequestCount = useRef({ outstation: 0, holiday: 0 });
  const isAudioEnabledRef = useRef(isAudioEnabled);
  
  useEffect(() => {
    isAudioEnabledRef.current = isAudioEnabled;
  }, [isAudioEnabled]);

  // Handle ride requests and announcements
  useEffect(() => {
    if (!contextUser?.uid) return;

    const outstationRef = collection(db, 'outstationRides');
    const holidayRef = collection(db, 'holidayPackages');

    // Query for outstation rides
    const outstationQuery = query(
      outstationRef,
      where('status', '==', 'searching_driver'),
      orderBy('createdAt', 'desc')
    );

    // Query for holiday packages
    const holidayQuery = query(
      holidayRef,
      where('status', '==', 'searching_driver'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeOutstation = onSnapshot(outstationQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'outstation',
        createdAt: doc.data().createdAt || serverTimestamp()
      }));

      // Check for new requests
      const newRequests = requests.filter(req => 
        !rideRequests.outstation.some(existing => existing.id === req.id)
      );

      if (newRequests.length > 0 && isAudioEnabledRef.current) {
        const message = `नया आउटस्टेशन राइड अनुरोध प्राप्त हुआ है। कुल ${newRequests.length} नए अनुरोध।`;
        playNotification(message);
      }

      setRideRequests(prev => ({
        ...prev,
        outstation: requests
      }));
    });

    const unsubscribeHoliday = onSnapshot(holidayQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'holiday',
        createdAt: doc.data().createdAt || serverTimestamp()
      }));

      // Check for new requests
      const newRequests = requests.filter(req => 
        !rideRequests.holiday.some(existing => existing.id === req.id)
      );

      if (newRequests.length > 0 && isAudioEnabledRef.current) {
        const message = `नया होलिडे पैकेज अनुरोध प्राप्त हुआ है। कुल ${newRequests.length} नए अनुरोध।`;
        playNotification(message);
      }

      setRideRequests(prev => ({
        ...prev,
        holiday: requests
      }));
    });

    setLoading(false);

    // Cleanup function
    return () => {
      unsubscribeOutstation();
      unsubscribeHoliday();
    };
  }, [contextUser?.uid]);

    const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderLoadingOverlay = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-700">Loading dashboard...</p>
      </div>
    </div>
  );

  const renderRequestCard = (request) => (
    <div key={request.id} className="p-4 border-b">
      {request.type === 'holiday' ? (
        <HolidayRideRequestCard request={request} />
      ) : (
        <RideRequestCard request={request} />
      )}
    </div>
  );

  const filteredRequests = useMemo(() => {
    if (activeTab === 'all') {
      return [...rideRequests.outstation, ...rideRequests.holiday]
        .sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
    } else if (activeTab === 'outstation') {
      return [...rideRequests.outstation];
    } else if (activeTab === 'holiday') {
      return [...rideRequests.holiday];
    }
    return [];
  }, [rideRequests, activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Loading Overlay */}
      {loading && renderLoadingOverlay()}

      <div className="flex w-full">
        {/* Sidebar */}
        <div className={`hidden md:block h-screen transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-20' : 'w-64'} flex-shrink-0`}>
          <Sidebar 
            collapsed={sidebarCollapsed}
            onCollapseChange={setSidebarCollapsed}
            onLogout={handleLogout}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden w-full">
          {/* Main content header */}
          <div className="bg-white shadow-sm p-4">
            <h1 className="text-xl font-semibold text-gray-800">Driver Dashboard</h1>
          </div>

          {/* Main content area */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Ride Requests</h1>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="audioToggle"
                      checked={isAudioEnabled}
                      onChange={() => setIsAudioEnabled(!isAudioEnabled)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="audioToggle" className="ml-2 block text-sm text-gray-700">
                      Enable Audio Alerts
                    </label>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`${activeTab === 'all' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    All Requests
                  </button>
                  <button
                    onClick={() => setActiveTab('outstation')}
                    className={`${activeTab === 'outstation' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Outstation
                  </button>
                  <button
                    onClick={() => setActiveTab('holiday')}
                    className={`${activeTab === 'holiday' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Holiday Packages
                  </button>
                </nav>
              </div>

              {/* Request List */}
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                {loading ? (
                  <div className="p-6 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2">Loading requests...</p>
                  </div>
                ) : filteredRequests.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {filteredRequests.map((request) => (
                      <li key={request.id}>
                        {renderRequestCard(request)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    {`No ${activeTab !== 'all' ? activeTab : ''} ride requests found.`}
                  </div>
                )}
              </div>

              {/* Interested Routes Section */}
              <div className="mt-8">
                {auth.currentUser?.uid && (
                  <InterestedRoutesSection 
                    driverId={auth.currentUser.uid}
                    cities={CITIES}
                  />
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default DriverDashboard;
