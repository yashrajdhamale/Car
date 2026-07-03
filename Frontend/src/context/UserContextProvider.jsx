// UserContextProvider.jsx
import React, { useState, useEffect } from "react";
import { UserContext } from "./UserContext";

const UserContextProvider = ({ children }) => {
    const [userDataContext, setUserDataContext] = useState(null);

    useEffect(() => {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
            setUserDataContext(JSON.parse(storedUserData));
        }
    }, []);

    return (
        <UserContext.Provider value={{ userDataContext, setUserDataContext }}>
            {children} {/* Corrected typo */}
        </UserContext.Provider>
    );
};

export default UserContextProvider;