import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

//import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAujl-2ANoOK3-_-NObuuvTCBZgNo3Tqpw",
  authDomain: "skillforge-da0c8.firebaseapp.com",
  projectId: "skillforge-da0c8",
  storageBucket: "skillforge-da0c8.firebasestorage.app",
  messagingSenderId: "287116502790",
  appId: "1:287116502790:web:ee6df539aa66b51f226087",
  measurementId: "G-S0R3RPBZKR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
