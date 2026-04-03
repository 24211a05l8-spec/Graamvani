import { db } from './firebase.js';

async function checkLogs() {
  console.log('--- 🧪 Checking for Live Debug Logs ---');
  
  try {
    const snapshot = await db.collection('debug_calls').orderBy('timestamp', 'desc').limit(5).get();
    
    if (snapshot.empty) {
      console.log('❌ No debug logs found in "debug_calls" collection.');
      console.log('💡 This means Exotel is NOT hitting your server at all, OR it is hitting an OLD version that doesn\'t have logging.');
      return;
    }

    console.log(`✅ Found ${snapshot.size} recent call(s):`);
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`- [${data.timestamp}] Ver: ${data.version} | From: ${data.body?.From || 'Hidden'}`);
    });

  } catch (err) {
    console.error('❌ Error checking logs:', err.message);
  }
}

checkLogs();
