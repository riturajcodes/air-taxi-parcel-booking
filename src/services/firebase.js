// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBPe_H_WCmiy0EvwdO7rtsbQyozHS3qwgY",
  authDomain: "endtermtaxi.firebaseapp.com",
  projectId: "endtermtaxi",
  storageBucket: "endtermtaxi.firebasestorage.app",
  messagingSenderId: "787817097912",
  appId: "1:787817097912:web:ccdddfc5fd77acc674224d",
  measurementId: "G-CZZVYC05J1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
getAnalytics(app);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;