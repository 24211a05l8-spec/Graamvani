import express from 'express';
import admin from 'firebase-admin';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { User, Bulletin, CallLog, Farmer } from './models/index.js';
import { initCronJobs } from './cron.js';
import { generateAudioBulletin } from './services/ttsService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Cron Jobs
initCronJobs();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Note: Firebase is initialized in firebase.js and imported via models/index.js

// --- API ROUTES ---

// Health Check
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'GraamVaani API is alive (Firebase Edition)' }));

// 1. BULLETINS
app.get('/api/bulletins', async (req, res) => {
  try {
    const snapshot = await Bulletin.orderBy('createdAt', 'desc').get();
    const bulletins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(bulletins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bulletins', async (req, res) => {
  const { title, textSeed, language } = req.body;
  try {
    console.log(`🎙️ Creating bulletin: ${title} (${language})`);
    
    // 1. Trigger AI Voice Generation
    const aiAudio = await generateAudioBulletin(textSeed, language);

    // 2. Save to Firestore
    const data = {
      title,
      textSeed,
      language,
      audioUrl: aiAudio.url,
      duration: aiAudio.duration,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await Bulletin.add(data);
    console.log(`✅ Bulletin created with AI Voice: ${docRef.id}`);
    
    res.status(201).json({ id: docRef.id, ...data });
  } catch (err) {
    console.error('Bulletin creation error:', err);
    res.status(400).json({ error: err.message });
  }
});

// 2. USERS / PANCHAYATS / FARMERS
app.post('/api/register', async (req, res) => {
  try {
    const { registrationType, ...formData } = req.body;
    
    const data = {
      ...formData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isVerified: false
    };

    if (registrationType === 'individual') {
      // Register as a Farmer
      data.role = 'farmer';
      // Normalize individual fields if necessary (already handled by formData)
      const docRef = await Farmer.add(data);
      res.status(201).json({ message: 'Individual registration successful', id: docRef.id, user: data });
    } else {
      // Register as a Panchayat (User)
      data.role = 'panchayat';
      const docRef = await User.add(data);
      res.status(201).json({ message: 'Panchayat registration successful', id: docRef.id, user: data });
    }
  } catch (err) {
    console.error('Registration backend error:', err);
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const farmerSnapshot = await Farmer.count().get();
    const activeBulletinsSnapshot = await Bulletin.where('isActive', '==', true).count().get();
    
    // For call count today, we need a date check
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const callsTodaySnapshot = await CallLog.where('timestamp', '>=', today).count().get();
    
    res.json({
      totalFarmers: farmerSnapshot.data().count,
      callsToday: callsTodaySnapshot.data().count,
      activeBulletins: activeBulletinsSnapshot.data().count,
      listenTime: '2m 45s' // Mocked
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. IVR WEBHOOKS (Twilio)
app.post('/api/ivr/missed-call', async (req, res) => {
  const from = req.body.From;
  console.log(`🎙️ Incoming call from: ${from}`);
  
  try {
    // 1. Log the call
    await CallLog.add({
      phoneNumber: from,
      status: 'incoming',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // 2. Lookup the caller (Check both Farmers and Panchayat Users)
    let user = null;
    
    // Search in Farmers
    const farmerSnapshot = await Farmer.where('phone', '==', from).limit(1).get();
    if (!farmerSnapshot.empty) {
      user = farmerSnapshot.docs[0].data();
    } else {
      // Search in Panchayat Users
      const userSnapshot = await User.where('contactPhone', '==', from).limit(1).get();
      if (!userSnapshot.empty) {
        user = userSnapshot.docs[0].data();
      }
    }

    res.type('text/xml');

    if (user) {
      const language = user.language || 'Hindi (Standard)';
      console.log(`✅ Registered user found (${user.name || user.panchayatName}). Language: ${language}`);

      // 3. Fetch the latest bulletin for this language
      const bulletinSnapshot = await Bulletin
        .where('language', '==', language)
        .where('isActive', '==', true)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      if (!bulletinSnapshot.empty) {
        const bulletin = bulletinSnapshot.docs[0].data();
        
        // TwiML Response
        let twiml = '<Response>';
        twiml += `<Say voice="Polite">Welcome back to GraamVaani. Here is the latest news in ${language}.</Say>`;
        
        if (bulletin.audioUrl) {
          twiml += `<Play>${bulletin.audioUrl}</Play>`;
        } else {
          twiml += `<Say>${bulletin.title}. ${bulletin.textSeed}</Say>`;
        }
        
        twiml += '<Say>Thank you for listening to GraamVaani. Goodbye!</Say>';
        twiml += '<Hangup /></Response>';
        return res.send(twiml);
      } else {
        return res.send(`
          <Response>
            <Say>Welcome to GraamVaani. We don't have a new bulletin in ${language} yet. Please check back later.</Say>
            <Hangup />
          </Response>
        `);
      }
    } else {
      console.log(`❌ Unrecognized caller: ${from}`);
      // 4. Prompt for registration
      return res.send(`
        <Response>
          <Say>Welcome to GraamVaani. Your number is not registered. Please visit our website to register and receive hyper-local news updates in your language. Thank you.</Say>
          <Hangup />
        </Response>
      `);
    }
  } catch (err) {
    console.error('IVR Error:', err);
    res.type('text/xml');
    res.send('<Response><Say>An error occurred. Please try again later.</Say><Reject /></Response>');
  }
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 GraamVaani Server (Firebase) running on port ${PORT}`);
  });
}

export default app;
