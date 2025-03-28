// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase config for st-g-calendar project
const firebaseConfig = {
  apiKey: "AIzaSyCbdd0TkCwLdlvz1RkhJIEuLmWxkITT1sQ",
  authDomain: "st-g-calendar.firebaseapp.com",
  projectId: "st-g-calendar",
  storageBucket: "st-g-calendar.appspot.com", // ✅ fixed domain
  messagingSenderId: "912206083014",
  appId: "1:912206083014:web:d65c1720c6c7ebc87ef8c7",
  measurementId: "G-11B2WJB2CK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
