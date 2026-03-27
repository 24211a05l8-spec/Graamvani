import mongoose from 'mongoose';

// --- USER / PANCHAYAT MODEL ---
const UserSchema = new mongoose.Schema({
  panchayatName: { type: String, required: true },
  district: { type: String, required: true },
  state: { type: String, required: true },
  contactPerson: { type: String, required: true },
  contactPhone: { type: String, required: true, unique: true },
  farmerCount: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  role: { type: String, enum: ['admin', 'panchayat'], default: 'panchayat' },
  createdAt: { type: Date, default: Date.now }
});

// --- FARMER MODEL (Subscribers) ---
const FarmerSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true, unique: true },
  panchayatId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  language: { type: String, default: 'Hindi' },
  region: { type: String },
  lastCallDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// --- BULLETIN MODEL ---
const BulletinSchema = new mongoose.Schema({
  title: { type: String, required: true },
  audioUrl: { type: String }, // Path to S3 or local storage
  textSeed: { type: String },
  language: { type: String, required: true },
  region: { type: String },
  district: { type: String },
  type: { type: String, enum: ['news', 'weather', 'scheme'], default: 'news' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// --- CALL LOG MODEL ---
const CallLogSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true },
  bulletinId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bulletin' },
  duration: { type: Number }, // in seconds
  status: { type: String, enum: ['missed', 'completed', 'failed'], default: 'missed' },
  timestamp: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', UserSchema);
export const Farmer = mongoose.model('Farmer', FarmerSchema);
export const Bulletin = mongoose.model('Bulletin', BulletinSchema);
export const CallLog = mongoose.model('CallLog', CallLogSchema);
