import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });

const app = express();
const PORT = 5000;

// Allow your frontend (localhost:5173) to access backend
app.use(cors());
app.use(express.json());

// Route for autosuggest
app.get('/api/places', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Query parameter q is required' });

    const clientId = process.env.MAPMYINDIA_CLIENT_ID;
    const clientSecret = process.env.MAPMYINDIA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return res.status(500).json({ error: 'Missing Mappls credentials in frontend .env' });
    }

    try {
        // Step 1: Get OAuth token
        const tokenResponse = await fetch('https://outpost.mapmyindia.com/api/security/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret
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
