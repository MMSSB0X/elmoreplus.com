// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-storage.js"; // NEW

const firebaseConfig = {
    apiKey: "AIzaSyBh42k_flcFFDvDsCDuK40rqLuFgwIcuB0",
    authDomain: "elmor-plus.firebaseapp.com",
    projectId: "elmor-plus",
    storageBucket: "elmor-plus.firebasestorage.app",
    messagingSenderId: "133058626609",
    appId: "1:133058626609:web:9eaf3187c005b8399c4110",
    measurementId: "G-DTR9HFPK3H"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // NEW

export { app, auth, db, storage }; // Export storage!