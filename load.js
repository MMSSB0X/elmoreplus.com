// load.js - The Full-Site Gatekeeper
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const siteLoader = document.getElementById("site-loader");

/**
 * Gracefully hides the full-site loader
 */
export function hideSiteLoader() {
    if (siteLoader) {
        siteLoader.classList.add("fade-out");
        // Remove from DOM after transition to save memory
        setTimeout(() => siteLoader.remove(), 500);
    }
}

// Initial check for Firebase Readiness
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            // Wait for user profile data before showing the site
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                console.log("Elmore Plus Ready!");
                hideSiteLoader();
            }
        } catch (error) {
            console.error("Firebase Handshake Failed:", error);
            // Hide anyway so the site isn't permanently stuck
            hideSiteLoader();
        }
    } else {
        // Not logged in? App.js will handle the redirect, hide loader now
        hideSiteLoader();
    }
});