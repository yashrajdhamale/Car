import React, { useEffect } from 'react';
import { Button, Dialog, DialogHeader, DialogBody, DialogFooter, Typography } from '@material-tailwind/react';
import { format } from 'date-fns';

export const RideAcceptedPopup = ({ ride, onClose, open }) => {
  if (!ride) return null;

  const formatTime = (timestamp) => {
    try {
      if (!timestamp) return 'Not specified';
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'PPpp');
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Invalid date';
    }
  };

  return (
    <Dialog open={open} handler={onClose} size="lg">
      <DialogHeader className="bg-green-500 text-white">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <Typography variant="h5">Ride Accepted Successfully!</Typography>
        </div>
      </DialogHeader>
      <DialogBody className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Typography variant="h6" color="blue-gray" className="mb-2">Customer Details</Typography>
              <div className="space-y-1">
                <Typography><span className="font-semibold">Name:</span> {ride.customerName || 'Not specified'}</Typography>
                <Typography><span className="font-semibold">Phone:</span> {ride.customerPhone || 'Not specified'}</Typography>
                {ride.customerEmail && (
                  <Typography><span className="font-semibold">Email:</span> {ride.customerEmail}</Typography>
                )}
              </div>
            </div>
            
            <div>
              <Typography variant="h6" color="blue-gray" className="mb-2">Ride Details</Typography>
              <div className="space-y-1">
                <Typography><span className="font-semibold">Pickup:</span> {ride.pickup || 'Not specified'}</Typography>
                <Typography><span className="font-semibold">Drop:</span> {ride.drop || 'Not specified'}</Typography>
                <Typography><span className="font-semibold">Pickup Time:</span> {formatTime(ride.pickupTime)}</Typography>
                {ride.notes && (
                  <Typography className="mt-2">
                    <span className="font-semibold">Notes:</span> {ride.notes}
                  </Typography>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-gray-50 rounded-lg">
            <Typography variant="h6" color="blue-gray" className="mb-2">Your Vehicle Details</Typography>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Typography><span className="font-semibold">Model:</span> {ride.vehicleModel || 'Not specified'}</Typography>
              <Typography><span className="font-semibold">Color:</span> {ride.vehicleColor || 'Not specified'}</Typography>
              <Typography><span className="font-semibold">Number:</span> {ride.vehicleNumber || 'Not specified'}</Typography>
            </div>
          </div>
        </div>
      </DialogBody>
      <DialogFooter className="flex justify-between px-6 pb-6">
        <Button variant="outlined" color="red" onClick={onClose} className="mr-2">
          Close
        </Button>
        <div className="flex items-center gap-2">
          <Button color="green" onClick={() => {
            if (ride.customerPhone) {
              window.open(`tel:${ride.customerPhone}`);
            }
          }} disabled={!ride.customerPhone}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            Call Customer
          </Button>
          <a 
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ride.pickup)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            Get Directions
          </a>
        </div>
      </DialogFooter>
    </Dialog>
  );
};

export default RideAcceptedPopup;
