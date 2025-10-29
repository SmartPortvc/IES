// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCN1T0kGA5i1hXry-mOnRcNh9KI2wwo67U",
  authDomain: "ies-portal-179b7.firebaseapp.com",
  projectId: "ies-portal-179b7",
  storageBucket: "ies-portal-179b7.firebasestorage.app",
  messagingSenderId: "628941377735",
  appId: "1:628941377735:web:95edf3f9a7b934df302ee2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;