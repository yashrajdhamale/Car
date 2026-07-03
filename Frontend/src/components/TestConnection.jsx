import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@config/firebase';

function TestConnection() {
  const [status, setStatus] = useState('Checking database connection...');
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test reading from the database
        const querySnapshot = await getDocs(collection(db, "bookings"));
        const bookingsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBookings(bookingsData);
        setStatus(`✅ Successfully connected to Firestore. Found ${bookingsData.length} bookings.`);
        
        // Test writing to the database
        if (bookingsData.length === 0) {
          const testDoc = await addDoc(collection(db, "bookings"), {
            test: true,
            timestamp: new Date().toISOString(),
            message: "This is a test document"
          });
          setStatus(prev => `${prev}\n✅ Successfully wrote test document with ID: ${testDoc.id}`);
        }
      } catch (error) {
        console.error("Database error:", error);
        setStatus(`❌ Error: ${error.message}\n\nMake sure you have:
1. Created a Firestore database in Firebase Console
2. Set up the correct security rules
3. Configured your .env file with the right Firebase credentials`);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Database Connection Test</h2>
      <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
        {status}
      </pre>
      
      {bookings.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Existing Bookings:</h3>
          <ul className="space-y-2">
            {bookings.map((booking, index) => (
              <li key={booking.id} className="border p-2 rounded">
                <p><span className="font-medium">ID:</span> {booking.id}</p>
                {booking.fullName && <p><span className="font-medium">Name:</span> {booking.fullName}</p>}
                {booking.email && <p><span className="font-medium">Email:</span> {booking.email}</p>}
                {booking.test && <p className="text-blue-600">This is a test document</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default TestConnection;
