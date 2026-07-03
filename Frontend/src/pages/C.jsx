import React from 'react';
import { useNavigate } from 'react-router-dom';


const C = () => {
    const navigate = useNavigate();

    return (
        <div>
            <h1>Page C</h1>
            <button onClick={() => navigate('/b')}>Go to B</button>
        </div>
    );
};

export default C;