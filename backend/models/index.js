import { db } from '../firebase.js';

// Collection Names
export const COLLECTIONS = {
  USERS: 'users',
  FARMERS: 'farmers',
  BULLETINS: 'bulletins',
  CALL_LOGS: 'call_logs',
  NOTIFICATIONS: 'notifications'
};

// Helper to get collection reference
export const getCollection = (name) => db.collection(name);

// We export these to maintain compatibility with existing imports where possible,
// though we'll need to update the call sites in index.js to use Firestore syntax.
export const User = db.collection(COLLECTIONS.USERS);
export const Farmer = db.collection(COLLECTIONS.FARMERS);
export const Bulletin = db.collection(COLLECTIONS.BULLETINS);
export const CallLog = db.collection(COLLECTIONS.CALL_LOGS);
export const Notification = db.collection(COLLECTIONS.NOTIFICATIONS);
