import { db } from "./firebase";
import { doc, getDoc, setDoc, getDocs, collection, query, where } from "firebase/firestore";


const fetchAllTestData = async () => {
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

export { fetchAllTestData }