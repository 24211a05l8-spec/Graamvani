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

    // 3. Handle Registered User
    if (userDoc.exists) {
      const userData = userDoc.data();
      const language = userData.language || 'Hindi'; // Fallback to Hindi
      
      console.log(`✅ Registered User: ${userData.name || 'Anonymous'} (Lang: ${language})`);

      // 4. Return Language-Specific XML
      if (language.toLowerCase() === 'telugu') {
        // Replace with your actual hosted Telugu audio URL
        return res.send(`
          <Response>
            <Play>https://your-storage.com/audio/telugu_news.mp3</Play>
          </Response>
        `.trim());
      } else {
        // Default to Hindi
        return res.send(`
          <Response>
            <Play>https://your-storage.com/audio/hindi_news.mp3</Play>
          </Response>
        `.trim());
      }
    } 

    // 5. Handle Unregistered User
    console.log(`⚠️ Unregistered caller: ${from}`);
    return res.send(`
      <Response>
        <Say>You are not registered. Please register on GraamVaani website to continue.</Say>
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
