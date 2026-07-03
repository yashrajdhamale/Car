import React, { useEffect, useState } from 'react';
import { fetchAllTestData } from '@config/test';
import { Dialog } from '@material-tailwind/react';
import AdminForm from './AdminForm';
import { AuthCheck } from '@components';

const Admin = () => {
  const [holidayData, setHolidayData] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const handleOpenForm = () => setOpenForm(!openForm);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchAllTestData();
        if (data) {
          setHolidayData(data);
        }
      } catch (error) {
        console.error('Error fetching holiday data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <div className="bg-black text-white py-4 px-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin</h1>
        <button
          className=' bg-blue-800 p-3 rounded-lg'
          onClick={handleOpenForm}
        >
          Add New Holiday
        </button>
      </div>
      <Dialog open={openForm} size='xl' handler={handleOpenForm}>
        <AdminForm />
      </Dialog>
      <div className=" mt-8 flex gap-5 m-10 flex-wrap">
        {holidayData.map((packageItem, index) => (
          <div key={index} className=" p-6 rounded-md shadow-md mb-4 w-1/3 bg-blue-50">
            <h2 className="text-xl font-bold mb-4">{packageItem.package_name}</h2>
            <p>{packageItem.include}</p>
            <p>Kilometer Limit : {packageItem.km_limit}</p>
            <h3 className="mt-4 text-lg font-bold">Description:</h3>
            <p className="mt-2">{packageItem.description}</p>
            <h3 className="mt-4 text-lg font-bold">Itinerary:</h3>
            {packageItem?.itenary.map((item, index) => (
              <div key={index}>{item.header} : {item.description}</div>
            ))}
            <p className="mt-2">Duration: {packageItem.duration[0]} days, {packageItem.duration[1]} Nights</p>
            <h3 className="mt-4 text-lg font-bold">Vehicle Options:</h3>
            {packageItem?.vehicle.map((item, index) => (
              <div key={index}>{item.vehicle_name} : {item.price} {`(Guest Count ${item.guest_count} )`}</div>
            ))}
            <hr className="mt-4" />
          </div>
        ))}
      </div>
    </>
  );
}

export default AuthCheck(Admin);
