import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA4Nv7yIvuRlNeg7r8U_mSequgS8QnnIs4",
    authDomain: "endstore.firebaseapp.com",
    projectId: "endstore",
    storageBucket: "endstore.firebasestorage.app",
    messagingSenderId: "793470205282",
    appId: "1:793470205282:web:39ac7611d1044965e9803b"
};

const app = initializeApp(firebaseConfig);

// Initialize services without emulator connections
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'us-central1');
export const storage = getStorage(app);