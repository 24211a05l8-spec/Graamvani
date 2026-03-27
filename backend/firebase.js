import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config();

let db;

try {
  // Try to load service account from a file if FIREBASE_SERVICE_ACCOUNT_PATH is set
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-key.json';
  const serviceAccount = JSON.parse(readFileSync(join(process.cwd(), serviceAccountPath), 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  db = admin.firestore();
  console.log('✅ Connected to Firebase Firestore');
} catch (error) {
  console.error('⚠️ Firebase Initialization Warning:', error.message);
  console.log('Falling back to environment variables for Firebase configuration...');
  
  if (process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    db = admin.firestore();
  } else {
    console.error('❌ Firebase Error: No service account or project ID provided. Check your .env file.');
  }
}

export { db };
