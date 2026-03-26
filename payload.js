import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

/**
 * The "Easy" Loader
 * @param {string} userUid - The Firebase UID of the user
 * @param {object} elements - An object matching data types to your HTML IDs
 */
async function fillUser(userUid, elements) {
    try {
        const userSnap = await getDoc(doc(db, "users", userUid));
        
        if (userSnap.exists()) {
            const data = userSnap.data();

            // Fill Image if ID is provided
            if (elements.imgId) {
                const img = document.getElementById(elements.imgId);
                if (img) img.src = data.profilePic || "images/placeholder.png";
            }

            // Fill Name if ID is provided
            if (elements.nameId) {
                const name = document.getElementById(elements.nameId);
                if (name) name.textContent = data.username || "Unknown";
            }

            // Fill Email if ID is provided
            if (elements.emailId) {
                const email = document.getElementById(elements.emailId);
                if (email) email.textContent = data.email || "No Email";
            }
        }
    } catch (error) {
        console.error("Easy Loader Error:", error);
    }
}

// --- HOW TO USE IT ---

// Load User 1 into the first set of IDs
fillUser("USER_UID_1", {
    imgId: "my-image-id",
    nameId: "my-name-id",
    emailId: "my-email-id"
});

// Load User 2 into the second set of IDs (only image and name)
fillUser("USER_UID_2", {
    imgId: "friend-pic",
    nameId: "friend-name"
});