import { auth } from './firebase';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_BACKEND || "http://localhost:5000";

// ---------------------- FETCH FUNCTIONS ---------------------------------

export const fetchUniqueHolidays = async () => {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/admin/packages`);
        if (!response.ok) throw new Error("Failed to fetch packages");
        const data = await response.json();
        const packages = data.packages || [];
        
        const locations = [];
        packages.forEach((pkg) => {
            if (pkg.location && !locations.includes(pkg.location)) {
                locations.push(pkg.location);
            }
        });
        return locations;
    } catch (error) {
        console.error('Error fetching holidays:', error);
        return [];
    }
};

export const fetchHolidayData = async (location_id) => {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/admin/packages/${encodeURIComponent(location_id)}`);
        if (!response.ok) throw new Error("Failed to fetch package data");
        const data = await response.json();
        return data.package;
    } catch (error) {
        console.error('Error fetching document:', error);
        return null;
    }
};

export const fetchAllHolidayData = async () => {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/admin/packages`);
        if (!response.ok) throw new Error("Failed to fetch packages");
        const data = await response.json();
        return data.packages || [];
    } catch (error) {
        console.error('Error fetching holidays:', error);
        return [];
    }
};

export const fetchHolidaysByLocation = async (locationName) => {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/admin/packages`);
        if (!response.ok) throw new Error("Failed to fetch packages");
        const data = await response.json();
        const packages = data.packages || [];
        return packages.filter(pkg => pkg.location === locationName);
    } catch (error) {
        console.error('Error fetching holidays by location:', error);
        return [];
    }
};

export const getUserDocument = async (userId) => {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.log('No current user authenticated in Firebase SDK');
            return null;
        }
        
        const token = await currentUser.getIdToken();
        if (!token) {
            console.log('No ID token available');
            return null;
        }

        const response = await fetch(`${BACKEND_BASE_URL}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.log('Error retrieving user document from backend status:', response.status);
            return null;
        }

        const data = await response.json();
        const profile = data.user;
        if (!profile) return null;

        // Ensure we have required fields with defaults to match expected format
        const userWithDefaults = {
            status: profile.status || 'active',
            createdAt: profile.createdAt || new Date().toISOString(),
            ...profile,
            ...(profile.userData || {}),
            ...(profile.driverData || {}),
            role: (profile.role || profile.type || 'user').toLowerCase().trim()
        };
        
        // Clean up any undefined or null values
        Object.keys(userWithDefaults).forEach(key => {
            if (userWithDefaults[key] === undefined || userWithDefaults[key] === null) {
                delete userWithDefaults[key];
            }
        });
        
        return userWithDefaults;
    } catch (error) {
        console.error('Error retrieving user document:', error);
        throw error;
    }
};

// ---------------------- CREATE / ADD FUNCTIONS (Unused but kept for API stability) ---------------------------------

export const addDocument = async (collectionPath, data) => {
    console.warn("addDocument is deprecated. Please use specific backend APIs instead.");
    return null;
};

export const setDocument = async (collectionPath, documentId, data) => {
    console.warn("setDocument is deprecated. Please use specific backend APIs instead.");
};

// ---------------------- CHECK FUNCTIONS ---------------------------------

export const checkIfUserExists = async (userId) => {
    try {
        const userDoc = await getUserDocument(userId);
        return !!userDoc;
    } catch (error) {
        console.error('Error checking user existence:', error);
        return false;
    }
};

// ---------------------- STORAGE FUNCTIONS ---------------------------------

export const uploadFileToStorage = async (folderName, fileName, file) => {
    console.warn("uploadFileToStorage is deprecated. Please use backend file upload routes instead.");
    return "";
};
