import express from 'express';
import admin from 'firebase-admin';
import { db } from './firebase.js';

const router = express.Router();

/**
 * @route   POST /ivr
 * @desc    Exotel IVR Webhook for voice routing
 * @access  Public (Exotel Passthru)
 */
router.post('/', async (req, res) => {
  // 1. Extract the caller's phone number (Universal detection)
  console.log('--- 📞 NEW INCOMING IVR CALL ---');
  console.log('📦 Body:', JSON.stringify(req.body));
  console.log('📦 Query:', JSON.stringify(req.query));

  const rawFrom = req.body.From || req.query.From || 
                  req.body.from || req.query.from || 
                  req.body.Caller || req.query.Caller || 
                  req.body.phoneNumber || req.query.phoneNumber;

  if (!rawFrom) {
    console.warn('❌ CRITICAL: No phone number found in Exotel request!');
    return res.status(400).send('<Response><Say>Identification failed. Please try again.</Say></Response>');
  }

  // 1.1 Strict 10-digit normalization
  const from = rawFrom.replace(/\D/g, '').slice(-10);
  console.log(`🔎 NORMALIZED: ${rawFrom} -> ${from}`);

  try {
    // 2. Ensuring DB reference is valid 
    // In serverless, lazy initialization is safer
    let activeDb = db;
    if (!activeDb) {
      console.log('ℹ️ db reference was null, getting fresh instance from admin...');
      activeDb = admin.apps.length ? admin.firestore() : null;
    }

    if (!activeDb) {
      throw new Error('Firestore DB unavailable');
    }

    let user = null;
    let collectionName = '';

    // 🚀 STEP 1: Search in Farmers for BOTH 'phone' and 'contactPhone'
    console.log(`📡 Searching Farmers collection for "${from}"...`);
    const farmerChecks = [
      activeDb.collection('farmers').where('phone', '==', from).limit(1).get(),
      activeDb.collection('farmers').where('contactPhone', '==', from).limit(1).get()
    ];
    
    const [farmerByPhone, farmerByContact] = await Promise.all(farmerChecks);
    
    if (!farmerByPhone.empty) {
      user = farmerByPhone.docs[0].data();
      collectionName = 'farmers (phone)';
    } else if (!farmerByContact.empty) {
      user = farmerByContact.docs[0].data();
      collectionName = 'farmers (contactPhone)';
    }

    // 🚀 STEP 2: Search in Users if not found in Farmers
    if (!user) {
      console.log(`📡 Searching Users collection for "${from}"...`);
      const userChecks = [
        activeDb.collection('users').where('phone', '==', from).limit(1).get(),
        activeDb.collection('users').where('contactPhone', '==', from).limit(1).get()
      ];
      
      const [userByPhone, userByContact] = await Promise.all(userChecks);
      
      if (!userByPhone.empty) {
        user = userByPhone.docs[0].data();
        collectionName = 'users (phone)';
      } else if (!userByContact.empty) {
        user = userByContact.docs[0].data();
        collectionName = 'users (contactPhone)';
      }
    }

    res.set('Content-Type', 'text/xml');

    // 3. Handle Unregistered User
    if (!user) {
      console.log(`❌ BLOCK: ${from} not found in any collection.`);
      return res.send(`
        <Response>
          <Say>Welcome to GraamVaani. Your number ${from} is not registered. Please visit our website to register. Thank you.</Say>
          <Hangup />
        </Response>
      `.trim());
    }

    console.log(`✅ MATCH: Found in ${collectionName}`);

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
