// src/pages/Packages.jsx
import { useEffect, useState } from "react";
import { db } from "../config/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";

export default function Packages() {
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "packages"));
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPackages(data);  
      } catch (err) {
        console.error("Error fetching packages:", err);
      }
    };
    fetchPackages();
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Available Packages</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="border rounded-xl p-6 shadow-md bg-white"
          >
            <h2 className="text-xl font-bold">{pkg.name}</h2>
            <p className="text-gray-600 mb-2">{pkg.description}</p>
            <p className="text-sm text-gray-500">
              {pkg.days} Days / {pkg.nights} Nights
            </p>
            <Link
              to={`/outstation/${pkg.id}`}
              className="mt-4 inline-block bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
            >
              View Package
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
