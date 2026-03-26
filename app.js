// // app.js - Handles Firebase Auth and Firestore Data
// import { auth, db } from "./firebase.js";
// import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
// import { doc, getDoc, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, updateDoc, arrayUnion, arrayRemove, deleteDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// let currentUser = null;

// // --- 1. AUTHENTICATION & PROFILE SETUP ---
// onAuthStateChanged(auth, async (user) => {
//     if (user) {
//         currentUser = user;
        
//         try {
//             // Fetch your actual profile from the database
//             const userDoc = await getDoc(doc(db, "users", user.uid));
            
//             if (userDoc.exists()) {
//                 const userData = userDoc.data();
//                 const actualName = userData.username; 
//                 const profilePic = userData.profilePic;

//                 // Update Main Sidebar & Profile Page elements
//                 const displayElems = document.querySelectorAll(".display-username");
//                 displayElems.forEach(el => el.textContent = actualName);
                
//                 const displayPics = document.querySelectorAll(".display-pic");
//                 displayPics.forEach(el => el.src = profilePic);
                
//                 // Update Desktop Inline Post Box
//                 const inlineName = document.getElementById("inline-post-name");
//                 if (inlineName) inlineName.textContent = actualName;
                
//                 const inlinePic = document.getElementById("inline-post-pic");
//                 if (inlinePic) inlinePic.src = profilePic;
                
//                 // Store actual name globally so posts use it
//                 currentUser.displayName = actualName; 
//                 currentUser.photoURL = profilePic;
//             }
//         } catch (error) {
//             console.error("Error fetching user data:", error);
//         }

//     } else {
//         // Kick them to login if not authenticated
//         window.location.href = "login.html";
//     }
// });

// // Logout Buttons (Finds both desktop and mobile buttons)
// const logoutBtns = document.querySelectorAll(".logout-btn");
// logoutBtns.forEach(btn => {
//     btn.addEventListener("click", (e) => {
//         e.preventDefault();
//         signOut(auth);
//     });
// });

// // --- 2. POST CREATION LOGIC ---
// async function createPost(text, buttonElement) {
//     if (text === "" || !currentUser) return;

//     const originalText = buttonElement.textContent;
//     buttonElement.textContent = "Posting...";
//     buttonElement.disabled = true;

//     try {
//         await addDoc(collection(db, "posts"), {
//             text: text,
//             author: currentUser.displayName, // Uses your real name
//             authorPic: currentUser.photoURL, // Uses your real profile pic
//             authorUid: currentUser.uid, 
//             createdAt: serverTimestamp(),
//             likedBy: [] 
//         });
//     } catch (error) {
//         console.error("Error adding post: ", error);
//         alert("Failed to post! Bobert is messing with the Wi-Fi.");
//     } finally {
//         buttonElement.textContent = originalText;
//         buttonElement.disabled = false;
//     }
// }

// // Modal Post Submit (Mobile or Floating Button)
// const submitPostBtn = document.getElementById("submit-post");
// const postInput = document.getElementById("post-text");
// const modal = document.getElementById("post-modal");

// if (submitPostBtn) {
//     submitPostBtn.addEventListener("click", async () => {
//         await createPost(postInput.value.trim(), submitPostBtn);
//         postInput.value = ""; 
//         if(modal) modal.classList.remove("active");
//     });
// }

// // Desktop Post Submit (Inline Feed Box)
// const desktopSubmitBtn = document.getElementById("desktop-submit-post");
// const desktopPostInput = document.getElementById("desktop-post-text");

// if (desktopSubmitBtn) {
//     desktopSubmitBtn.addEventListener("click", async () => {
//         await createPost(desktopPostInput.value.trim(), desktopSubmitBtn);
//         desktopPostInput.value = ""; 
//     });
// }

// // --- 3. FETCH POSTS, LIKES & DELETES ---
// const feedContainer = document.getElementById("feed-container");

// if (feedContainer) {
//     // Query posts ordered by newest first
//     const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

//     // Real-time listener for the feed
//     onSnapshot(q, (snapshot) => {
//         feedContainer.innerHTML = ""; // Clear feed before rebuilding

//         snapshot.forEach((postDoc) => {
//             const postData = postDoc.data();
//             const postId = postDoc.id; 
            
//             const likedBy = postData.likedBy || [];
//             const likeCount = likedBy.length;
//             const hasLiked = currentUser ? likedBy.includes(currentUser.uid) : false;
            
//             // Check if current user is the author (to show the delete button)
//             const isAuthor = currentUser && currentUser.uid === postData.authorUid;
//             const deleteBtnHTML = isAuthor ? `<button class="delete-btn" data-id="${postId}"><i class="ri-delete-bin-line"></i></button>` : '';

//             // Build the HTML for each post
//             const postElement = document.createElement("div");
//             postElement.classList.add("post");
            
//             postElement.innerHTML = `
//                 <img src="${postData.authorPic || `https://placehold.co/80/DAA520/FFF?text=${postData.author.charAt(0)}`}" class="post-avatar" alt="User">
//                 <div class="post-bubble">
//                     <div class="post-header" style="display: flex; justify-content: space-between; align-items: start;">
//                         <strong style="color: var(--nav-blue-dark);">${postData.author}</strong>
//                         ${deleteBtnHTML}
//                     </div>
//                     <p style="margin-top: 5px; line-height: 1.4;">${postData.text}</p>
//                 </div>
//                 <div class="like-section" style="background-color: ${hasLiked ? '#278e46' : 'var(--accent-green)'};">
//                     <button class="like-btn" data-id="${postId}" data-liked="${hasLiked}">
//                         <i class="fa-solid fa-thumbs-up"></i> <span style="font-size: 1rem; margin-left: 5px; font-family: sans-serif;">${likeCount}</span>
//                     </button>
//                 </div>
//             `;
            
//             feedContainer.appendChild(postElement);
//         });

//         // Attach Like Listeners to the new buttons
//         document.querySelectorAll('.like-btn').forEach(button => {
//             button.addEventListener('click', async (e) => {
//                 if (!currentUser) return; 
                
//                 const btn = e.currentTarget;
//                 const postId = btn.getAttribute('data-id');
//                 const currentlyLiked = btn.getAttribute('data-liked') === 'true';
//                 const postRef = doc(db, "posts", postId);

//                 try {
//                     if (currentlyLiked) {
//                         // Unlike
//                         await updateDoc(postRef, { likedBy: arrayRemove(currentUser.uid) });
//                     } else {
//                         // Like
//                         await updateDoc(postRef, { likedBy: arrayUnion(currentUser.uid) });
//                     }
//                 } catch (error) {
//                     console.error("Error updating like: ", error);
//                 }
//             });
//         });

//         // Attach Delete Listeners to the trash can icons
//         document.querySelectorAll('.delete-btn').forEach(button => {
//             button.addEventListener('click', async (e) => {
//                 const btn = e.currentTarget;
//                 const postId = btn.getAttribute('data-id');
                
//                 if(confirm("Delete this post? Gumball can't un-delete it if you change your mind.")) {
//                     try {
//                         await deleteDoc(doc(db, "posts", postId));
//                     } catch(error) {
//                         console.error("Error deleting post:", error);
//                     }
//                 }
//             });
//         });
//     });
// }




import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { doc, getDoc, getDocs, collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp, updateDoc, arrayUnion, arrayRemove, deleteDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
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
                
                // Sync local object with database values
                currentUser.displayName = userData.username;
                currentUser.photoURL = userData.profilePic;

                // Update UI elements instantly
                updateStaticUI();
                // Refresh the feed to show your new live image
                startFeedListener();
            }
            loadSidebarFriends(); 
        } catch (error) { console.error("Profile load error:", error); }
    } else {
        window.location.href = "login.html";
    }
});

function updateStaticUI() {
    if (!userData) return;
    document.querySelectorAll(".display-username").forEach(el => el.textContent = userData.username);
    document.querySelectorAll(".display-pic").forEach(el => el.src = userData.profilePic);
    const inlinePic = document.getElementById("inline-post-pic");
    if (inlinePic) inlinePic.src = userData.profilePic;
}

// --- 2. THE FEED (WITH LIVE SYNC) ---
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
            
//             // LOGIC: If it's YOUR post, use your LIVE data. If not, use what's in the post.
//             const isMe = currentUser && currentUser.uid === post.authorUid;
//             const displayPic = isMe ? currentUser.photoURL : (post.authorPic || "https://placehold.co/150x150/87CEEB/FFF?text=User");
//             const displayName = isMe ? currentUser.displayName : (post.author || "Unknown");

//             const postDiv = document.createElement("div");
//             postDiv.className = "post";
//             postDiv.innerHTML = `
//                 <img src="${displayPic}" class="post-avatar" onerror="this.src='https://placehold.co/150x150/87CEEB/FFF?text=Error'">
//                 <div class="post-bubble">
//                     <div class="post-header">
//                         <strong>${displayName}</strong>
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
            
            // LIVE SYNC: Use current data if it's your post
            const isMe = currentUser && currentUser.uid === post.authorUid;
            const displayPic = isMe ? currentUser.photoURL : (post.authorPic || "https://placehold.co/150");
            const displayName = isMe ? currentUser.displayName : (post.author || "Citizen");
            
            // Get the bio (fallback to a generic message if empty)
            const displayBio = isMe ? (userData?.bio || "Just hanging out in Elmore") : (post.authorBio || "Resident of Elmore");

            // --- NEW: DATE AND TIME FORMATTING ---
            let timeString = "Just now"; // Default for the exact moment you post
            if (post.createdAt) {
                const dateObj = post.createdAt.toDate(); // Convert Firebase time to normal time
                timeString = dateObj.toLocaleString('en-US', {
                    month: 'long',   // e.g., "March"
                    day: 'numeric',  // e.g., "26"
                    year: 'numeric', // e.g., "2026"
                    hour: 'numeric', // e.g., "2"
                    minute: '2-digit', // e.g., "06"
                    hour12: true     // AM/PM format
                });
            }

            const postDiv = document.createElement("div");
            postDiv.className = "post";
            postDiv.innerHTML = `
                <div class="avatar-wrapper">
                    <img src="${displayPic}" class="post-avatar" onerror="this.src='https://placehold.co/150'">
                    <span class="bio-tooltip">${displayBio}</span>
                </div>

                <div class="post-bubble">
                    <div class="post-header">
                        <div style="display: flex; flex-direction: column;">
                            <strong>${displayName}</strong>
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
            
//             // LIVE SYNC: Use current data if it's your post
//             const isMe = currentUser && currentUser.uid === post.authorUid;
//             const displayPic = isMe ? currentUser.photoURL : (post.authorPic || "https://placehold.co/150");
//             const displayName = isMe ? currentUser.displayName : (post.author || "Citizen");
            
//             // Get the bio (fallback to a generic message if empty)
//             const displayBio = isMe ? (userData?.bio || "Just hanging out in Elmore") : (post.authorBio || "Resident of Elmore");

//             const postDiv = document.createElement("div");
//             postDiv.className = "post";
//             postDiv.innerHTML = `
//                 <div class="avatar-wrapper">
//                     <img src="${displayPic}" class="post-avatar" onerror="this.src='https://placehold.co/150'">
//                     <span class="bio-tooltip">${displayBio}</span>
//                 </div>

//                 <div class="post-bubble">
//                     <div class="post-header">
//                         <strong>${displayName}</strong>
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
        // Inside your attachFeedListeners() function in app.js
document.querySelectorAll('.avatar-wrapper').forEach(wrapper => {
    // Prevent the default "context menu" on long press
    wrapper.oncontextmenu = function(event) {
        event.preventDefault();
        event.stopPropagation();
        return false;
    };
});
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
//     } finally { btn.disabled = false; }
// }
async function createPost(text, btn) {
    if (!text || !currentUser) return;
    btn.disabled = true;
    try {
        await addDoc(collection(db, "posts"), {
            text: text,
            author: currentUser.displayName,
            authorPic: currentUser.photoURL,
            authorBio: userData?.bio || "", // SAVE BIO TO POST
            authorUid: currentUser.uid,
            createdAt: serverTimestamp(),
            likedBy: []
        });
    } finally { btn.disabled = false; }
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
    const q = query(collection(db, "users"), limit(6));
    const snapshot = await getDocs(q);
    friendsGrid.innerHTML = "";
    snapshot.forEach((userDoc) => {
        const friend = userDoc.data();
        if (friend.uid === currentUser.uid) return;
        const img = document.createElement("img");
        img.src = friend.profilePic;
        img.onclick = () => window.location.href = `profile.html?uid=${userDoc.id}`;
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
        document.getElementById("alert-confirm").onclick = () => { modal.classList.remove("active"); resolve(true); };
        document.getElementById("alert-cancel").onclick = () => { modal.classList.remove("active"); resolve(false); };
        closeBtn.onclick = () => { modal.classList.remove("active"); resolve(true); };
    });
}

document.querySelectorAll(".logout-btn").forEach(btn => btn.onclick = () => signOut(auth));




// // app.js - Optimized for UI and Real Data
// import { auth, db } from "./firebase.js";
// import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
// import { doc, getDoc, getDocs, collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp, updateDoc, arrayUnion, arrayRemove, deleteDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// let currentUser = null;

// // --- 1. AUTH & PROFILE ---
// onAuthStateChanged(auth, async (user) => {
//     if (user) {
//         currentUser = user;
//         const userDoc = await getDoc(doc(db, "users", user.uid));
//         if (userDoc.exists()) {
//             const userData = userDoc.data();
//             // Update all images and names
//             document.querySelectorAll(".display-username").forEach(el => el.textContent = userData.username);
//             document.querySelectorAll(".display-pic").forEach(el => el.src = userData.profilePic);
//             const inlinePic = document.getElementById("inline-post-pic");
//             if (inlinePic) inlinePic.src = userData.profilePic;
            
//             currentUser.displayName = userData.username;
//             currentUser.photoURL = userData.profilePic;
//         }
//         loadSidebarFriends(); // Load the friends grid once authed
//     } else {
//         window.location.href = "login.html";
//     }
// });

// // --- 2. POST CREATION ---
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
//     } finally { btn.disabled = false; }
// }

// // Event Listeners for Posting
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

// // --- 3. THE FEED ---
// const feedContainer = document.getElementById("feed-container");
// if (feedContainer) {
//     const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
//     onSnapshot(q, (snapshot) => {
//         feedContainer.innerHTML = "";
//         snapshot.forEach((postDoc) => {
//             const post = postDoc.data();
//             const id = postDoc.id;
//             const hasLiked = currentUser && post.likedBy?.includes(currentUser.uid);
            
//             const div = document.createElement("div");
//             div.className = "post";
//             div.innerHTML = `
//                 <img src="${post.authorPic}" class="post-avatar">
//                 <div class="post-bubble">
//                     <div class="post-header">
//                         <strong>${post.author}</strong>
//                         ${currentUser.uid === post.authorUid ? `<button class="delete-btn" data-id="${id}"><i class="ri-delete-bin-line"></i></button>` : ''}
//                     </div>
//                     <p>${post.text}</p>
//                 </div>
//                 <div class="like-section" style="background: ${hasLiked ? '#278e46' : 'var(--accent-green)'}">
//                     <button class="like-btn" data-id="${id}" data-liked="${hasLiked}">
//                         <i class="fa-solid fa-thumbs-up"></i>
//                         <span style="margin-left:5px">${post.likedBy?.length || 0}</span>
//                     </button>
//                 </div>
//             `;
//             feedContainer.appendChild(div);
//         });
//     });
// }

// // --- 4. SIDEBAR FRIENDS LOGIC ---
// async function loadSidebarFriends() {
//     const friendsGrid = document.querySelector(".friends-grid");
//     if (!friendsGrid) return;

//     // Fetch up to 6 users from the database
//     const q = query(collection(db, "users"), limit(6));
//     const querySnapshot = await getDocs(q);
    
//     friendsGrid.innerHTML = ""; // Clear placeholders
    
//     querySnapshot.forEach((userDoc) => {
//         const userData = userDoc.data();
//         if (userData.uid === currentUser.uid) return; // Don't show yourself

//         const img = document.createElement("img");
//         img.src = userData.profilePic || "https://placehold.co/60";
//         img.alt = userData.username;
//         img.title = userData.username;
//         img.style.cursor = "pointer";
//         img.onclick = () => window.location.href = `profile.html?uid=${userDoc.id}`;
        
//         friendsGrid.appendChild(img);
//     });
// }

// // Logout
// document.querySelectorAll(".logout-btn").forEach(btn => btn.addEventListener("click", () => signOut(auth)));