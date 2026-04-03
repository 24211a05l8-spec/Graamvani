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
    
    // 1. Try to load from file - Best for local development
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-key.json';
    try {
      const fullPath = join(process.cwd(), serviceAccountPath);
      serviceAccount = JSON.parse(readFileSync(fullPath, 'utf8'));
      console.log(`✅ Loading Firebase credentials from file: ${serviceAccountPath}`);
    } catch (e) {
      console.info(`ℹ️ Local Firebase key file not found at ${serviceAccountPath}: ${e.message}`);
    }

    // 2. Fallback to environment variable (JSON string) - for Cloud
    if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT.trim().replace(/^'|'$/g, '');
        serviceAccount = JSON.parse(rawJson);
        console.log('✅ Loading Firebase credentials from environment variable');
      } catch (e) {
        console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', e.message);
      }
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      console.log(`✅ Connected to Firebase Project: ${serviceAccount.project_id}`);
    } else {
      console.error('❌ CRITICAL: No Firebase configuration found! Please provide firebase-key.json or FIREBASE_SERVICE_ACCOUNT env var.');
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
