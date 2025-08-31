import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "llm-daily-digest.firebaseapp.com",
  projectId: "llm-daily-digest",
  storageBucket: "llm-daily-digest.appspot.com",
  messagingSenderId: "427971222981",
  appId: "1:427971222981:web:35c6018151c89083819c9b"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup, onAuthStateChanged };
export type { User };
