import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCkYBnmE6fv__osymaDhPHVUjdg60e_aos",
  authDomain: "mypetrock-2b073.firebaseapp.com",
  projectId: "mypetrock-2b073",
  storageBucket: "mypetrock-2b073.firebasestorage.app",
  messagingSenderId: "229284276416",
  appId: "1:229284276416:web:13148d0ace35ce5afba525",
  measurementId: "G-NXYFFVH6LG"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
