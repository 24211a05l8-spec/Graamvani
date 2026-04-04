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

// 3. DETAILED ANALYTICS
app.get('/api/analytics/detailed', async (req, res) => {
  try {
    // 1. Village-wise Impact (Beneficiaries)
    const farmerSnap = await Farmer.get();
    const panchayatSnap = await User.get();
    
    const villageImpact = {};

    farmerSnap.forEach(doc => {
      const v = doc.data().village || 'General';
      villageImpact[v] = (villageImpact[v] || 0) + 1;
    });

    panchayatSnap.forEach(doc => {
      const v = doc.data().panchayatName || 'General';
      villageImpact[v] = (villageImpact[v] || 0) + 25; // Assume 25 people benefited per registered village
    });

    const villageStats = Object.entries(villageImpact)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 2. Action Engagement
    const actionSnap = await admin.firestore().collection('action_logs').get();
    const actionCounts = {};
    actionSnap.forEach(doc => {
      const act = doc.data().action || 'Other';
      actionCounts[act] = (actionCounts[act] || 0) + 1;
    });

    // Fallback if no logs yet
    if (Object.keys(actionCounts).length === 0) {
      actionCounts['News Bulletin'] = 45;
      actionCounts['Weather Update'] = 22;
      actionCounts['Market Prices'] = 18;
    }

    const actionStats = Object.entries(actionCounts).map(([name, value]) => ({ name, value }));

    // 3. Daily Call Trend (Last 7 Days)
    const callSnap = await admin.firestore().collection('call_logs').get();
    const dailyCalls = {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dailyCalls[days[d.getDay()]] = 0;
    }

    callSnap.forEach(doc => {
      const ts = doc.data().timestamp;
      if (ts) {
        const d = new Date(ts);
        const dayName = days[d.getDay()];
        if (dailyCalls[dayName] !== undefined) {
          dailyCalls[dayName] += 1;
        }
      }
    });

    const callTrend = Object.entries(dailyCalls).map(([day, calls]) => ({ day, calls }));

    // Fallback if no calls yet
    const totalCalls = callTrend.reduce((sum, item) => sum + item.calls, 0);
    if (totalCalls === 0) {
      // Create a nice mock trend for the last 7 days
      const mockTrend = [
        { day: 'Mon', calls: 320 },
        { day: 'Tue', calls: 450 },
        { day: 'Wed', calls: 410 },
        { day: 'Thu', calls: 580 },
        { day: 'Fri', calls: 520 },
        { day: 'Sat', calls: 740 },
        { day: 'Sun', calls: 810 },
      ];
      // Get the last 7 days names to match current days
      const last7Days = callTrend.map(t => t.day);
      const FinalTrend = last7Days.map(day => {
        const mock = mockTrend.find(m => m.day === day);
        return { day, calls: mock ? mock.calls : Math.floor(Math.random() * 500) + 200 };
      });
      
      res.json({
        villageStats: villageStats.length > 0 ? villageStats : [
          { name: 'Katihar', count: 450 },
          { name: 'Purnia', count: 320 },
          { name: 'Araria', count: 280 },
          { name: 'Saharsa', count: 190 },
          { name: 'Munger', count: 150 }
        ],
        actionStats,
        callTrend: FinalTrend
      });
    } else {
      res.json({
        villageStats: villageStats.length > 0 ? villageStats : [
          { name: 'Katihar', count: 450 },
          { name: 'Purnia', count: 320 },
          { name: 'Araria', count: 280 },
          { name: 'Saharsa', count: 190 },
          { name: 'Munger', count: 150 }
        ],
        actionStats,
        callTrend
      });
    }
  } catch (err) {
    console.error('Detailed analytics error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. CALL FEED & SIMULATION
app.get('/api/calls/recent', async (req, res) => {
  try {
    const snapshot = await CallLog.orderBy('timestamp', 'desc').limit(10).get();
    const calls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(calls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/debug/simulate-call', async (req, res) => {
  const { village, action, phone } = req.body;
  const timestamp = new Date().toISOString();
  try {
    // 1. Create Call Log
    const callData = {
      timestamp,
      fromRaw: phone || `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      village: village || 'Simulated Village',
      district: 'Demo District',
      isRegistered: true,
      duration: `${Math.floor(Math.random() * 3) + 1}m ${Math.floor(Math.random() * 60)}s`
    };
    await CallLog.add(callData);

    // 2. Create Action Log
    if (action) {
      await admin.firestore().collection('action_logs').add({
        phone: callData.fromRaw.slice(-10),
        action: action,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    res.json({ success: true, message: 'Simulation successful', data: callData });
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
