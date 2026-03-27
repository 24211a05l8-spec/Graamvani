import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config();

let db;

// 1. Initialize Firebase only if it hasn't been initialized yet
if (!admin.apps.length) {
  try {
    let serviceAccount;
    
    // 1. Try environment variable (JSON string) - Best for Vercel/Cloud
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        console.log('✅ Loading Firebase credentials from environment variable');
      } catch (e) {
        console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', e.message);
      }
    }

    // 2. Try to load from file - Best for local development
    if (!serviceAccount) {
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-key.json';
      try {
        const fullPath = join(process.cwd(), serviceAccountPath);
        serviceAccount = JSON.parse(readFileSync(fullPath, 'utf8'));
        console.log(`✅ Loading Firebase credentials from file: ${serviceAccountPath}`);
      } catch (e) {
        // Log at info level, as this is expected in production
        console.info(`ℹ️ Local Firebase key file not found: ${e.message}`);
      }
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Connected to Firebase Firestore');
    } else {
      console.error('❌ CRITICAL: No Firebase configuration found! Did you add FIREBASE_SERVICE_ACCOUNT to Vercel/Render?');
    }
  } catch (error) {
    console.error('❌ Firebase Initialization Error:', error.message);
  }
}

// 2. Export db as a lazy-loaded or existing reference
try {
  db = admin.firestore();
} catch (e) {
  console.warn('⚠️ db reference unavailable yet');
}

export { db };
