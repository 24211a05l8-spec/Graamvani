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
    welcomeUnregistered: (from) => `Welcome to GraamVaani. Your number ${from} is not recognized. Please register online to access our services. Thank you.`,
    welcomeRegistered: (name, category, lang) => `Namaste ${name}, welcome back to GraamVaani. Playing your ${category} news in ${lang}.`,
    noBulletin: (lang) => `Welcome back. We don't have a new bulletin for you yet in ${lang}. Please check back later.`,
    loadingError: "Sorry, we are experiencing technical difficulties. Please call again later."
  }
};

/**
 * @route   POST /ivr
 * @desc    Exotel IVR Webhook for voice routing (Multi-language)
 * @access  Public (Exotel Passthru)
 */
router.all('/', async (req, res) => {
  // 1. Extract Caller Info & Forced Language from Exotel
  console.log('--- 📞 NEW INCOMING IVR CALL ---');
  
  // Exotel sends data in Body (POST) or Query (GET)
  const rawFrom = req.body.From || req.query.From || 
                  req.body.from || req.query.from || 
                  req.body.Caller || req.query.Caller || 
                  req.body.phoneNumber || req.query.phoneNumber;

  // Potential URL override from Exotel Flow (e.g., ?lang=Hindi)
  const flowLang = req.query.lang || req.body.lang || null;

  if (!rawFrom) {
    console.warn('❌ CRITICAL: No phone number found in Exotel request!');
    res.set('Content-Type', 'text/xml');
    return res.send('<Response><Say voice="Polite">Identification failed. Please try again.</Say></Response>');
  }

  // 1.1 Strict 10-digit normalization
  const from = rawFrom.replace(/\D/g, '').slice(-10);
  console.log(`🔎 NORMALIZED: ${rawFrom} -> ${from}`);

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
      activeDb.collection('users').where('phone', '==', fromNum).get()
    ];
    
    const results = await Promise.all(queries);
    const userDocMatch = results.find(snap => !snap.empty)?.docs[0];
    
    if (userDocMatch) {
      user = userDocMatch.data();
      collectionName = userDocMatch.ref.parent.id;
    }

    // 🚀 STEP 2: Determine Language (Flow Priority > User Profile > Default)
    let userLang = flowLang || (user ? (user.language || user.preferredLanguage) : 'English') || 'English';
    
    // Normalize string case
    if (userLang.toLowerCase() === 'hindi') userLang = 'Hindi';
    if (userLang.toLowerCase() === 'telugu') userLang = 'Telugu';
    
    const prompts = PROMPTS[userLang] || PROMPTS.English;
    res.set('Content-Type', 'text/xml');

    // 🚀 STEP 3: Handle Unregistered User
    if (!user) {
      console.error(`❌ BLOCK: ${from} not found in DB. Flow Language: ${userLang}`);
      return res.send(`
        <Response>
          <Say voice="Polite">${prompts.welcomeUnregistered(from)}</Say>
          <Hangup />
        </Response>
      `.trim());
    }

    console.log(`✅ MATCH: Found ${user.name || 'User'} in ${collectionName}`);

    // 🚀 STEP 4: Routing & Category Detection
    const userName = user.name || user.panchayatName || 'User';
    const calledNumber = req.body.To || req.query.To || '';
    let category = 'local';
    
    // Suffix-based routing (if you have multiple numbers for categories)
    if (calledNumber.endsWith('243')) category = 'global';
    else if (calledNumber.endsWith('242')) category = 'national';

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
