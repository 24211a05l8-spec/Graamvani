import express from 'express';
import admin from 'firebase-admin';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { User, Bulletin, CallLog, Farmer } from './models/index.js';
import { initCronJobs } from './cron.js';

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
  try {
    const data = {
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const docRef = await Bulletin.add(data);
    res.status(201).json({ id: docRef.id, ...data });
  } catch (err) {
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
  console.log(`🎙️ Missed call received from: ${from}`);
  
  try {
    // 1. Log the call
    await CallLog.add({
      phoneNumber: from,
      status: 'missed',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    console.error('Error logging call:', err);
  }

  // 2. In a real Twilio setup, we'd trigger an Outbound Dial (Callback)
  res.type('text/xml');
  res.send('<Response><Reject /></Response>');
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 GraamVaani Server (Firebase) running on port ${PORT}`);
  });
}

export default app;
