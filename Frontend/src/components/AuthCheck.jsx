import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '@config/firebase.js';// Make sure to replace with your actual Firebase configuration

const AuthCheck = (Component) => {
    return (props) => {
        const navigate = useNavigate();

        useEffect(() => {
            console.log('AuthCheck');
            const handleAuthChange = (user) => {
                if (!user) {
                    // User is signed out, navigate to login page
                    localStorage.setItem('isLoggedOut', 'true');
                    navigate('/admin/login');
                } else {
                    // User is signed in, remove the logout flag
                    localStorage.removeItem('isLoggedOut');
                }
            };

            const unsubscribe = onAuthStateChanged(auth, handleAuthChange);

            const handleStorageEvent = (event) => {
                if (event.key === 'isLoggedOut' && event.newValue === 'true') {
                    navigate('/admin/login');
                }
            };

            window.addEventListener('storage', handleStorageEvent);

            return () => {
                unsubscribe();
                window.removeEventListener('storage', handleStorageEvent);
            };
        }, [navigate]);

        return <Component {...props} />;
    };
};

export default AuthCheck;
