import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { usePreviousRoute } from '../hooks/usePreviousRoute';

const B = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const previousLocation = usePreviousRoute();
    const { state } = location;
    const params = useParams();

    // useEffect(() => {
    //     // Check if the user is navigating from C
    //     console.log('navigate', previousLocation.pathname);
    //     if (previousLocation.pathname === '/c') {
    //         navigate('/not-authorized');
    //     }
    // }, [previousLocation, navigate]);
    const [dataaloowed, setdataaloowed] = useState(false);

    useEffect(() => {
        console.log(state.flag);
        if (state.flag == "1") {
            setdataaloowed(true);
        }
        else {
        }
    }, []);

    return (
        <>
            {dataaloowed ?
                <div>
                    not access
                </div>
                :

                <div>

                    <h1>Page B</h1>
                    <button onClick={() => navigate('/c')}>Go to C</button>
                </div>
            }
        </>
    );
};

export default B;
