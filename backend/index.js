import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import admin from 'firebase-admin';
import cors from 'cors';
import morgan from 'morgan';
import { User, Bulletin, CallLog, Farmer, Notification } from './models/index.js';
import { initCronJobs } from './cron.js';
import { generateAudioBulletin } from './services/ttsService.js';
import exotelRouter from './exotel_ivr.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Cron Jobs
initCronJobs();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Required for Exotel/Webhook form data
app.use(morgan('dev'));

// Note: Firebase is initialized in firebase.js and imported via models/index.js

// 2. MIDDLEWARE & ROUTES
app.get('/api/ivr/version', (req, res) => {
  try {
    const projectId = admin.apps.length ? admin.apps[0].options.projectId || 'Unknown (Check env)' : 'Firebase Not Init';
    res.json({ 
      status: 'ok', 
      version: "1.1.4", 
      projectId: projectId,
      timestamp: new Date().toISOString() 
    });
  } catch (err) {
    res.status(500).json({ error: err.message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined });
  }
});
app.use('/api/ivr', exotelRouter); // specialized exotel route

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
    
    // 1. Normalize phone numbers before saving
    if (formData.phone) {
      formData.phone = formData.phone.replace(/\D/g, '').replace(/^91/, '').replace(/^0/, '');
    }
    if (formData.contactPhone) {
      formData.contactPhone = formData.contactPhone.replace(/\D/g, '').replace(/^91/, '').replace(/^0/, '');
    }

    const data = {
      ...formData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isVerified: false
    };

    if (registrationType === 'individual') {
      data.role = 'farmer';
      const docRef = await Farmer.add(data);
      res.status(201).json({ message: 'Individual registration successful', id: docRef.id, user: data });
    } else {
      data.role = 'panchayat';
      const docRef = await User.add(data);
      
      // Create a notification for the admin
      await Notification.add({
        title: 'New Village Registration',
        message: `${formData.panchayatName} in ${formData.district} has requested registration.`,
        type: 'registration',
        relatedId: docRef.id,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

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
    const pendingPanchayatsSnapshot = await User.where('isVerified', '==', false).count().get();
    
    // For call count today, we need a date check
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const callsTodaySnapshot = await CallLog.where('timestamp', '>=', today).count().get();
    
    res.json({
      totalFarmers: farmerSnapshot.data().count,
      callsToday: callsTodaySnapshot.data().count,
      activeBulletins: activeBulletinsSnapshot.data().count,
      pendingRegistrations: pendingPanchayatsSnapshot.data().count,
      listenTime: '2m 45s' // Mocked but consistent
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const snapshot = await Notification.orderBy('createdAt', 'desc').limit(20).get();
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/:id/read', async (req, res) => {
  try {
    await Notification.doc(req.params.id).update({ isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Exotel IVR is now handled by exotel_ivr.js via app.use('/api/ivr', exotelRouter)

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 GraamVaani Server (Firebase) running on port ${PORT}`);
  });
}

export default app;
