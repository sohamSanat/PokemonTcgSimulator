import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, writeBatch, onSnapshot } from 'firebase/firestore';

// Your web app's Firebase configuration
// Replace these with your actual Firebase project config values
const firebaseConfig = {
  apiKey: "AIzaSyB9_FFjRUsmxwYJKR6KRh6xNOFKFFADoyA",
  authDomain: "test-377fd529.firebaseapp.com",
  projectId: "test-377fd529",
  storageBucket: "test-377fd529.firebasestorage.app",
  messagingSenderId: "632829682686",
  appId: "1:632829682686:web:11d69934167abdf04956af"
};

// Initialize Firebase only if config is somewhat valid (to prevent immediate crashes if missing)
let app;
let auth: ReturnType<typeof getAuth>;
let db: ReturnType<typeof getFirestore>;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase initialization error:", error);
}

const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider, signInWithPopup, signOut, onSnapshot, doc, setDoc };
