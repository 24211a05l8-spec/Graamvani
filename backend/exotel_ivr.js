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
  // Exotel sends 'From' in the POST body or query params
  let rawFrom = req.body.From || req.query.From || req.body.from || req.query.from;

  if (!rawFrom) {
    console.warn('⚠️ Exotel Warning: No "From" parameter found. Request Body:', JSON.stringify(req.body));
    return res.status(400).send('<Response><Say>Error: No phone number received.</Say></Response>');
  }

  // 1.1 Normalize phone number (Remove +91, 0, or non-digits)
  const from = rawFrom.replace(/\D/g, '').replace(/^91/, '').replace(/^0/, '');

  console.log(`🎙️ Exotel Call from raw: ${rawFrom} (Normalized for DB Lookup: ${from})`);

  try {
    // 2. Lookup the caller (Check both Farmers and Panchayat Users)
    let user = null;
    
    // Search in Farmers
    let farmerSnapshot = await db.collection('farmers').where('phone', '==', from).limit(1).get();
    
    // If no direct match, try matching with the last 10 digits (fallback for existing data)
    if (farmerSnapshot.empty && from.length >= 10) {
      const tenDigits = from.slice(-10);
      farmerSnapshot = await db.collection('farmers').where('phone', '==', tenDigits).limit(1).get();
    }

    if (!farmerSnapshot.empty) {
      user = farmerSnapshot.docs[0].data();
    } else {
      // Search in Panchayat Users
      let userSnapshot = await db.collection('users').where('contactPhone', '==', from).limit(1).get();
      
      // Fallback for Users
      if (userSnapshot.empty && from.length >= 10) {
        const tenDigits = from.slice(-10);
        userSnapshot = await db.collection('users').where('contactPhone', '==', tenDigits).limit(1).get();
      }

      if (!userSnapshot.empty) {
        user = userSnapshot.docs[0].data();
      }
    }

    res.set('Content-Type', 'text/xml');

    // 3. Handle Unregistered User (STRICT)
    if (!user) {
      console.log(`⚠️ Unregistered caller blocked: ${from}`);
      return res.send(`
        <Response>
          <Say>Welcome to GraamVaani. Your number is not registered. Please visit our website to register and receive hyper-local news updates in your language. Thank you.</Say>
        </Response>
      `.trim());
    }

    // 4. Handle Registered User
    const userLang = user.preferredLanguage || 'Hindi';
    const calledNumber = req.body.To || '';
    let category = 'local';
    
    // Simple routing based on suffix (if you have multiple numbers)
    if (calledNumber.endsWith('243')) category = 'global';
    else if (calledNumber.endsWith('242')) category = 'national';

    console.log(`✅ Registered user: ${from} (Routing to ${category} in ${userLang})`);

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
