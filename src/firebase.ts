import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyACVpeHtLF9jSRk0OJzMYPaqDVOUydcUaU",
  authDomain: "tutuchit-anniversary.firebaseapp.com",
  projectId: "tutuchit-anniversary",
  storageBucket: "tutuchit-anniversary.firebasestorage.app",
  messagingSenderId: "177443116025",
  appId: "1:177443116025:web:a9d539bcc17e9692dde328",
  measurementId: "G-QE9YX2W60M"
};

// Firebase App & Services (Auth & Firestore only - no Firebase Storage needed)
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

