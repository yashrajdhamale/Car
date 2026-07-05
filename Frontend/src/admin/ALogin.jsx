import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Fingerprint } from 'lucide-react'
import { Alert } from '@material-tailwind/react';
import { useForm } from 'react-hook-form';

// IMPORTS USER CONTEXT
import { UserContext } from '../context/UserContext';

function ALogin() {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

    // USER CONTEXT
    const { userDataContext, setUserDataContext } = useContext(UserContext);

    // NAVIGATE
    const navigate = useNavigate();

    const [email, setEmail] = useState('prayagb@gmail.com');
    const [password, setPassword] = useState('pp123456');
    const [AdminPin, setAdminPin] = useState('909090');
    const [ButtonContent, setButtonContent] = useState('Get Started')

    const { register, handleSubmit, formState: { errors } } = useForm(); // Initialize the useForm hook


    const validationRules = {
        email: {
            required: 'Email is required',
            pattern: {
                value: /\S+@\S+\.\S+/,
                message: 'Invalid email address',
            }
        },
        password: {
            required: 'Password is required',
            minLength: {
                value: 6,
                message: 'Password must be at least 6 characters long',
            }
        }
    };



    const UserTypes = [
        { value: 'user', label: 'User', image: 'https://images.unsplash.com/photo-1582537683185-922141f18eaa' },
        { value: 'partner', label: 'Partner', image: 'https://images.unsplash.com/photo-1570466153480-ad80ec511246' },
        { value: 'admin', label: 'Admin', image: 'https://images.unsplash.com/photo-1472148439583-1f4cf81b80e0' }
    ];


    const [selectedType, setSelectedType] = useState(UserTypes[0]);

    const handleChange = (e) => {
        const selectedValue = e.target.value;
        const selectedUserType = UserTypes.find(userType => userType.value === selectedValue);
        setSelectedType(selectedUserType);
    };




    const onSubmit = async (data) => {
        // Your existing onSubmit logic
        // console.log(data); // This will log the form data

        const { email, password } = data;

        // console.log(email, password);

        if (selectedType.value === 'admin') {

            // e.preventDefault();
            try {
                setButtonContent("Authenticating Credential ");
                const response = await fetch(`${API_BASE}/api/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password, role: selectedType.value }),
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result?.message || "Login failed");
                console.log('Login successful:', result);
                localStorage.setItem("auth_custom_token", result.customToken || "");
                localStorage.setItem("auth_user", JSON.stringify(result.user || {}));

                const isAdmin = await handleSubmitVerifyAdmin(result.user);


                if (isAdmin) {
                    // alert("CONFIRMED");
                    // Navigate to the admin page
                    navigate("/admin");
                } else {
                    console.log("ERROR IN AUTHENTICATION");
                    alert("ERROR IN AUTHENTICATION");
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('Login error:' + error.message);


                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }

        }
        else {
            alert(selectedType.value + ' login coming soon');
        }

    };

    const handleSubmitVerifyAdmin = async (user) => {
        try {
            if (user && (user.role === "admin" || user.role === "superadmin" || user.role === "supperadmin")) {
                setUserDataContext({ id: user.uid, data: user });
                return true;
            }
            console.log("No user found with email", email, "and role ADMIN.");
            return false;
        } catch (error) {
            console.error("Error verifying admin:", error);
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            throw error;
        }
    };


    const [ForgotPasswordDisbale, setForgotPasswordDisbale] = useState(false);


    const handleForgotPassword = async (e) => {

        if (ForgotPasswordDisbale == true) {
            alert("Email is already Sent");
            return;
        }

        setForgotPasswordDisbale(true);
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE}/api/auth/password-reset`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result?.message || "Password reset failed");
            alert(result.message || 'Reset link sent to your email address!');
            setEmail('');
        } catch (error) {
            console.error(error);
            alert(error.message);

        }
    };

    // const navigateToRegister = (e) => {
    //     e.preventDefault();
    //     navigate('/register');
    // };



    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const images = [
        "https://images.unsplash.com/photo-1582537683185-922141f18eaa",
        "https://images.unsplash.com/photo-1472148439583-1f4cf81b80e0",
        "https://images.unsplash.com/photo-1570466153480-ad80ec511246"
    ];

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 2000); // Change image every 5 seconds

        return () => clearInterval(intervalId);
    }, []);




    return (
        // <div className="flex justify-center items-center h-screen">
        //     <div className="grid grid-cols-1 lg:grid-cols-2">
        //         <div className="relative flex items-end px-4 pb-10 pt-60 sm:px-6 sm:pb-16 md:justify-center lg:px-8 lg:pb-24">
        //             <div className="absolute inset-0">



        // https://images.unsplash.com/photo-1582537683185-922141f18eaa --user
        // https://images.unsplash.com/photo-1512531123205-560f5974e686 
        // https://images.unsplash.com/photo-1472148439583-1f4cf81b80e0 --admin
        // https://images.unsplash.com/photo-1570466153480-ad80ec511246 --taxi




        <div className="container-fluid bg-gray-100 p-4 lg:p-0 min-h-screen flex flex-col items-center justify-center bg-cover bg-center"
            style={{ backgroundImage: `url(${selectedType.image})`, backgroundRepeat: "repeat" }}>
            <div className="bg-white bg-opacity-95 shadow-2xl rounded-lg p-1 lg:p-0 max-w-2xl w-full" >
                {/* <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-black flex gap-2 lg:text-3xl">
                        <span>
                            TRAVELOG HOLIDAYS
                        </span>
                    </h1>
                </div> */}
                <div className="grid gap-4">
                    <div className="flex items-center justify-center px-4 py-5 sm:px-6 sm:py-16 lg:px-0 lg:py-15">
                        <div className="xl:mx-auto xl:w-full xl:max-w-sm 2xl:max-w-md">
                            <h2 className="text-3xl font-bold leading-tight text-black sm:text-4xl">
                                {selectedType.value === 'user' ? "User Sigin" : ""}
                                {selectedType.value === 'partner' ? "Partner Sigin" : ""}
                                {selectedType.value === 'admin' ? "Admin Sigin" : ""}
                            </h2>



                            <p className="mt-2 text-sm text-gray-600">
                                {/* Don&apos;t have an account?{' '} */}
                                <a

                                    className="font-semibold text-red-600 transition-all duration-200 hover:underline"
                                // onClick={navigateToRegister}
                                >



                                    {selectedType.value === 'user' ? "*User login, book rides now" : ""}
                                    {selectedType.value === 'partner' ? "*Partner login, start rides now" : ""}
                                    {selectedType.value === 'admin' ? "*Admin login BeCareful while editing" : ""}
                                </a>
                            </p>

                            <form className="mt-8" onSubmit={handleSubmit(onSubmit)}>
                                <div className="space-y-5">
                                    <div>
                                        <label htmlFor="" className="text-lg font-medium text-gray-900">
                                            Select type
                                        </label>
                                        <div className="mt-2">
                                            <select
                                                className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-lg placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                                value={selectedType.value}
                                                onChange={handleChange}
                                            >
                                                {UserTypes.map((userType) => (
                                                    <option key={userType.value} value={userType.value}>
                                                        {userType.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="" className="text-base font-medium text-gray-900">
                                            {' '}
                                            Email address{' '}
                                        </label>
                                        <div className="mt-2">
                                            <input
                                                className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                                type="email"
                                                name="email"
                                                placeholder="Email Address"
                                                // value={email}
                                                {...register('email', validationRules.email)} // Register email field with validation rules
                                                defaultValue={email}
                                            />
                                            {errors.email && <p className="text-red-500">{errors.email.message}</p>}


                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="" className="text-base font-medium text-gray-900">
                                                {' '}
                                                Password{' '}
                                            </label>
                                            <a

                                                className={`text-sm font-semibold text-black hover:underline
                                                cursor-pointer
                                                ${ForgotPasswordDisbale === true ? "bg-red-100 text-gray-700" : ""}
                                                `}
                                                disabled={ForgotPasswordDisbale}
                                                onClick={(e) => handleForgotPassword(e)}
                                            >
                                                {' '}
                                                Forgot password?{' '}
                                            </a>
                                        </div>
                                        <div className="mt-2">
                                            <input
                                                className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                                type="password"
                                                name="password"
                                                autoComplete="current-password"
                                                placeholder="Password"
                                                // value={password}
                                                // onChange={(e) => setPassword(e.target.value)}
                                                {...register('password', { required: true })}
                                                defaultValue={password}

                                            ></input>

                                            {errors.password && <span className="text-red-500">Password is required</span>}


                                        </div>
                                    </div>
                                    {/*
                                <div>
                                    <label htmlFor="" className="text-base font-medium text-gray-900">
                                        {' '}
                                        Admin Pin{' '}
                                    </label>
                                    <div className="mt-2">
                                        <input
                                            className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                            type="password"
                                            name="adminpin"
                                            autoComplete="current-pin"
                                            placeholder="Email Address"
                                            value={email}
                                            onChange={(e) => setAdminPin(e.target.value)}
                                        ></input>
                                    </div>
                                </div> */}

                                    <div>
                                        <button
                                            type="submit"
                                            className={`inline-flex w-full items-center justify-center rounded-md px-3.5 py-2.5 font-semibold leading-7 text-white hover:bg-black/80 relative
                                                
    ${(ButtonContent === "Get Started") ? "bg-black" : "bg-gray-800"}
                                                
    `}
                                            onClick={(e) => handleSubmit(e)}
                                            disabled={(ButtonContent === "Get Started") ? false : true}
                                        >
                                            {ButtonContent}

                                            {ButtonContent === "Get Started" ?
                                                <ArrowRight className="ml-2" size={23} />
                                                :
                                                <Fingerprint className="ml-2" size={23} />}

                                            {/* Add animation element */}
                                            {ButtonContent === "Authenticating Credential " && (
                                                <div className="absolute inset-0 bg-black opacity-50 rounded-md"></div>
                                            )}
                                            {ButtonContent === "Authenticating Credential " && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                                                </div>
                                            )}
                                        </button>

                                    </div>
                                </div>
                            </form>

                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}

export default ALogin;
