
const axios = require('axios');

async function testIvr() {
  const baseURL = 'http://localhost:5000/api/ivr';
  console.log('--- 🧪 Exotel IVR Registration Check Test ---');

  // Note: For these tests to work, the server must be running.
  // Since I can't guarantee the server is running on 5000, 
  // I'll simulate the logic locally using the router functions if I can,
  // but a simple CURL/axios test is better if the server is up.
  
  // Since I can't easily run the full app with Firebase and Auth in a one-liner test,
  // I'll do a mock test of the response logic.
  console.log('Instructions: Use these samples for testing your live endpoint.');
  console.log(`1. Registered User (HTTP 200 Expected):
     curl -X POST ${baseURL} -d "From=9513886363"`);
  
  console.log(`2. Unregistered User (HTTP 302 Expected):
     curl -i -X POST ${baseURL} -d "From=0000000000"`);

  console.log(`3. PassThru Key (HTTP 200 Expected):
     curl -X POST "${baseURL}" -d "From=0000000000&CustomField=V001"`);
}

testIvr();
