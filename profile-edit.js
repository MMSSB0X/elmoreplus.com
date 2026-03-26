

// // profile-edit.js - Forms, Avatar Picker & Firebase Update
// import { auth, db } from "./firebase.js"; 
// import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
// import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// // IMPORT YOUR GLOBAL GOOGLE DRIVE FIX
// import { getDirectImageUrl } from "./gdrive.js";

// let currentUserUid = null;

// // ==========================================
// // ELMORE CHARACTER IMAGES ARRAY
// // ==========================================
// const elmoreCharacters = [
//     "https://placehold.co/150x150/4da6ff/FFF?text=Gumball",  
//     "images/Cool gumball and darwin photo.png",  
//     "https://placehold.co/150x150/f0ad4e/FFF?text=Darwin",   
//     "https://placehold.co/150x150/ff99cc/FFF?text=Anais",
//     "https://placehold.co/150x150/32b35a/FFF?text=Bobert",
//     "https://placehold.co/150x150/d9534f/FFF?text=Tina",
//     "https://placehold.co/150x150/a020f0/FFF?text=Penny",
//     "https://placehold.co/150x150/ffcc00/FFF?text=Banana+Joe",
//     "https://placehold.co/150x150/999999/FFF?text=Rocky"
// ];

// // Fetch Current Data to pre-fill the form
// onAuthStateChanged(auth, async (user) => {
//     if (user) {
//         currentUserUid = user.uid;
//         try {
//             const userDoc = await getDoc(doc(db, "users", user.uid));
//             if (userDoc.exists()) {
//                 const data = userDoc.data();
//                 document.getElementById("edit-pic").value = data.profilePic || "";
//                 document.getElementById("edit-bio").value = data.bio || "";
//                 document.getElementById("edit-work").value = data.work || "";
//                 document.getElementById("edit-hobbies").value = data.hobbies || "";
//                 document.getElementById("edit-studies").value = data.studies || "";
//                 document.getElementById("edit-from").value = data.from || "";
//             }
//         } catch (error) {
//             console.error("Error fetching profile:", error);
//         }
//     } else {
//         window.location.href = "login.html";
//     }
// });

// // Build Avatar Picker Modal
// const avatarModal = document.getElementById("avatar-modal");
// const openAvatarBtn = document.getElementById("open-avatar-modal");
// const closeAvatarBtn = document.getElementById("close-avatar-modal");
// const urlInput = document.getElementById("edit-pic");
// const avatarGrid = document.getElementById("avatar-grid");

// // Dynamically generate the images
// if (avatarGrid) {
//     avatarGrid.innerHTML = ""; 
//     elmoreCharacters.forEach(imageUrl => {
//         const imgElement = document.createElement("img");
//         imgElement.src = imageUrl;
//         imgElement.className = "preset-avatar";
//         imgElement.alt = "Elmore Character";
        
//         imgElement.addEventListener("click", () => {
//             urlInput.value = imageUrl;
//             avatarModal.classList.remove("active");
//         });
        
//         avatarGrid.appendChild(imgElement);
//     });
// }

// // Modal Toggle Logic
// if (openAvatarBtn && avatarModal) openAvatarBtn.addEventListener("click", () => avatarModal.classList.add("active"));
// if (closeAvatarBtn && avatarModal) closeAvatarBtn.addEventListener("click", () => avatarModal.classList.remove("active"));

// // Save Profile Logic
// const editForm = document.getElementById("edit-profile-form");
// const saveBtn = document.getElementById("save-profile-btn");

// if (editForm) {
//     editForm.addEventListener("submit", async (e) => {
//         e.preventDefault();
//         if (!currentUserUid) return;

//         saveBtn.textContent = "SAVING...";
//         saveBtn.disabled = true;

//         // USE THE GLOBAL GDRIVE CLEANER HERE
//         const rawUrl = document.getElementById("edit-pic").value.trim();
//         const finalPicUrl = getDirectImageUrl(rawUrl); 

//         try {
//             await updateDoc(doc(db, "users", currentUserUid), {
//                 profilePic: finalPicUrl || `https://placehold.co/150`,
//                 bio: document.getElementById("edit-bio").value.trim(),
//                 work: document.getElementById("edit-work").value.trim(),
//                 hobbies: document.getElementById("edit-hobbies").value.trim(),
//                 studies: document.getElementById("edit-studies").value.trim(),
//                 from: document.getElementById("edit-from").value.trim()
//             });

//             // Redirect to view the updated profile
//             window.location.href = "profile.html";
            
//         } catch (error) {
//             console.error("Error saving profile:", error);
//             alert("Could not save profile. Try again!");
//             saveBtn.textContent = "SAVE CHANGES";
//             saveBtn.disabled = false;
//         }
//     });
// }

















// profile-edit.js - Forms, Avatar Picker & Firebase Update
import { auth, db } from "./firebase.js"; 
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// IMPORT YOUR GLOBAL GOOGLE DRIVE FIX
import { getDirectImageUrl } from "./gdrive.js";

let currentUserUid = null;

// ==========================================
// ELMORE CHARACTER IMAGES ARRAY
// ==========================================
const elmoreCharacters = [
    "https://placehold.co/150x150/4da6ff/FFF?text=Gumball",  
    "images/Cool gumball and darwin photo.png",  
    "https://placehold.co/150x150/f0ad4e/FFF?text=Darwin",   
    "https://placehold.co/150x150/ff99cc/FFF?text=Anais",
    "https://placehold.co/150x150/32b35a/FFF?text=Bobert",
    "https://placehold.co/150x150/d9534f/FFF?text=Tina",
    "https://placehold.co/150x150/a020f0/FFF?text=Penny",
    "https://placehold.co/150x150/ffcc00/FFF?text=Banana+Joe",
    "https://placehold.co/150x150/999999/FFF?text=Rocky"
];

// Fetch Current Data to pre-fill the form
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserUid = user.uid;
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                document.getElementById("edit-pic").value = data.profilePic || "";
                document.getElementById("edit-username").value = data.username || ""; // PRE-FILL NAME
                document.getElementById("edit-bio").value = data.bio || "";
                document.getElementById("edit-work").value = data.work || "";
                document.getElementById("edit-hobbies").value = data.hobbies || "";
                document.getElementById("edit-studies").value = data.studies || "";
                document.getElementById("edit-from").value = data.from || "";
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    } else {
        window.location.href = "login.html";
    }
});

// Build Avatar Picker Modal
const avatarModal = document.getElementById("avatar-modal");
const openAvatarBtn = document.getElementById("open-avatar-modal");
const closeAvatarBtn = document.getElementById("close-avatar-modal");
const urlInput = document.getElementById("edit-pic");
const avatarGrid = document.getElementById("avatar-grid");

// Dynamically generate the images
if (avatarGrid) {
    avatarGrid.innerHTML = ""; 
    elmoreCharacters.forEach(imageUrl => {
        const imgElement = document.createElement("img");
        imgElement.src = imageUrl;
        imgElement.className = "preset-avatar";
        imgElement.alt = "Elmore Character";
        
        imgElement.addEventListener("click", () => {
            urlInput.value = imageUrl;
            avatarModal.classList.remove("active");
        });
        
        avatarGrid.appendChild(imgElement);
    });
}

// Modal Toggle Logic
if (openAvatarBtn && avatarModal) openAvatarBtn.addEventListener("click", () => avatarModal.classList.add("active"));
if (closeAvatarBtn && avatarModal) closeAvatarBtn.addEventListener("click", () => avatarModal.classList.remove("active"));

// Save Profile Logic
const editForm = document.getElementById("edit-profile-form");
const saveBtn = document.getElementById("save-profile-btn");

if (editForm) {
    editForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!currentUserUid) return;

        saveBtn.textContent = "SAVING...";
        saveBtn.disabled = true;

        // USE THE GLOBAL GDRIVE CLEANER HERE
        const rawUrl = document.getElementById("edit-pic").value.trim();
        const finalPicUrl = getDirectImageUrl(rawUrl); 

        try {
            await updateDoc(doc(db, "users", currentUserUid), {
                profilePic: finalPicUrl || `https://placehold.co/150`,
                username: document.getElementById("edit-username").value.trim(), // SAVE NAME
                bio: document.getElementById("edit-bio").value.trim(),
                work: document.getElementById("edit-work").value.trim(),
                hobbies: document.getElementById("edit-hobbies").value.trim(),
                studies: document.getElementById("edit-studies").value.trim(),
                from: document.getElementById("edit-from").value.trim()
            });

            // Redirect to view the updated profile
            window.location.href = "profile.html";
            
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Could not save profile. Try again!");
            saveBtn.textContent = "SAVE CHANGES";
            saveBtn.disabled = false;
        }
    });
}