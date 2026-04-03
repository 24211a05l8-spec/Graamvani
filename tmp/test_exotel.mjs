import axios from 'axios';
const URL = 'http://localhost:5000/api/ivr';
const API_KEY = '3feb0ded51b30b44141b3d95de891684c0182f0e0a710f1c';
const API_TOKEN = 'facbf46abd8a31a83444c76c727f96b240b6a07525443af6';

async function test() {
  console.log('--- 🧪 Testing Exotel Webhook Simulation ---');
  
  const auth = Buffer.from(`${API_KEY}:${API_TOKEN}`).toString('base64');
  
  try {
    // Test Case 1: Standard Exotel POST (application/x-www-form-urlencoded)
    console.log('\n[Case 1] Sending POST with From (Capital F) and Basic Auth...');
    const res1 = await axios.post(URL, 'From=9513886363&To=09513886363&CallSid=123', {
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      }
    });
    console.log('Response XML Snippet:', res1.data.slice(0, 100));

    // Test Case 2: Lowercase from in query string
    console.log('\n[Case 2] Sending GET with from (lowercase) in query...');
    const res2 = await axios.get(`${URL}?from=919513886363&key=village_99`);
    console.log('Response XML Snippet:', res2.data.slice(0, 100));

  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.error('❌ FAILED: Server is not running on port 5000. Start it with "npm run dev" in /backend.');
    } else {
      console.error('❌ Error:', err.message);
    }
  }
}

test();
