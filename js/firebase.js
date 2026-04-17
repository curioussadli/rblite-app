import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

// =============================
// FIRESTORE
// =============================
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  onSnapshot,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// =============================
// STORAGE (CDN FIX)
// =============================
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// =============================
// CONFIG
// =============================
const firebaseConfig = {
  apiKey: "AIzaSyCE7nPHUvlYTlbX654Iq7pA62eNQeDmXKxY",
  authDomain: "rblite-app.firebaseapp.com",
  projectId: "rblite-app",
  storageBucket: "rblite-app.firebasestorage.app",
  messagingSenderId: "373754561853",
  appId: "1:373754561853:web:56bdc30bdfe3ccec30b154",
  measurementId: "G-WQ950MP9E9"
};

// =============================
// INIT APP
// =============================
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const storage = getStorage(app);

console.log("🔥 Firebase CONNECTED OK");

// =============================
// EXPORT
// =============================
export {
  db,
  storage,

  collection,
  doc,

  getDocs,
  onSnapshot,

  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,

  ref,
  uploadBytes,
  getDownloadURL
};