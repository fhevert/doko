// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA91O5frp0Uv-iCXued8zh0B6wLNsgqICA",
  authDomain: "dokonote.firebaseapp.com",
  databaseURL: "https://dokonote-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "dokonote",
  storageBucket: "dokonote.firebasestorage.app",
  messagingSenderId: "616727448027",
  appId: "1:616727448027:web:836aafce4be1ca3a6c3ffe",
  measurementId: "G-X7B84107FD"
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);
export const analytics = getAnalytics(firebaseApp);
export const firebaseDB = getDatabase(firebaseApp);