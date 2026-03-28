import express from 'express';
import { db } from './firebase.js';

const router = express.Router();

/**
 * @route   POST /ivr
 * @desc    Exotel IVR Webhook for voice routing
 * @access  Public (Exotel Passthru)
 */
router.post('/', async (req, res) => {
  // 1. Extract the caller's phone number from Exotel request
  console.log('📬 NEW IVR REQUEST RECEIVED');
  console.log('📦 Request Body:', JSON.stringify(req.body));
  console.log('📦 Request Query:', JSON.stringify(req.query));

  let rawFrom = req.body.From || req.query.From || req.body.from || req.query.from || req.body.Caller || req.query.Caller;

  if (!rawFrom) {
    console.warn('⚠️ Exotel Error: No phone parameter found in body or query!');
    return res.status(400).send('<Response><Say>Error: Identification failed.</Say></Response>');
  }

  // 1.1 Normalize to last 10 digits as per your suggestion
  // This removes spaces, +91, 0, etc. and takes only the actual number
  const from = rawFrom.replace(/\D/g, '').slice(-10);

  console.log(`🔎 LOOKUP: Raw[${rawFrom}] -> Normalized[${from}]`);

  try {
    // 2. Lookup the caller (Check both Farmers and Panchayat Users)
    let user = null;
    
    // Search in Farmers collection (Field: 'phone')
    console.log(`📡 Querying Farmers collection for phone == "${from}"...`);
    let farmerSnapshot = await db.collection('farmers').where('phone', '==', from).limit(1).get();
    
    if (!farmerSnapshot.empty) {
      user = farmerSnapshot.docs[0].data();
      console.log('✅ Found in Farmers');
    } else {
      // Search in Users collection (Field: 'contactPhone')
      console.log(`📡 Querying Users collection for contactPhone == "${from}"...`);
      let userSnapshot = await db.collection('users').where('contactPhone', '==', from).limit(1).get();
      
      if (!userSnapshot.empty) {
        user = userSnapshot.docs[0].data();
        console.log('✅ Found in Users');
      }
    }

    res.set('Content-Type', 'text/xml');

    // 3. Handle Unregistered User
    if (!user) {
      console.log(`❌ BLOCK: Number ${from} not found in database.`);
      return res.send(`
        <Response>
          <Say>Welcome to GraamVaani. Your number ${from} is not registered. Please visit our website to register. Thank you.</Say>
        </Response>
      `.trim());
    }

    // 4. Handle Registered User
    // From photo: the field name is "language"
    const userLang = user.language || user.preferredLanguage || 'Hindi';
    const userName = user.name || user.panchayatName || 'Farmer';
    const calledNumber = req.body.To || '';
    let category = 'local';
    
    // Simple routing based on suffix (if you have multiple numbers)
    if (calledNumber.endsWith('243')) category = 'global';
    else if (calledNumber.endsWith('242')) category = 'national';

    console.log(`✅ Registered user: ${userName} (Routing to ${category} in ${userLang})`);

    // 5. Fetch the latest active bulletin
    const bulletinSnapshot = await db.collection('bulletins')
      .where('isActive', '==', true)
      .where('language', '==', userLang)
      .where('category', '==', category)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (!bulletinSnapshot.empty) {
      const bulletin = bulletinSnapshot.docs[0].data();
      const userName = user.name || user.panchayatName || 'Farmer';
      
      return res.send(`
        <Response>
          <Say voice="Polite">Namaste ${userName}, welcome back to GraamVaani. Playing your ${category} news in ${userLang}.</Say>
          <Play>${bulletin.audioUrl}</Play>
        </Response>
      `.trim());
    }

    return res.send(`
      <Response>
        <Say>Welcome back. We don't have a new bulletin for you yet in ${userLang}. Please check back later.</Say>
      </Response>
    `.trim());

  } catch (err) {
    console.error('❌ Firebase/Server Error:', err.message);
    
    // Fallback XML response
    res.set('Content-Type', 'text/xml');
    return res.send(`
      <Response>
        <Say>Sorry, we are experiencing technical difficulties. Please call again later.</Say>
      </Response>
    `.trim());
  }
});

export default router;
