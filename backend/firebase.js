import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config();

let db;

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
      console.log(`⚠️ Could not load Firebase key from file: ${e.message}`);
    }
  }

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    console.log('✅ Connected to Firebase Firestore');
  } else if (process.env.FIREBASE_PROJECT_ID) {
    // 3. Fallback to Application Default Credentials
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    db = admin.firestore();
    console.log('✅ Connected to Firebase via Application Default Credentials');
  } else {
    throw new Error('No Firebase configuration found (env var, file, or default credentials)');
  }
} catch (error) {
  console.error('❌ Firebase Initialization Error:', error.message);
}

export { db };
