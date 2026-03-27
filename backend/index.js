import express from 'express';
import mongoose from 'mongoose';
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

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/graamvaani';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- API ROUTES ---

// Health Check
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'GraamVaani API is alive' }));

// 1. BULLETINS
app.get('/api/bulletins', async (req, res) => {
  try {
    const bulletins = await Bulletin.find().sort({ createdAt: -1 });
    res.json(bulletins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bulletins', async (req, res) => {
  try {
    const bulletin = new Bulletin(req.body);
    await bulletin.save();
    res.status(201).json(bulletin);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 2. USERS / PANCHAYATS
app.post('/api/register', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json({ message: 'Registration successful', user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const farmerCount = await Farmer.countDocuments();
    const callCountToday = await CallLog.countDocuments({
      timestamp: { $gte: new Date().setHours(0,0,0,0) }
    });
    const activeBulletins = await Bulletin.countDocuments({ isActive: true });
    
    res.json({
      totalFarmers: farmerCount,
      callsToday: callCountToday,
      activeBulletins,
      listenTime: '2m 45s' // Mocked for now
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. IVR WEBHOOKS (Twilio)
app.post('/api/ivr/missed-call', async (req, res) => {
  const from = req.body.From;
  console.log(`🎙️ Missed call received from: ${from}`);
  
  // 1. Log the call
  const log = new CallLog({ phoneNumber: from, status: 'missed' });
  await log.save();

  // 2. In a real Twilio setup, we'd trigger an Outbound Dial (Callback)
  // For now, we return TwiML to acknowledge (though missed calls shouldn't connect)
  res.type('text/xml');
  res.send('<Response><Reject /></Response>');
});

app.listen(PORT, () => {
  console.log(`🚀 GraamVaani Server running on port ${PORT}`);
});
