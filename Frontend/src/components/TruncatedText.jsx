import React, { useState, useEffect } from 'react';
import { ClipboardList, Car } from 'lucide-react';

const TruncatedText = ({ packagename, words }) => {
    // const truncatedText = text[0].length > limit ? `${text[0].slice(0, limit)}...` : text[0];


    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768); // Adjust the breakpoint as needed
        };

        handleResize(); // Check initial size
        window.addEventListener('resize', handleResize); // Listen for window resize events

        return () => window.removeEventListener('resize', handleResize); // Clean up event listener
    }, []);


    function truncateText(text, limit) {
        console.log('Truncating', text);

        const words = text.split(' ');
        if (words.length > limit) {
            console.log('Truncating', words.slice(0, limit).join(' ') + '...');
            return words.slice(0, limit).join(' ') + '...';
        }
        return text;
    }

    return (
        <>
            {!isMobile ? packagename : truncateText(packagename, words)}
        </>
    );
};

export default TruncatedText;
