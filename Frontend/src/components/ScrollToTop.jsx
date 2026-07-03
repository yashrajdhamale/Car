import React, { useEffect } from 'react';

const ScrollToTop = (WrappedComponent) => () => {
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    return <WrappedComponent />;
    // return <WrappedComponent {...props} />;
};

export default ScrollToTop;
