// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJValaDT0bxBqBHSVtIwteYEpe0Wgdvac",
  authDomain: "womensafetyyy.firebaseapp.com",
  projectId: "womensafetyyy",
  storageBucket: "womensafetyyy.firebasestorage.app",
  messagingSenderId: "632383870127",
  appId: "1:632383870127:web:7c0e87dd1258765f73b05a",
  measurementId: "G-W6MRH9EKBL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics;
try {
  analytics = getAnalytics(app);
} catch (error) {
  console.warn("Analytics not supported in this environment");
}
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, db, storage };
