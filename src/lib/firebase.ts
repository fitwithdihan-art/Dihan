import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD1-w1q-u1JIeW-eewwqspNRKumO_ydv-A",
  authDomain: "yodeling-shuttle-gghtt.firebaseapp.com",
  projectId: "yodeling-shuttle-gghtt",
  storageBucket: "yodeling-shuttle-gghtt.firebasestorage.app",
  messagingSenderId: "77054669185",
  appId: "1:77054669185:web:65979dd06754bbc013f880"
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore with custom Database ID
export const db = initializeFirestore(app, {}, "ai-studio-teenthenics-dbc800e3-4908-422d-afaf-237c89815ca6");

// Auth Providers
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

// Standard OAuth configurations for popup
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
facebookProvider.setCustomParameters({
  auth_type: 'reauthenticate'
});
