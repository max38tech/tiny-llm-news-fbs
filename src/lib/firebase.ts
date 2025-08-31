import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithRedirect, onAuthStateChanged, User, getRedirectResult } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCsJQPa8sh2Ab0qpmTgdxrCKBy2lO0n_B0",
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

export { auth, provider, signInWithRedirect, onAuthStateChanged, getRedirectResult };
export type { User };
