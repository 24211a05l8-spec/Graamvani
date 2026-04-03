import express from 'express';
import admin from 'firebase-admin';
import { db } from './firebase.js';

const router = express.Router();
const VERSION = "2.0.0"; // Clean Yes/No Version

/**
 * @route   ANY /ivr
 * @desc    Exotel IVR Passthru Registration Check (Pure Status Code)
 * @access  Public
 */
router.all('/', async (req, res) => {
  const timestamp = new Date().toISOString();
  const requestId = `call-${Date.now()}`;
  
  // 1. ROBUST PARAMETER EXTRACTION
  const getParam = (name) => {
    const normalize = (s) => s?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
    const searchKey = normalize(name);
    const findIn = (obj) => {
      if (!obj) return null;
      const matchKey = Object.keys(obj).find(k => normalize(k) === searchKey);
      return matchKey ? obj[matchKey] : null;
    };
    return findIn(req.body) || findIn(req.query);
  };

  const rawFrom = getParam('From') || getParam('Caller') || getParam('phoneNumber') || getParam('phone');

  if (!rawFrom) {
    console.warn(`❌ [${VERSION}] No phone number detected in request.`);
    return res.status(400).send('Bad Request: No From number');
  }

  // 2. NORMALIZATION
  const fromStr = rawFrom.replace(/\D/g, '').slice(-10).trim();
  const fromNum = parseInt(fromStr, 10);
  console.log(`🔎 [${VERSION}] Checking: ${rawFrom} -> ${fromStr}`);

  try {
    const activeDb = db || (admin.apps.length ? admin.firestore() : null);
    if (!activeDb) throw new Error('Firestore DB unavailable');

    // 🚀 3. TRIPLE REDUNDANT IDENTIFICATION
    const queries = [
      activeDb.collection('farmers').where('phone', '==', fromStr).get(),    // String Match
      activeDb.collection('farmers').where('phone', '==', fromNum).get(),    // Number Match
      activeDb.collection('farmers').where('phone', '==', rawFrom).get(),    // Literal Match
      activeDb.collection('users').where('phone', '==', fromStr).get(),
      activeDb.collection('users').where('phone', '==', fromNum).get(),
      activeDb.collection('users').where('contactPhone', '==', fromStr).get(),
      activeDb.collection('users').where('contactPhone', '==', fromNum).get()
    ];

    const results = await Promise.all(queries);
    const matchFound = results.some(snap => !snap.empty);

    // 🔍 SILENT PEEK (Only for your internal debug logs in Firestore)
    const peekSnap = await activeDb.collection('farmers').limit(5).get();
    const peekData = peekSnap.docs.map(d => ({ id: d.id, phone: d.data().phone, type: typeof d.data().phone }));

    // 💾 SAVE DEBUG LOG (Silent)
    await activeDb.collection('debug_calls').doc(requestId).set({
      timestamp,
      version: VERSION,
      fromRaw: rawFrom,
      fromNormalized: fromStr,
      results: results.map(s => s.size),
      isRegistered: matchFound,
      peek: peekData,
      payload: { headers: req.headers, query: req.query, body: req.body }
    });

    // 🚀 4. RESPOND (Pure Yes/No for Exotel Passthru)
    if (matchFound) {
      console.log(`✅ [${VERSION}] REGISTERED: ${fromStr}`);
      return res.status(200).send('Registered'); // Exotel Branch: Success
    } else {
      console.log(`❌ [${VERSION}] NOT REGISTERED: ${fromStr}`);
      return res.status(403).send('Not Registered'); // Exotel Branch: Failure (Branch No)
    }

  } catch (err) {
    console.error(`❌ [${VERSION}] CRITICAL ERROR:`, err.message);
    return res.status(500).send('Internal Server Error');
  }
});

export default router;
