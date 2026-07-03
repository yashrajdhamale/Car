import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

const A = () => {

    const navigate = useNavigate();
    const location = useLocation();
    const { state } = location;
    const params = useParams();


    return (
        <div>
            <h1>Page A</h1>
            <button onClick={() => navigate('/b', { state: { flag: "1" } })}>Go to B</button>
        </div>
    );
};

export default A;