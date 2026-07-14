// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAroeUW_vZhe51kz38L7FJWaAtBcKV8ppE",
  authDomain: "todolist-8dcca.firebaseapp.com",
  projectId: "todolist-8dcca",
  storageBucket: "todolist-8dcca.firebasestorage.app",
  messagingSenderId: "241842694317",
  appId: "1:241842694317:web:4d73128ee38c94caeffe24"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

window.APP = window.APP || {};
window.APP.firebase = window.APP.firebase || {};
window.APP.firebase.auth = auth;
window.APP.firebase.db = db;