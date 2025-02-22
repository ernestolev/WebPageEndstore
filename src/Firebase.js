import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA4Nv7yIvuRlNeg7r8U_mSequgS8QnnIs4",
  authDomain: "endstore.firebaseapp.com",
  projectId: "endstore",
  storageBucket: "endstore.appspot.com", // Make sure this is correct
  messagingSenderId: "793470205282",
  appId: "1:793470205282:web:39ac7611d1044965e9803b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };