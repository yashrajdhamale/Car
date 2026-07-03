// server.js
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Allow your frontend (localhost:5173) to access backend
app.use(cors());
app.use(express.json());

// Replace with your actual Client ID & Secret
const CLIENT_ID = '96dHZVzsAuvb6Wy5ntdNlT7uUApA19NPGDbxDUA7Fme5nF128P4w5x89cBNWT6JSjmYiJ4BKaCx04bs-Gs96cg==';
const CLIENT_SECRET = 'lrFxI-iSEg-8n-FLa6_5IPEn10zirFVAhC0-ohq98ko4H5N-czUkVv_v265JrXqHGKVs1tBVQZDmCfmgjgeXOmg6Q6A6tkmJ';

// Route for autosuggest
app.get('/api/places', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Query parameter q is required' });

    try {
        // Step 1: Get OAuth token
        const tokenResponse = await fetch('https://outpost.mapmyindia.com/api/security/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET
            })
        });

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        if (!accessToken) return res.status(500).json({ error: 'Failed to get access token' });

        // Step 2: Call Places API
        const placesResponse = await fetch(`https://atlas.mappls.com/api/places/search/json?query=${encodeURIComponent(query)}&region=IND`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const placesData = await placesResponse.json();

        // Step 3: Map to frontend-friendly format
        const suggestions = (placesData.candidates || []).map(item => ({
            placeName: item.placeName || item.name,
            placeAddress: item.placeAddress || item.address
        }));

        res.json({ suggestedLocations: suggestions });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
