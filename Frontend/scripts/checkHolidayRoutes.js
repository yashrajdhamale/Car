import { collection, getDocs } from "firebase/firestore";
import { db } from "../src/config/firebase.js";

async function checkHolidayRoutes() {
  try {
    console.log('🔍 Checking holiday routes in Firestore...');
    
    const routesRef = collection(db, 'holidayRoutes');
    const snapshot = await getDocs(routesRef);
    
    if (snapshot.empty) {
      console.log('❌ No holiday routes found in the database.');
      return;
    }
    
    console.log(`✅ Found ${snapshot.size} holiday routes:`);
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`\n📄 Document ID: ${doc.id}`);
      console.log('Data:', {
        driverId: data.driverId || 'N/A',
        state: data.state || 'N/A',
        isActive: data.isActive !== false, // Default to true if not set
        createdAt: data.createdAt?.toDate?.() || 'N/A',
        ...(data.updatedAt && { updatedAt: data.updatedAt.toDate() })
      });
    });
    
  } catch (error) {
    console.error('❌ Error checking holiday routes:', error);
  }
}

// Run the check
checkHolidayRoutes()
  .then(() => {
    console.log('\n✨ Holiday route check complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
