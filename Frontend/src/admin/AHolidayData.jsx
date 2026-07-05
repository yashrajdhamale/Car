import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Dialog, DialogHeader, DialogBody, DialogFooter, Button, Typography, Timeline, TimelineItem, TimelineConnector, TimelineIcon, TimelineHeader } from "@material-tailwind/react";
import { ClockIcon, CircleStackIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/solid";
import { AuthCheck } from '@components';

function AHolidayData() {
  const location = useLocation();
  const { state } = location;
  const navigate = useNavigate();
  const docId = state?.packageItem?.id;
  const [holidayData, setHolidayData] = useState(null);
  const [dataPrepared, setDataPrepared] = useState(false);
  const [CurrentPackageOpen, setCurrentPackageOpen] = useState(false);
  const [CurrentPackageOpenData, setCurrentPackageOpenData] = useState([]);

  useEffect(() => {
    const fetchAllTestData = async () => {
      try {
        const result = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/holiday-bookings/${docId}`).then(r => r.json());
        setHolidayData(result.booking || result);
        setDataPrepared(true);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    if (docId) fetchAllTestData();
  }, [docId]);

  const UpdateHolidayRecord = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/holiday-bookings/${docId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apporval: "Confirmed" }),
      });
      if (!response.ok) throw new Error("Approval failed");
      navigate('/admin/holiday');
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const HandleCurrentPackageOpen = () => setCurrentPackageOpen(!CurrentPackageOpen);
  const HandleStartExamPopUp = () => setCurrentPackageOpen(!CurrentPackageOpen);

  const formatStringDate = (dateString) => {
    const date = new Date(dateString);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  const convertTo12HourFormat = (time24) => {
    const [hour, minute] = time24.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
  };

  return (
    <>
      <Dialog open={CurrentPackageOpen} size={"sm"} handler={HandleCurrentPackageOpen}>
        <DialogHeader className='flex gap-2 m-3 lg:m-5 lg:text-3xl'>
          <ClipboardDocumentListIcon className='w-8 h-8' />
          Holiday Confirmation:
        </DialogHeader>
        <DialogBody>
          <div className="">
            <Timeline>
              <TimelineItem className="h-28 ">
                <TimelineConnector className="!w-[78px]" />
                <TimelineHeader className="relative hover:bg-yellow-100 rounded-xl border border-blue-gray-50 bg-white py-3 pl-4 pr-8 shadow-lg shadow-blue-gray-900/5">
                  <TimelineIcon className="p-3" variant="ghost" color="red">
                    <CircleStackIcon className="h-5 w-5" />
                  </TimelineIcon>
                  <div className="flex flex-col gap-1">
                    <Typography variant="h6" color="blue-gray">Package Name: 3 DAYS 4 NIGHTS</Typography>
                  </div>
                </TimelineHeader>
              </TimelineItem>
              <TimelineItem className="h-28">
                <TimelineConnector className="!w-[78px]" />
                <TimelineHeader className="relative hover:bg-yellow-100 rounded-xl border border-blue-gray-50 bg-white py-3 pl-4 pr-8 shadow-lg shadow-blue-gray-900/5">
                  <TimelineIcon className="p-3" variant="ghost" color="green">
                    <ClockIcon className="h-5 w-5" />
                  </TimelineIcon>
                  <div className="flex flex-col gap-1">
                    <Typography variant="h6" color="blue-gray">UserName: {holidayData ? holidayData.name : "Loading..."}</Typography>
                  </div>
                </TimelineHeader>
              </TimelineItem>
            </Timeline>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button onClick={UpdateHolidayRecord}>Confirm</Button>
        </DialogFooter>
      </Dialog>
      <div>Holiday admin screen</div>
    </>
  );
}

export default AuthCheck(AHolidayData);
