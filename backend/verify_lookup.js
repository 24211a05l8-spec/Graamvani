import admin from 'firebase-admin';
import { db } from './firebase.js';

async function verifyLookup() {
  console.log('--- 🧪 Verifying IVR Lookup Fix ---');
  
  if (!db) {
    console.error('❌ Firestore DB not initialized. Check firebase-key.json');
    return;
  }

  try {
    // 1. Find the specific user from the screenshot
    const testPhone = "9440536855";
    console.log(`📡 Searching for specific user with phone: ${testPhone}`);

    // Wait! Let's check both farmers and users
    const userSnap = await db.collection('users').where('phone', '==', testPhone).get();
    const farmerSnap = await db.collection('farmers').where('phone', '==', testPhone).get();
    
    if (userSnap.empty && farmerSnap.empty) {
      console.log('⚠️ Number 9440536855 not found in either collection!');
      // Let's try finding ANY farmer just to be sure
      const anyFarmer = await db.collection('farmers').limit(1).get();
      if (!anyFarmer.empty) {
        console.log(`ℹ️ Found a different farmer: ${anyFarmer.docs[0].data().name} (Phone: ${anyFarmer.docs[0].data().phone})`);
      }
      return;
    }

    const testUser = !farmerSnap.empty ? farmerSnap.docs[0].data() : userSnap.docs[0].data();
    console.log(`📡 User found: ${testUser.name || testUser.panchayatName}`);

    // 2. Simulate the IVR normalization
    const normalized = testPhone.replace(/\D/g, '').slice(-10);
    const fromNum = parseInt(normalized, 10);
    console.log(`🔎 Normalized: ${normalized} (Int: ${fromNum})`);

    // 3. Test the queries
    const queries = [
      db.collection('farmers').where('phone', '==', normalized).get(),
      db.collection('farmers').where('phone', '==', fromNum).get(),
      db.collection('users').where('phone', '==', normalized).get(),
      db.collection('users').where('phone', '==', fromNum).get(),
      db.collection('users').where('contactPhone', '==', normalized).get(),
      db.collection('users').where('contactPhone', '==', fromNum).get()
    ];

    const results = await Promise.all(queries);
    const match = results.find(snap => !snap.empty);

    if (match) {
      const matchedUser = match.docs[0].data();
      console.log(`✅ SUCCESS: Found user ${matchedUser.panchayatName || matchedUser.name} by mimicking IVR logic.`);
      
      const matchIndex = results.findIndex(snap => !snap.empty);
      const labels = [
        'farmers.phone (str)', 'farmers.phone (num)', 
        'users.phone (str)', 'users.phone (num)', 
        'users.contactPhone (str)', 'users.contactPhone (num)'
      ];
      console.log(`🎯 Match found in: ${labels[matchIndex]}`);
    } else {
      console.error('❌ FAILURE: Could not find user even with normalized phone number.');
    }

  } catch (err) {
    console.error('❌ Error during verification:', err.message);
  }
}

verifyLookup();
