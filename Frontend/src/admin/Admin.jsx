import React, { useEffect, useState } from 'react';
import { fetchAllTestData } from '@config/test';
import { Dialog } from '@material-tailwind/react';
import AdminForm from './AdminForm';
import { AuthCheck } from '@components';


// LIBS
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
  Button,
} from "@material-tailwind/react";

import { useLocation, useNavigate, useParams } from 'react-router-dom';


function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="h-3 w-3"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  );
}


const Admin = () => {

  const navigate = useNavigate();


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

  const handleNavigation = (link) => {
    navigate(link);
  }

  return (
    <>

      <div className='flex flex-wrap lg:flex-row justify-evenly gap-4 lg:gap-2 mt-16'>

        <Card color="gray" variant="gradient" className="w-full max-w-[20rem] p-8">
          <CardHeader
            floated={false}
            shadow={false}
            color="transparent"
            className="m-0 mb-8 rounded-none border-b border-white/10 pb-8 text-center"
          >
            <Typography
              variant="small"
              color="white"
              className="font-normal text-3xl uppercase"
              onClick={() => handleNavigation('/admin/holiday')}
            >
              <span className="hover:text-orange-400 hover:font-semibold cursor-pointer hover:underline">
                Holiday
              </span>
            </Typography>
            {/* <Typography
            variant="h1"
            color="white"
            className="mt-6 flex justify-center gap-1 text-7xl font-normal"
          >
            <span className="mt-2 text-4xl">$</span>29{" "}
            <span className="self-end text-4xl">/mo</span>
          </Typography> */}
          </CardHeader>
          <CardBody className="p-0">
            <ul className="flex flex-col gap-2">
              <li className="flex items-center gap-4">
                <span className="rounded-full border border-white/20 bg-white/20 p-1">
                  <CheckIcon />
                </span>
                <Typography className="font-normal"
                  onClick={() => handleNavigation('/admin/holiday')}
                >
                  <span className="hover:text-blue-400 hover:font-semibold cursor-pointer
                  hover:underline
                  ">
                    Home
                  </span>
                </Typography>
              </li>
              <li className="flex items-center gap-4">
                <span className="rounded-full border border-white/20 bg-white/20 p-1">
                  <CheckIcon />
                </span>
                <Typography className="font-normal"
                  onClick={() => handleNavigation('/admin/holiday/packages')}
                >
                  <span className="hover:text-blue-400 hover:font-semibold cursor-pointer
                   hover:underline">
                    ALL Packages
                  </span>


                </Typography>
              </li>

              <li className="flex items-center gap-4">
                <span className="rounded-full border border-white/20 bg-white/20 p-1">
                  <CheckIcon />
                </span>
                <Typography className="font-normal"
                  onClick={() => handleNavigation('/admin/holiday/addpackage')}
                >
                  <span className="hover:text-blue-400 hover:font-semibold cursor-pointer
                  hover:underline
                  ">
                    Create New Package
                  </span>
                </Typography>
              </li>

            </ul>
          </CardBody>
          {/* <CardFooter className="mt-12 p-0">
          <Button
            size="lg"
            color="white"
            className="hover:scale-[1.02] focus:scale-[1.02] active:scale-100"
            ripple={false}
            fullWidth={true}
        >
            Buy Now
          </Button>
        </CardFooter> */}
        </Card >

        {/*  */}
        <Card
          color="gray"
          variant="gradient"
          className="w-full max-w-[20rem] p-8 opacity-50 cursor-not-allowed"
        >
          <CardHeader
            floated={false}
            shadow={false}
            color="transparent"
            className="m-0 mb-8 rounded-none border-b border-white/10 pb-8 text-center"
          >
            <Typography
              variant="small"
              color="white"
              className="font-normal text-3xl uppercase"
            >
              <span className="hover:text-gray-400 font-semibold cursor-not-allowed">
                AirPort Taxi
              </span>
            </Typography>
          </CardHeader>
          <CardBody className="p-0">
            <ul className="flex flex-col gap-2">
              <li className="flex items-center gap-4">
                <span className="rounded-full border border-white/20 bg-white/20 p-1">
                  <CheckIcon />
                </span>
                <Typography className="font-normal">
                  <span className="hover:text-gray-400 font-semibold cursor-not-allowed">
                    Home
                  </span>
                </Typography>
              </li>
              <li className="flex items-center gap-4">
                <span className="rounded-full border border-white/20 bg-white/20 p-1">
                  <CheckIcon />
                </span>
                <Typography className="font-normal">
                  <span className="hover:text-gray-400 font-semibold cursor-not-allowed">
                    Rides
                  </span>
                </Typography>
              </li>
            </ul>
          </CardBody>
        </Card>


        {/*  */}
        <Card
          color="gray"
          variant="gradient"
          className="w-full max-w-[20rem] p-8 opacity-50 cursor-not-allowed"
        >
          <CardHeader
            floated={false}
            shadow={false}
            color="transparent"
            className="m-0 mb-8 rounded-none border-b border-white/10 pb-8 text-center"
          >
            <Typography
              variant="small"
              color="white"
              className="font-normal text-3xl uppercase"
            >
              <span className="hover:text-gray-400 font-semibold cursor-not-allowed">
                International
              </span>
            </Typography>
          </CardHeader>
          <CardBody className="p-0">
            <ul className="flex flex-col gap-2">
              <li className="flex items-center gap-4">
                <span className="rounded-full border border-white/20 bg-white/20 p-1">
                  <CheckIcon />
                </span>
                <Typography className="font-normal">
                  <span className="hover:text-gray-400 font-semibold cursor-not-allowed">
                    Home
                  </span>
                </Typography>
              </li>
              <li className="flex items-center gap-4">
                <span className="rounded-full border border-white/20 bg-white/20 p-1">
                  <CheckIcon />
                </span>
                <Typography className="font-normal">
                  <span className="hover:text-gray-400 font-semibold cursor-not-allowed">
                    Packages
                  </span>
                </Typography>
              </li>
            </ul>
          </CardBody>
        </Card>






      </div>

    </>
  );
}

export default AuthCheck(Admin);
