import { db } from './firebase.js';

async function dumpLastLog() {
  console.log('--- 🔎 Dumping Last Debug Log ---');
  
  try {
    const snapshot = await db.collection('debug_calls').orderBy('timestamp', 'desc').limit(1).get();
    
    if (snapshot.empty) {
      console.log('❌ No logs found.');
      return;
    }

    const data = snapshot.docs[0].data();
    console.log('--- 📋 LOG DETAILS ---');
    console.log(JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

dumpLastLog();
