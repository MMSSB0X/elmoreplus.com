// // app.js - Handles Firebase Auth, Feed, and Firestore Data
// import { auth, db } from "./firebase.js";
// import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
// import { doc, getDoc, getDocs, collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp, updateDoc, arrayUnion, arrayRemove, deleteDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// // Import your global Google Drive link cleaner!
// import { getDirectImageUrl } from "./gdrive.js";

// let currentUser = null;
// let userData = null;

// // --- 1. AUTH & PROFILE SYNC ---
// onAuthStateChanged(auth, async (user) => {
//     if (user) {
//         currentUser = user;
//         try {
//             // Fetch fresh data from the users collection
//             const userDoc = await getDoc(doc(db, "users", user.uid));
//             if (userDoc.exists()) {
//                 userData = userDoc.data();
                
//                 // FIX: Clean your own profile picture using the GDrive tool
//                 const myCleanPic = getDirectImageUrl(userData.profilePic) || "https://placehold.co/150";
                
//                 // Sync local object with database values
//                 currentUser.displayName = userData.username;
//                 currentUser.photoURL = myCleanPic;

//                 // Update UI elements instantly
//                 updateStaticUI();
                
//                 // Start listening for posts
//                 startFeedListener();
//             }
//             loadSidebarFriends(); 
//         } catch (error) { 
//             console.error("Profile load error:", error); 
//         }
//     } else {
//         window.location.href = "login.html";
//     }
// });

// function updateStaticUI() {
//     if (!userData) return;
//     const myCleanPic = currentUser.photoURL;
//     document.querySelectorAll(".display-username").forEach(el => el.textContent = userData.username);
//     document.querySelectorAll(".display-pic").forEach(el => el.src = myCleanPic);
//     const inlinePic = document.getElementById("inline-post-pic");
//     if (inlinePic) inlinePic.src = myCleanPic;
// }

// // --- 2. THE FEED (LIVE SYNC & CLICKABLE PROFILES) ---
// function startFeedListener() {
//     const feedContainer = document.getElementById("feed-container");
//     if (!feedContainer) return;

//     const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    
//     onSnapshot(q, (snapshot) => {
//         feedContainer.innerHTML = "";
        
//         snapshot.forEach((postDoc) => {
//             const post = postDoc.data();
//             const id = postDoc.id;
//             const likedBy = post.likedBy || [];
//             const hasLiked = currentUser && likedBy.includes(currentUser.uid);
            
//             // Check if it's your post
//             const isMe = currentUser && currentUser.uid === post.authorUid;
            
//             // FIX: Clean the post author's picture using the GDrive tool!
//             const rawPic = isMe ? currentUser.photoURL : post.authorPic;
//             const displayPic = getDirectImageUrl(rawPic) || "https://placehold.co/150";
            
//             const displayName = isMe ? currentUser.displayName : (post.author || "Citizen");

//             // Smart Link logic for clicking avatars/names
//             const profileLink = isMe ? "profile.html" : `user.html?uid=${post.authorUid}`;

//             // --- DATE AND TIME FORMATTING ---
//             let timeString = "Just now"; 
//             if (post.createdAt) {
//                 const dateObj = post.createdAt.toDate(); 
//                 timeString = dateObj.toLocaleString('en-US', {
//                     month: 'long', day: 'numeric', year: 'numeric',
//                     hour: 'numeric', minute: '2-digit', hour12: true
//                 });
//             }

//             const postDiv = document.createElement("div");
//             postDiv.className = "post";
//             postDiv.innerHTML = `
//                 <img src="${displayPic}" class="post-avatar" onclick="window.location.href='${profileLink}'" style="cursor: pointer;" onerror="this.src='https://placehold.co/150'">

//                 <div class="post-bubble">
//                     <div class="post-header">
//                         <div style="display: flex; flex-direction: column; cursor: pointer;" onclick="window.location.href='${profileLink}'">
//                             <strong style="color: var(--nav-blue-dark);" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${displayName}</strong>
//                             <span style="font-size: 0.7rem; color: #888; margin-top: 3px;">${timeString}</span>
//                         </div>
//                         ${isMe ? `<button class="delete-btn" data-id="${id}"><i class="ri-delete-bin-line"></i></button>` : ''}
//                     </div>
//                     <p>${post.text}</p>
//                 </div>
                
//                 <div class="like-section ${hasLiked ? 'liked' : ''}">
//                     <button class="like-btn" data-id="${id}" data-liked="${hasLiked}">
//                         <i class="fa-solid fa-thumbs-up"></i>
//                         <span style="margin-left:5px">${likedBy.length}</span>
//                     </button>
//                 </div>
//             `;
//             feedContainer.appendChild(postDiv);
//         });
//         attachFeedListeners();
//     });
// }

// // --- 3. LISTENERS & HELPERS ---
// function attachFeedListeners() {
//     document.querySelectorAll('.like-btn').forEach(btn => {
//         btn.onclick = async () => {
//             const id = btn.getAttribute('data-id');
//             const isLiked = btn.getAttribute('data-liked') === 'true';
//             const postRef = doc(db, "posts", id);
//             if (isLiked) await updateDoc(postRef, { likedBy: arrayRemove(currentUser.uid) });
//             else await updateDoc(postRef, { likedBy: arrayUnion(currentUser.uid) });
//         };
//     });

//     // Custom Trash Can Delete Confirmation
//     document.querySelectorAll('.delete-btn').forEach(btn => {
//         btn.onclick = async () => {
//             const id = btn.getAttribute('data-id');
//             if (await showCustomConfirm("Delete Post?", "This can't be undone!")) {
//                 await deleteDoc(doc(db, "posts", id));
//                 await showCustomConfirm("Success!", "Post deleted.", true);
//             }
//         };
//     });
// }

// // --- 4. POSTING & SIDEBAR ---
// async function createPost(text, btn) {
//     if (!text || !currentUser) return;
//     btn.disabled = true;
//     try {
//         await addDoc(collection(db, "posts"), {
//             text: text,
//             author: currentUser.displayName,
//             authorPic: currentUser.photoURL,
//             authorUid: currentUser.uid,
//             createdAt: serverTimestamp(),
//             likedBy: []
//         });
//     } finally { 
//         btn.disabled = false; 
//     }
// }

// document.getElementById("desktop-submit-post")?.addEventListener("click", () => {
//     const input = document.getElementById("desktop-post-text");
//     createPost(input.value.trim(), document.getElementById("desktop-submit-post"));
//     input.value = "";
// });

// document.getElementById("submit-post")?.addEventListener("click", () => {
//     const input = document.getElementById("post-text");
//     createPost(input.value.trim(), document.getElementById("submit-post"));
//     input.value = "";
//     document.getElementById("post-modal").classList.remove("active");
// });

// async function loadSidebarFriends() {
//     const friendsGrid = document.querySelector(".friends-grid");
//     if (!friendsGrid) return;
    
//     const q = query(collection(db, "users"), limit(6));
//     const snapshot = await getDocs(q);
    
//     friendsGrid.innerHTML = "";
//     snapshot.forEach((userDoc) => {
//         const friend = userDoc.data();
//         if (friend.uid === currentUser.uid) return;
        
//         // Apply Google Drive Fix to Sidebar Friends!
//         const cleanFriendPic = getDirectImageUrl(friend.profilePic) || "https://placehold.co/150";

//         const img = document.createElement("img");
//         img.src = cleanFriendPic;
//         // Make sure sidebar friends link correctly to the user page
//         img.onclick = () => window.location.href = `user.html?uid=${userDoc.id}`;
//         img.style.cursor = "pointer";
//         friendsGrid.appendChild(img);
//     });
// }

// // --- 5. CUSTOM CONFIRM MODAL ---
// function showCustomConfirm(title, message, isSuccess = false) {
//     return new Promise((resolve) => {
//         const modal = document.getElementById("custom-alert-modal");
//         document.getElementById("alert-title").textContent = title;
//         document.getElementById("alert-message").textContent = message;
        
//         const iconBox = document.getElementById("alert-icon-box");
//         const btnBox = document.getElementById("alert-buttons");
//         const closeBtn = document.getElementById("alert-close");

//         if (isSuccess) {
//             iconBox.innerHTML = '<i class="ri-checkbox-circle-fill"></i>';
//             iconBox.classList.add("success");
//             btnBox.classList.add("hidden");
//             closeBtn.classList.remove("hidden");
//         } else {
//             iconBox.innerHTML = '<i class="ri-error-warning-fill"></i>';
//             iconBox.classList.remove("success");
//             btnBox.classList.remove("hidden");
//             closeBtn.classList.add("hidden");
//         }

//         modal.classList.add("active");
        
//         document.getElementById("alert-confirm").onclick = () => { 
//             modal.classList.remove("active"); 
//             resolve(true); 
//         };
//         document.getElementById("alert-cancel").onclick = () => { 
//             modal.classList.remove("active"); 
//             resolve(false); 
//         };
//         closeBtn.onclick = () => { 
//             modal.classList.remove("active"); 
//             resolve(true); 
//         };
//     });
// }

// // --- 6. LOGOUT LOGIC ---
// document.querySelectorAll(".logout-btn").forEach(btn => {
//     btn.onclick = (e) => {
//         e.preventDefault();
//         signOut(auth);
//     };
// });












// app.js - Handles Firebase Auth, Feed, and Firestore Data
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
// FIX: Added 'where' to this import list!
import { doc, getDoc, getDocs, collection, addDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp, updateDoc, arrayUnion, arrayRemove, deleteDoc, documentId } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// Import your global Google Drive link cleaner!
import { getDirectImageUrl } from "./gdrive.js";

let currentUser = null;
let userData = null;

// --- 1. AUTH & PROFILE SYNC ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        try {
            // Fetch fresh data from the users collection
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                userData = userDoc.data();
                
                // Clean your own profile picture using the GDrive tool
                const myCleanPic = getDirectImageUrl(userData.profilePic) || "https://placehold.co/150";
                
                // Sync local object with database values
                currentUser.displayName = userData.username;
                currentUser.photoURL = myCleanPic;

                // Update UI elements instantly
                updateStaticUI();
                
                // Start listening for posts
                startFeedListener();
            }
            loadSidebarFriends(); 
        } catch (error) { 
            console.error("Profile load error:", error); 
        }
    } else {
        window.location.href = "login.html";
    }
});

function updateStaticUI() {
    if (!userData) return;
    const myCleanPic = currentUser.photoURL;
    document.querySelectorAll(".display-username").forEach(el => el.textContent = userData.username);
    document.querySelectorAll(".display-pic").forEach(el => el.src = myCleanPic);
    const inlinePic = document.getElementById("inline-post-pic");
    if (inlinePic) inlinePic.src = myCleanPic;
}

// --- 2. THE FEED (LIVE SYNC & CLICKABLE PROFILES) ---
function startFeedListener() {
    const feedContainer = document.getElementById("feed-container");
    if (!feedContainer) return;

    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    
    onSnapshot(q, (snapshot) => {
        feedContainer.innerHTML = "";
        
        snapshot.forEach((postDoc) => {
            const post = postDoc.data();
            const id = postDoc.id;
            const likedBy = post.likedBy || [];
            const hasLiked = currentUser && likedBy.includes(currentUser.uid);
            
            // Check if it's your post
            const isMe = currentUser && currentUser.uid === post.authorUid;
            
            // Clean the post author's picture using the GDrive tool!
            const rawPic = isMe ? currentUser.photoURL : post.authorPic;
            const displayPic = getDirectImageUrl(rawPic) || "https://placehold.co/150";
            
            const displayName = isMe ? currentUser.displayName : (post.author || "Citizen");

            // Smart Link logic for clicking avatars/names
            const profileLink = isMe ? "profile.html" : `user.html?uid=${post.authorUid}`;

            // --- DATE AND TIME FORMATTING ---
            let timeString = "Just now"; 
            if (post.createdAt) {
                const dateObj = post.createdAt.toDate(); 
                timeString = dateObj.toLocaleString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric',
                    hour: 'numeric', minute: '2-digit', hour12: true
                });
            }

            const postDiv = document.createElement("div");
            postDiv.className = "post";
            postDiv.innerHTML = `
                <img src="${displayPic}" class="post-avatar" onclick="window.location.href='${profileLink}'" style="cursor: pointer;" onerror="this.src='https://placehold.co/150'">

                <div class="post-bubble">
                    <div class="post-header">
                        <div style="display: flex; flex-direction: column; cursor: pointer;" onclick="window.location.href='${profileLink}'">
                            <strong style="color: var(--nav-blue-dark);" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${displayName}</strong>
                            <span style="font-size: 0.7rem; color: #888; margin-top: 3px;">${timeString}</span>
                        </div>
                        ${isMe ? `<button class="delete-btn" data-id="${id}"><i class="ri-delete-bin-line"></i></button>` : ''}
                    </div>
                    <p>${post.text}</p>
                </div>
                
                <div class="like-section ${hasLiked ? 'liked' : ''}">
                    <button class="like-btn" data-id="${id}" data-liked="${hasLiked}">
                        <i class="fa-solid fa-thumbs-up"></i>
                        <span style="margin-left:5px">${likedBy.length}</span>
                    </button>
                </div>
            `;
            feedContainer.appendChild(postDiv);
        });
        attachFeedListeners();
    });
}

// --- 3. LISTENERS & HELPERS ---
function attachFeedListeners() {
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.onclick = async () => {
            const id = btn.getAttribute('data-id');
            const isLiked = btn.getAttribute('data-liked') === 'true';
            const postRef = doc(db, "posts", id);
            if (isLiked) await updateDoc(postRef, { likedBy: arrayRemove(currentUser.uid) });
            else await updateDoc(postRef, { likedBy: arrayUnion(currentUser.uid) });
        };
    });

    // Custom Trash Can Delete Confirmation
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = async () => {
            const id = btn.getAttribute('data-id');
            if (await showCustomConfirm("Delete Post?", "This can't be undone!")) {
                await deleteDoc(doc(db, "posts", id));
                await showCustomConfirm("Success!", "Post deleted.", true);
            }
        };
    });
}

// --- 4. POSTING & SIDEBAR ---
async function createPost(text, btn) {
    if (!text || !currentUser) return;
    btn.disabled = true;
    try {
        await addDoc(collection(db, "posts"), {
            text: text,
            author: currentUser.displayName,
            authorPic: currentUser.photoURL,
            authorUid: currentUser.uid,
            createdAt: serverTimestamp(),
            likedBy: []
        });
    } finally { 
        btn.disabled = false; 
    }
}

document.getElementById("desktop-submit-post")?.addEventListener("click", () => {
    const input = document.getElementById("desktop-post-text");
    createPost(input.value.trim(), document.getElementById("desktop-submit-post"));
    input.value = "";
});

document.getElementById("submit-post")?.addEventListener("click", () => {
    const input = document.getElementById("post-text");
    createPost(input.value.trim(), document.getElementById("submit-post"));
    input.value = "";
    document.getElementById("post-modal").classList.remove("active");
});

async function loadSidebarFriends() {
    const friendsGrid = document.querySelector(".friends-grid");
    if (!friendsGrid) return;
    
    // Fetch the current user's document to get their real friends list
    const myDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (!myDoc.exists()) return;
    
    const myFriendsIds = myDoc.data().friends || [];
    friendsGrid.innerHTML = ""; // Clear the placeholders
    
    // If you have no friends, show a message
    if (myFriendsIds.length === 0) {
        friendsGrid.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: #888; font-size: 0.8rem;'>No friends yet.</p>";
        return;
    }
    
    // Grab up to 6 friends to fit nicely in the sidebar
    const chunk = myFriendsIds.slice(0, 6);
    const q = query(collection(db, "users"), where(documentId(), "in", chunk));
    const snapshot = await getDocs(q);
    
    snapshot.forEach((userDoc) => {
        const friend = userDoc.data();
        
        // Apply Google Drive Fix to Sidebar Friends!
        const cleanFriendPic = getDirectImageUrl(friend.profilePic) || "https://placehold.co/150";

        const img = document.createElement("img");
        img.src = cleanFriendPic;
        img.title = friend.username; 
        img.style.cursor = "pointer";
        img.onclick = () => window.location.href = `user.html?uid=${userDoc.id}`;
        
        friendsGrid.appendChild(img);
    });
}

// --- 5. CUSTOM CONFIRM MODAL ---
function showCustomConfirm(title, message, isSuccess = false) {
    return new Promise((resolve) => {
        const modal = document.getElementById("custom-alert-modal");
        document.getElementById("alert-title").textContent = title;
        document.getElementById("alert-message").textContent = message;
        
        const iconBox = document.getElementById("alert-icon-box");
        const btnBox = document.getElementById("alert-buttons");
        const closeBtn = document.getElementById("alert-close");

        if (isSuccess) {
            iconBox.innerHTML = '<i class="ri-checkbox-circle-fill"></i>';
            iconBox.classList.add("success");
            btnBox.classList.add("hidden");
            closeBtn.classList.remove("hidden");
        } else {
            iconBox.innerHTML = '<i class="ri-error-warning-fill"></i>';
            iconBox.classList.remove("success");
            btnBox.classList.remove("hidden");
            closeBtn.classList.add("hidden");
        }

        modal.classList.add("active");
        
        document.getElementById("alert-confirm").onclick = () => { 
            modal.classList.remove("active"); 
            resolve(true); 
        };
        document.getElementById("alert-cancel").onclick = () => { 
            modal.classList.remove("active"); 
            resolve(false); 
        };
        closeBtn.onclick = () => { 
            modal.classList.remove("active"); 
            resolve(true); 
        };
    });
}

// --- 6. LOGOUT LOGIC ---
document.querySelectorAll(".logout-btn").forEach(btn => {
    btn.onclick = (e) => {
        e.preventDefault();
        signOut(auth);
    };
});