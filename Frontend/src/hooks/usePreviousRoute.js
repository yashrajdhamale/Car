import { useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';

export const usePreviousRoute = () => {
    const location = useLocation();
    const previousLocation = useRef(location);

    useEffect(() => {
        previousLocation.current = location;
    }, [location]);

    return previousLocation.current;
};
