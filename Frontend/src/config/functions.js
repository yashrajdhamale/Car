import { doc, getDoc, getDocs, collection, query, addDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@config/firebase';

// ---------------------- FETCH FUNCTIONS ---------------------------------
// ---add comment to check 

export const fetchUniqueHolidays = async () => {
    try {
        const q = query(collection(db, "test"));
        const querySnapshot = await getDocs(q);

        const locations = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();

            if (!locations.includes(data.location)) {
                locations.push(data.location);
            }
        });
        return locations;
    } catch (error) {
        console.error('Error fetching holidays:', error);
    }
};

export const fetchHolidayData = async (location_id) => {
    const docRef = doc(db, "test", location_id);
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists) {
            return docSnap.data();
        } else {
            console.log('Document does not exist!');
        }
    } catch (error) {
        console.error('Error fetching document:', error);
    }
}

export const fetchAllHolidayData = async () => {
    const q = query(collection(db, "test"));
    try {
        const querySnapshot = await getDocs(q);
        const locations = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // if (!locations.includes(data.location)) {
            locations.push(data);
            // }
        });
        return locations;
    } catch (error) {
        console.error('Error fetching holidays:', error);
    }
}

export const getUserDocument = async (userId) => {
    try {
        const docSnap = await getDoc(doc(db, 'users', userId));

        if (!docSnap.exists()) {
            console.log('No user document found for ID:', userId);
            return null;
        }

        const userData = docSnap.data();
        // Ensure we have required fields with defaults
        const userWithDefaults = {
            // Default values
            status: 'active',
            createdAt: new Date().toISOString(),
            // Spread existing data (will override defaults if present)
            ...userData,
            // Ensure role is always set and normalized
            role: (userData.role || userData.type || 'user').toLowerCase().trim()
        };
        
        // Clean up any undefined or null values
        Object.keys(userWithDefaults).forEach(key => {
            if (userWithDefaults[key] === undefined || userWithDefaults[key] === null) {
                delete userWithDefaults[key];
            }
        });
        
        console.log('User document retrieved successfully:', {
            ...userWithDefaults,
            password: userWithDefaults.password ? '***' : undefined
        });
        
        return userWithDefaults;
    } catch (error) {
        console.error('Error retrieving user document:', error);
        throw error; // Re-throw to be handled by the caller
    }
}

// ---------------------- CREATE / ADD FUNCTIONS ---------------------------------

export const addDocument = async (collectionPath, data) => {
    try {
        const docRef = await addDoc(collection(db, collectionPath), data);
        console.log("Document written with ID: ", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("Error adding document: ", error);
        throw error;
    }
};

export const setDocument = async (collectionPath, documentId, data) => {
    try {
        await setDoc(doc(db, collectionPath, documentId), data);
        console.log("Document written with ID: ", documentId);
    } catch (error) {
        console.error("Error setting document: ", error);
        throw error;
    }
};

// ---------------------- CHECK FUNCTIONS ---------------------------------

export const checkIfUserExists = async (userId) => {
    try {
        const userDocRef = doc(db, 'users', userId);
        const userDocSnapshot = await getDoc(userDocRef);
        return userDocSnapshot.exists();
    } catch (error) {
        console.error('Error checking user existence:', error);
        return false;
    }
};

// ---------------------- STORAGE FUNCTIONS ---------------------------------

export const uploadFileToStorage = async (folderName, fileName, file) => {
    try {
        const filePath = `${folderName}/${fileName}`;
        const storageRef = ref(storage, filePath);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading file to Firebase Storage: ", error);
        throw error;
    }
};
