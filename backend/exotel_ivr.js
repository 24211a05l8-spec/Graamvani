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
  const from = req.body.From || req.query.From;

  if (!from) {
    console.error('❌ Exotel Error: No From phone number received');
    return res.status(400).send('<Response><Say>Error: No phone number received.</Say></Response>');
  }

  console.log(`🎙️ Exotel Call from: ${from}`);

  try {
    // 2. Check if user exists in Firestore
    // Note: We use the phone number directly as the document ID for performance
    const userDoc = await db.collection('users').doc(from).get();

    res.set('Content-Type', 'text/xml');

    // 3. Determine Language & Category
    const userLang = userDoc.exists ? (userDoc.data().preferredLanguage || 'Hindi') : 'Hindi';
    const calledNumber = req.body.To || '';
    let category = 'local';
    
    // Simple routing based on suffix (if you have multiple numbers)
    if (calledNumber.endsWith('243')) category = 'global';
    else if (calledNumber.endsWith('242')) category = 'national';

    console.log(`🎯 Routing to ${category} in ${userLang}`);

    // 4. Fetch the latest active bulletin
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
          <Say>Welcome to GraamVaani. Playing your ${category} update in ${userLang}.</Say>
          <Play>${bulletin.audioUrl}</Play>
        </Response>
      `.trim());
    }

    // 5. Registration Prompt for non-users or no bulletin
    if (!userDoc.exists) {
      console.log(`⚠️ Unregistered caller: ${from}`);
      return res.send(`
        <Response>
          <Say>Welcome to GraamVaani. Your number is not registered. Please visit our website to register. Thank you.</Say>
        </Response>
      `.trim());
    }

    return res.send(`
      <Response>
        <Say>Welcome to GraamVaani. We don't have a new bulletin for you yet. Please check back later.</Say>
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
