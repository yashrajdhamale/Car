import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Dialog, DialogHeader, DialogBody, DialogFooter, Button } from '@material-tailwind/react';
import { auth } from '@config/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { adminApi } from '../services/adminApiService';

const AEditLocation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const docId = location.state?.packageItem?.id;
  const [holidayData, setholidayData] = useState({ location: "", include: "", duration: [3,4], description: "", package_name: "", km_limit: 750 });
  const [UniqueLocations, setUniqueLocations] = useState([null]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) navigate('/admin/login');
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const result = await adminApi.listPackages();
        const locations = (result.packages || []).map((item) => item.location).filter(Boolean);
        setUniqueLocations(locations);
      } catch (error) {
        console.error('Error fetching holidays:', error);
      }
    };
    fetchHolidays();
  }, []);

  useEffect(() => {
    const fetchPackageData = async () => {
      try {
        if (!docId) return;
        const result = await adminApi.getPackage(docId);
        if (result.package) setholidayData(result.package);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchPackageData();
  }, [docId]);

  const EditPackage = async () => {
    try {
      await adminApi.updatePackage(docId, { ...holidayData });
      navigate('/admin/holiday/packages');
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  return (
    <Dialog open={true} size="md" handler={() => navigate(-1)}>
      <DialogHeader>Edit Location</DialogHeader>
      <DialogBody>
        <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(holidayData, null, 2)}</pre>
      </DialogBody>
      <DialogFooter>
        <Button onClick={EditPackage}>Save</Button>
      </DialogFooter>
    </Dialog>
  );
};

export default AEditLocation;
