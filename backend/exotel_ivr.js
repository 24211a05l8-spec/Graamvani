import express from 'express';
import admin from 'firebase-admin';
import { db } from './firebase.js';

const router = express.Router();

/**
 * @route   POST /ivr
 * @desc    Exotel IVR Webhook for voice routing
 * @access  Public (Exotel Passthru)
 */
router.all('/', async (req, res) => {
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
    // We try THREE ways: String match, Number match, and Trimmed match
    console.log(`📡 Searching Farmers collection for "${from}"...`);
    
    // Convert to number just in case Firestore stored it as a number
    const fromNum = parseInt(from, 10);
    
    const farmerQueries = [
      activeDb.collection('farmers').where('phone', '==', from).get(),
      activeDb.collection('farmers').where('phone', '==', fromNum).get(),
      activeDb.collection('farmers').where('contactPhone', '==', from).get(),
      activeDb.collection('farmers').where('contactPhone', '==', fromNum).get()
    ];
    
    const queryResults = await Promise.all(farmerQueries);
    const farmerDoc = queryResults.find(snap => !snap.empty)?.docs[0];
    
    if (farmerDoc) {
      user = farmerDoc.data();
      collectionName = 'farmers';
    } else {
      // 🚀 STEP 2: Search in Users if not found in Farmers
      console.log(`📡 Searching Users collection for "${from}"...`);
      const userQueries = [
        activeDb.collection('users').where('phone', '==', from).get(),
        activeDb.collection('users').where('phone', '==', fromNum).get(),
        activeDb.collection('users').where('contactPhone', '==', from).get(),
        activeDb.collection('users').where('contactPhone', '==', fromNum).get()
      ];
      
      const userQueryResults = await Promise.all(userQueries);
      const userDocMatch = userQueryResults.find(snap => !snap.empty)?.docs[0];
      
      if (userDocMatch) {
        user = userDocMatch.data();
        collectionName = 'users';
      }
    }

    res.set('Content-Type', 'text/xml');

    // 3. Handle Unregistered User
    if (!user) {
      console.error(`❌ BLOCK: ${from} (as string or number) not found in DB.`);
      return res.send(`
        <Response>
          <Say>Welcome to GraamVaani. Your number ${from} is not recognized. Please register online. Thank you.</Say>
          <Hangup />
        </Response>
      `.trim());
    }

    console.log(`✅ MATCH: Found ${user.name || 'User'} in ${collectionName}`);

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

/**
 * @route   GET /api/ivr/test
 * @desc    Deep debug endpoint to verify search logic
 */
router.get('/test', async (req, res) => {
  try {
    const searchPhone = req.query.phone ? req.query.phone.replace(/\D/g, '').slice(-10) : null;
    let debugInfo = {
      status: 'ok',
      database: 'connected',
      project_id: admin.apps[0].options.projectId || 'unknown',
      server_time: new Date().toISOString(),
      searching_for: searchPhone,
      variants_tried: []
    };

    if (searchPhone) {
      const variants = [searchPhone, parseInt(searchPhone, 10)];
      debugInfo.variants_tried = variants;
      
      const results = await Promise.all([
        db.collection('farmers').where('phone', '==', variants[0]).get(),
        db.collection('farmers').where('phone', '==', variants[1]).get(),
        db.collection('users').where('contactPhone', '==', variants[0]).get(),
        db.collection('users').where('contactPhone', '==', variants[1]).get()
      ]);

      debugInfo.found = {
        farmers_string: !results[0].empty,
        farmers_number: !results[1].empty,
        users_string: !results[2].empty,
        users_number: !results[3].empty
      };

      if (!results[0].empty || !results[1].empty || !results[2].empty || !results[3].empty) {
        const doc = (results[0].docs[0] || results[1].docs[0] || results[2].docs[0] || results[3].docs[0]).data();
        debugInfo.matched_user = {
          name: doc.name || doc.panchayatName,
          actual_db_phone: doc.phone || doc.contactPhone,
          db_phone_type: typeof (doc.phone || doc.contactPhone)
        };
      }
    } else {
      const snapshot = await db.collection('farmers').limit(5).get();
      debugInfo.collection_samples = snapshot.docs.map(d => ({
        id: d.id,
        phone: d.data().phone,
        type: typeof d.data().phone
      }));
    }

    return res.json(debugInfo);
  } catch (err) {
    return res.status(500).json({ status: 'error', error: err.message, stack: err.stack });
  }
});

export default router;
