import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// These values should be provided by the user from their Firebase Console
// Project Settings > General > Your apps > Web apps
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDScoCZ2MNOOxud7E-xAeA0X0nso5Pr474",
  authDomain: "graamvani.firebaseapp.com",
  projectId: "graamvani",
  storageBucket: "graamvani.firebasestorage.app",
  messagingSenderId: "741113095545",
  appId: "1:741113095545:web:86c66d38e5ee9302f3fba8",
  measurementId: "G-CN2DQENJ9V"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
