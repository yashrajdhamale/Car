import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../src/config/firebase.js";

// Configuration - Update these values as needed
const TEST_DRIVER_ID = "YOUR_DRIVER_ID"; // Replace with an actual driver ID
const TEST_STATE = "maharashtra"; // The state you're testing with

async function addTestHolidayRoute() {
  try {
    console.log('➕ Adding test holiday route...');
    
    const routeData = {
      driverId: TEST_DRIVER_ID,
      state: TEST_STATE.toLowerCase(),
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'holidayRoutes'), routeData);
    
    console.log('✅ Test holiday route added successfully!');
    console.log('Document ID:', docRef.id);
    console.log('Route data:', routeData);
    
    return docRef.id;
  } catch (error) {
    console.error('❌ Error adding test holiday route:', error);
    throw error;
  }
}

// Run the function
addTestHolidayRoute()
  .then(() => {
    console.log('\n✨ Test route added successfully!');
    console.log(`You can now try booking a holiday package for ${TEST_STATE}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
