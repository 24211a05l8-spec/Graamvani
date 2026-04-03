import express from 'express';
import admin from 'firebase-admin';
import { db } from './firebase.js';

const router = express.Router();

/**
 * 🛠️ Localized Prompts
 * (In a real-world app, these would come from a separate JSON or translation service)
 */
const PROMPTS = {
  Hindi: {
    welcomeUnregistered: (from) => `ग्रामवाणी में आपका स्वागत है। आपका नंबर ${from.split('').join(' ')} अभी हमारे पास जुड़ा हुआ नहीं है। कृपया अधिक जानकारी के लिए ऑनलाइन रजिस्टर करें। धन्यवाद।`,
    welcomeRegistered: (name, category, lang) => `नमस्ते ${name}! ग्रामवाणी में आपका फिर से स्वागत है। हम आपके लिए ${category} खबरें ${lang} में सुना रहे हैं।`,
    noBulletin: (lang) => `स्वागत है। अभी हमारे पास ${lang} में नया बुलेटिन उपलब्ध नहीं है। कृपया बाद में फिर से कोशिश करें।`,
    loadingError: "क्षमा करें, हम तकनीकी खराबी का सामना कर रहे हैं। कृपया बाद में प्रयास करें।"
  },
  English: {
    welcomeUnregistered: (from) => `Welcome to GraamVaani. Your number ${from.split('').join(' ')} is not recognized. Please register online.`,
    welcomeRegistered: (name, category, lang) => `Namaste ${name}, welcome back to GraamVaani. Playing your ${category} news in ${lang}.`,
    noBulletin: (lang) => `Welcome back. We don't have a new bulletin for you yet in ${lang}. Please check back later.`,
    loadingError: "Sorry, we are experiencing technical difficulties. Please call again later."
  }
};

const VERSION = "1.1.2"; // Used to verify if the user is hitting the latest deployment

/**
 * @route   POST /ivr
 * @desc    Exotel IVR Webhook for voice routing (Multi-language)
 * @access  Public (Exotel Passthru)
 */
router.all('/', async (req, res) => {
  // 🚀 1. DIAGNOSTIC LOGGING (Essential for debugging "PassThru Key" issues)
  console.log('--- 📞 NEW INCOMING IVR CALL ---');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Payload (Query):', JSON.stringify(req.query, null, 2));
  console.log('Payload (Body):', JSON.stringify(req.body, null, 2));

  // 🚀 1.1 ENFORCE API AUTHENTICATION (Basic Auth)
  const authHeader = req.headers.authorization;
  const expectedKey = process.env.EXOTEL_API_KEY;
  const expectedToken = process.env.EXOTEL_API_TOKEN;

  // IMPORTANT: We only enforce if Key/Token are configured in .env
  if (expectedKey && expectedToken) {
    if (!authHeader) {
      console.error('❌ AUTH REJECTED: Missing Authorization header');
      return res.status(401).send('Unauthorized: Exotel API Key required');
    }

    const [type, credentials] = authHeader.split(' ');
    const decoded = Buffer.from(credentials, 'base64').toString();
    const [user, pass] = decoded.split(':');

    if (user !== expectedKey || pass !== expectedToken) {
      console.error('❌ AUTH REJECTED: Invalid API Key or Token');
      return res.status(401).send('Unauthorized: Invalid Credentials');
    }
    console.log('✅ AUTH SUCCESS: Valid Exotel Credentials');
  } else {
    console.warn('⚠️ AUTH WARNING: EXOTEL_API_KEY or TOKEN missing from .env. Running in unsecure mode.');
  }

  // 🚀 2. ROBUST PARAMETER EXTRACTION (Case-insensitive & Character-insensitive)
  // Exotel sometimes sends 'From' and sometimes 'from' or 'Caller'
  const getParam = (name) => {
    const normalize = (s) => s?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
    const searchKey = normalize(name);
    
    const findIn = (obj) => {
      if (!obj) return null;
      const matchKey = Object.keys(obj).find(k => normalize(k) === searchKey);
      if (matchKey && matchKey.toLowerCase() !== name.toLowerCase()) {
        console.log(`💡 Param Match: Found "${matchKey}" in payload for requested "${name}"`);
      }
      return matchKey ? obj[matchKey] : null;
    };
    
    return findIn(req.body) || findIn(req.query);
  };

  const rawFrom = getParam('From') || getParam('Caller') || getParam('phoneNumber') || getParam('phone');
  const flowLang = getParam('lang') || getParam('language');
  
  // Checking multiple common Exotel passthru/custom field names
  const customKey = getParam('key') || 
                    getParam('village_id') || 
                    getParam('custom_field') || 
                    getParam('customfield') || 
                    getParam('passthru');

  if (customKey) {
    console.log(`🔑 CUSTOM KEY DETECTED: "${customKey}" (Normalized search matched)`);
  }

  if (!rawFrom) {
    console.warn('❌ CRITICAL: No phone number found in Exotel request!');
    res.set('Content-Type', 'text/xml');
    return res.send('<Response><Say voice="Polite">Identification failed. No caller ID detected.</Say></Response>');
  }

  // 🚀 3. NORMALIZATION
  const from = rawFrom.replace(/\D/g, '').slice(-10);
  console.log(`🔎 NORMALIZED CALLER: ${rawFrom} -> ${from}`);

  try {
    let activeDb = db;
    if (!activeDb) {
      activeDb = admin.apps.length ? admin.firestore() : null;
    }

    if (!activeDb) throw new Error('Firestore DB unavailable');

    let user = null;
    let collectionName = '';

    // 🚀 STEP 1: Identify the User
    console.log(`📡 Searching DB for "${from}"...`);
    const fromNum = parseInt(from, 10);
    
    // Check Farmers & Users
    const queries = [
      activeDb.collection('farmers').where('phone', '==', from).get(),
      activeDb.collection('farmers').where('phone', '==', fromNum).get(),
      activeDb.collection('users').where('phone', '==', from).get(),
      activeDb.collection('users').where('phone', '==', fromNum).get(),
      // 🆕 Added support for "contactPhone" (Panchayat registrations)
      activeDb.collection('users').where('contactPhone', '==', from).get(),
      activeDb.collection('users').where('contactPhone', '==', fromNum).get()
    ];
    
    const results = await Promise.all(queries);
    const userDocMatch = results.find(snap => !snap.empty)?.docs[0];
    
    if (userDocMatch) {
      user = userDocMatch.data();
      collectionName = userDocMatch.ref.parent.id;
      const matchField = user.phone === from || user.phone === fromNum ? 'phone' : 'contactPhone';
      console.log(`✅ Identified by ${matchField} in ${collectionName}: ${from} -> ${user.name || user.panchayatName}`);
    }

    // 🚀 STEP 1.1: IDENTIFICATION FALLBACK (If phone lookup fails, try Custom Key)
    if (!user && customKey) {
      console.log(`📡 Phone lookup failed. Trying Custom Key identification: "${customKey}"...`);
      
      // 1. Try Document ID lookup in 'users' (Panchayats)
      const villageDoc = await activeDb.collection('users').doc(customKey).get();
      if (villageDoc.exists) {
        user = villageDoc.data();
        collectionName = 'users';
        console.log(`✅ IDENTIFIED BY CUSTOM KEY (DOC ID): ${user.panchayatName}`);
      } else {
        // 2. Try 'village_id' field lookup in 'users'
        const villageSnap = await activeDb.collection('users').where('village_id', '==', customKey).limit(1).get();
        if (!villageSnap.empty) {
          user = villageSnap.docs[0].data();
          collectionName = 'users';
          console.log(`✅ IDENTIFIED BY CUSTOM KEY (VILLAGE_ID FIELD): ${user.panchayatName}`);
        } else {
          // 3. Try checking if it's a Farmer by Document ID
          const farmerDoc = await activeDb.collection('farmers').doc(customKey).get();
          if (farmerDoc.exists) {
            user = farmerDoc.data();
            collectionName = 'farmers';
            console.log(`✅ IDENTIFIED BY CUSTOM KEY (FARMER DOC ID): ${user.name}`);
          }
        }
      }
    }

    // 🚀 STEP 2: Determine Language (Flow Priority > User Profile > Default)
    let userLang = flowLang || (user ? (user.language || user.preferredLanguage) : 'English') || 'English';
    
    // Normalize string case
    if (userLang.toLowerCase() === 'hindi') userLang = 'Hindi';
    if (userLang.toLowerCase() === 'telugu') userLang = 'Telugu';
    
    const prompts = PROMPTS[userLang] || PROMPTS.English;
    res.set('Content-Type', 'text/xml');

    // 🚀 STEP 3: RESPOND (Status Code for Check-only vs. XML for playback)
    const isXmlRequested = getParam('xml') === 'true' || getParam('format') === 'xml';

    if (!user) {
      console.error(`❌ DENIED: ${from} not found in DB [VER: ${VERSION}]`);
      
      if (isXmlRequested) {
        res.set('Content-Type', 'text/xml');
        return res.send(`
          <Response>
            <Say voice="Polite">${prompts.welcomeUnregistered(from)}</Say>
            <Hangup />
          </Response>
        `.trim());
      } else {
        return res.status(302).send('Not Registered');
      }
    }

    console.log(`✅ MATCH: Found ${user.name || 'User'} in ${collectionName}`);

    // If it's a simple check (not XML requested), return 200 (Success)
    if (!isXmlRequested) {
      console.log('📡 Sending HTTP 200 OK for registration check.');
      return res.status(200).send('Registered');
    }

    // 🚀 STEP 4: Full XML Logic (Playback, etc.)
    const userName = user.name || user.panchayatName || 'User';
    const calledNumber = req.body.To || req.query.To || '';
    let category = 'local';
    
    // Category detection (defaults to local unless more numbers are added)
    // if (calledNumber.endsWith('243')) category = 'global';
    // else if (calledNumber.endsWith('242')) category = 'national';

    console.log(`✅ Registered user: ${userName} (Routing to ${category} in ${userLang})`);

    // 🚀 STEP 5: Fetch latest bulletin
    const bulletinSnapshot = await db.collection('bulletins')
      .where('isActive', '==', true)
      .where('language', '==', userLang)
      .where('category', '==', category)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (!bulletinSnapshot.empty) {
      const bulletin = bulletinSnapshot.docs[0].data();
      return res.send(`
        <Response>
          <Say voice="Polite">${prompts.welcomeRegistered(userName, category, userLang)}</Say>
          <Play>${bulletin.audioUrl}</Play>
        </Response>
      `.trim());
    }

    // 🚀 STEP 6: Fallback for No Bulletin Found
    return res.send(`
      <Response>
        <Say voice="Polite">${prompts.noBulletin(userLang)}</Say>
      </Response>
    `.trim());

  } catch (err) {
    console.error('❌ Server Error:', err.message);
    res.set('Content-Type', 'text/xml');
    return res.send(`
      <Response>
        <Say voice="Polite">${PROMPTS.English.loadingError}</Say>
      </Response>
    `.trim());
  }
});

export default router;
