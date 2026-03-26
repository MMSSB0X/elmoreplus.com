// profile.js - Fetches and displays the user's profile
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { getDirectImageUrl } from "./gdrive.js";
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            
            if (userDoc.exists()) {
                const data = userDoc.data();
                
                // Update Name & Picture
                document.querySelectorAll(".display-username").forEach(el => el.textContent = data.username);
                document.querySelectorAll(".display-pic").forEach(el => el.src = data.profilePic);
                
                // Update Bio
                document.getElementById("display-bio").textContent = data.bio || "No bio yet.";

                // Update About Me (Use fallbacks if empty)
                document.getElementById("profile-work").textContent = data.work || "Unemployed slacker";
                document.getElementById("profile-hobbies").textContent = data.hobbies || "Staring at the wall";
                document.getElementById("profile-studies").textContent = data.studies || "School of Hard Knocks";
                document.getElementById("profile-from").textContent = data.from || "Parts Unknown";
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    } else {
        window.location.href = "login.html";
    }
});

// Logout logic
const logoutBtns = document.querySelectorAll(".logout-btn");
logoutBtns.forEach(btn => btn.addEventListener("click", () => signOut(auth)));