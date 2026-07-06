
// // friends.js - Multi-Page Controller for Elmore Plus Connections
// import { auth, db } from "./firebase.js";
// import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
// // import { collection, getDocs, doc, getDoc, query, orderBy, where, updateDoc, arrayUnion, deleteDoc, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
// import { collection, getDocs, doc, getDoc, query, orderBy, where, updateDoc, arrayUnion, deleteDoc, limit, onSnapshot, documentId } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
// let currentUserUid = null;
// let userData = null;

// // --- 1. SETUP & AUTH ---
// onAuthStateChanged(auth, async (user) => {
//     if (user) {
//         currentUserUid = user.uid;
        
//         // Fetch current user data (to check who you are already friends with)
//         const userDoc = await getDoc(doc(db, "users", user.uid));
//         if (userDoc.exists()) {
//             userData = userDoc.data();
//         }

//         // --- PAGE ROUTER: Run logic based on which HTML page is open ---
//         // If we are on friends.html
//         if (document.getElementById("all-users-grid")) {
//             loadMyFriends(); 
//         }
//         // If we are on friend-requests.html
//         if (document.getElementById("requests-container")) {
//             loadRequests();
//         }
//         // If we are on find-friends.html
//         if (document.getElementById("discover-container")) {
//             loadDiscover();
//             setupBigSearch();
//         }

//     } else {
//         window.location.href = "login.html";
//     }
// });

// // Logout logic
// document.querySelectorAll(".logout-btn").forEach(btn => {
//     btn.addEventListener("click", (e) => {
//         e.preventDefault();
//         signOut(auth);
//     });
// });

// // --- 2. FETCH: MY FRIENDS (For friends.html) ---
// async function loadMyFriends() {
//     const grid = document.getElementById("all-users-grid");
//     if (!grid) return;
    
//     grid.innerHTML = `<p style="text-align: center; color: #888; grid-column: 1 / -1;"><i class="ri-loader-4-line ri-spin"></i> Loading your crew...</p>`;
    
//     const myFriendsIds = userData.friends || [];

//     if (myFriendsIds.length === 0) {
//         grid.innerHTML = `<p style="text-align:center; color:#888; padding: 20px; grid-column: 1 / -1;">You have no friends yet. Go to Find Friends to add some!</p>`;
//         return;
//     }

//     grid.innerHTML = "";
    
//     // Fetch up to 10 friends at a time (Firestore limits 'in' queries to 10)
//     const chunk = myFriendsIds.slice(0, 10);
//     // const q = query(collection(db, "users"), where("__name__", "in", chunk));
//     const q = query(collection(db, "users"), where(documentId(), "in", chunk));
//     const snapshot = await getDocs(q);

//     snapshot.forEach((docSnap) => {
//         const friend = docSnap.data();
//         const picUrl = friend.profilePic || `https://placehold.co/150`;
//         const bioText = friend.bio || "No bio yet.";
//         const btnHtml = `<button class="auth-btn" style="background-color: var(--nav-blue); padding: 8px; font-size: 0.85rem; width: 100%; margin: 0;" onclick="window.location.href='user.html?uid=${docSnap.id}'"><i class="ri-user-smile-fill"></i> Visit Page</button>`;
        
//         grid.innerHTML += buildCard(picUrl, friend.username, bioText, btnHtml, docSnap.id);
//     });
// }

// // --- 3. FETCH: FRIEND REQUESTS (For friend-requests.html) ---
// function loadRequests() {
//     const grid = document.getElementById("requests-container");
//     if (!grid) return;

//     grid.innerHTML = `<p style="text-align: center; color: #888; grid-column: 1 / -1;"><i class="ri-loader-4-line ri-spin"></i> Checking mailbox...</p>`;
    
//     const q = query(collection(db, "friendRequests"), where("receiverUid", "==", currentUserUid));
    
//     onSnapshot(q, (snapshot) => {
//         grid.innerHTML = "";
        
//         if (snapshot.empty) {
//             grid.innerHTML = `<p style="text-align:center; color:#888; padding: 20px; grid-column: 1 / -1;">No pending requests right now.</p>`;
//             return;
//         }

//         snapshot.forEach((reqDoc) => {
//             const req = reqDoc.data();
//             const id = reqDoc.id;

//             const btnHtml = `
//                 <div style="display: flex; gap: 5px;">
//                     <button class="auth-btn" style="background-color: var(--accent-green); padding: 8px; font-size: 0.8rem; flex: 1; margin: 0;" onclick="acceptRequest('${id}', '${req.senderUid}')">Accept</button>
//                     <button class="auth-btn" style="background-color: #d9534f; padding: 8px; font-size: 0.8rem; flex: 1; margin: 0;" onclick="declineRequest('${id}')">Decline</button>
//                 </div>
//             `;
            
//             grid.innerHTML += buildCard(req.senderPic || "https://placehold.co/150", req.senderName, "Wants to be your friend!", btnHtml, req.senderUid);
//         });
//     });
// }

// // --- 4. ACCEPT / DECLINE LOGIC ---
// window.acceptRequest = async (requestId, senderUid) => {
//     try {
//         // Add them to your friends list
//         await updateDoc(doc(db, "users", currentUserUid), { friends: arrayUnion(senderUid) });
//         // Add you to their friends list
//         await updateDoc(doc(db, "users", senderUid), { friends: arrayUnion(currentUserUid) });
//         // Remove the request from the database
//         await deleteDoc(doc(db, "friendRequests", requestId));
//     } catch (error) { 
//         console.error("Error accepting request:", error); 
//     }
// };

// window.declineRequest = async (requestId) => {
//     try { 
//         await deleteDoc(doc(db, "friendRequests", requestId)); 
//     } catch (error) { 
//         console.error("Error declining request:", error); 
//     }
// };

// // --- 5. FETCH: DISCOVER & SEARCH (For find-friends.html) ---
// async function loadDiscover() {
//     const grid = document.getElementById("discover-container");
//     if (!grid) return;

//     try {
//         const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(12));
//         const snapshot = await getDocs(usersQuery);
//         grid.innerHTML = ""; 

//         snapshot.forEach((docSnap) => {
//             const friendData = docSnap.data();
//             const friendId = docSnap.id;
            
//             // Skip yourself, and skip people you are already friends with
//             const myFriends = userData.friends || [];
//             if (friendId === currentUserUid || myFriends.includes(friendId)) return;

//             const picUrl = friendData.profilePic || `https://placehold.co/150`;
//             const btnHtml = `<button class="auth-btn" style="background-color: var(--nav-blue); padding: 8px; font-size: 0.85rem; width: 100%; margin: 0;" onclick="window.location.href='user.html?uid=${friendId}'"><i class="ri-user-search-line"></i> View Profile</button>`;
            
//             grid.innerHTML += buildCard(picUrl, friendData.username, friendData.bio || "No bio yet.", btnHtml, friendId);
//         });
//     } catch (error) { 
//         console.error("Error loading discover:", error); 
//     }
// }

// function setupBigSearch() {
//     const input = document.getElementById("big-user-search");
//     const grid = document.getElementById("discover-container");
//     let timeout = null;

//     if (!input || !grid) return;

//     input.addEventListener("input", (e) => {
//         const term = e.target.value.trim();
//         clearTimeout(timeout);
        
//         if (!term) {
//             loadDiscover(); // Reset back to default suggestions if search is empty
//             return;
//         }

//         timeout = setTimeout(async () => {
//             grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center;"><i class="ri-loader-4-line ri-spin"></i> Searching...</p>`;
            
//             // Firebase prefix search magic
//             const q = query(collection(db, "users"), where("username", ">=", term), where("username", "<=", term + "\uf8ff"), limit(6));
//             const snapshot = await getDocs(q);
            
//             grid.innerHTML = "";
//             if (snapshot.empty) {
//                 grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888;">No citizens found matching "${term}".</p>`;
//                 return;
//             }
            
//             snapshot.forEach((docSnap) => {
//                 // Don't show yourself in the search results
//                 if (docSnap.id !== currentUserUid) {
//                     const data = docSnap.data();
//                     const btnHtml = `<button class="auth-btn" style="background-color: var(--nav-blue); padding: 8px; font-size: 0.85rem; width: 100%; margin: 0;" onclick="window.location.href='user.html?uid=${docSnap.id}'">View Profile</button>`;
//                     grid.innerHTML += buildCard(data.profilePic || "https://placehold.co/150", data.username, data.bio || "No bio yet.", btnHtml, docSnap.id);
//                 }
//             });
//         }, 300); // 300ms delay to save Firebase bandwidth
//     });
// }

// // --- 6. UTILITY: EXACT CUSTOM CARD BUILDER ---
// // This uses the exact HTML and inline CSS you uploaded!
// function buildCard(picUrl, name, bio, actionHtml, uid) {
//     return `
//         <div style="background: white; border: 1px solid var(--border-color); border-radius: 8px; padding: 15px; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
//             <img src="${picUrl}" alt="${name}" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover; margin-bottom: 10px; border: 2px solid var(--nav-blue-dark); cursor:pointer;" onclick="window.location.href='user.html?uid=${uid}'">
//             <h3 style="color: var(--nav-blue-dark); font-size: 1.1rem; margin-bottom: 5px; cursor:pointer;" onclick="window.location.href='user.html?uid=${uid}'">${name}</h3>
//             <p class="bio-text" style="font-size: 0.8rem; color: #666; margin-bottom: 15px; height: 40px; overflow: hidden;">${bio}</p>
//             ${actionHtml}
//         </div>
//     `;
// }












































// friends.js - Multi-Page Controller for Elmore Plus Connections
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { collection, getDocs, doc, getDoc, query, orderBy, where, updateDoc, arrayUnion, deleteDoc, limit, onSnapshot, documentId } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

let currentUserUid = null;
let userData = null;
let loadedFriendsData = []; // Cache for My Friends search
let allUsersCache = []; // Cache for Discover search

// --- 1. SETUP & AUTH ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserUid = user.uid;
        
        // Fetch current user data
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            userData = userDoc.data();
        }

        // --- PAGE ROUTER: Run logic based on which HTML page is open ---
        // If we are on friends.html (My Friends)
        if (document.getElementById("all-users-grid")) {
            loadMyFriends(); 
        }
        // If we are on friend-requests.html
        if (document.getElementById("requests-container")) {
            loadRequests();
        }
        // If we are on find-friends.html (Discover)
        if (document.getElementById("discover-container")) {
            loadDiscover();
            setupBigSearch();
        }

    } else {
        window.location.href = "login.html";
    }
});

// Logout logic
document.querySelectorAll(".logout-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        signOut(auth);
    });
});

// --- 2. FETCH: MY FRIENDS (For friends.html) ---
async function loadMyFriends() {
    const grid = document.getElementById("all-users-grid");
    const searchInput = document.getElementById("my-friends-search");
    
    if (!grid) return;
    
    grid.innerHTML = `<p style="text-align: center; color: #888; grid-column: 1 / -1;"><i class="ri-loader-4-line ri-spin" style="font-size: 2rem; color: var(--nav-blue);"></i><br><br>Loading your crew...</p>`;
    
    const myFriendsIds = userData.friends || [];

    if (myFriendsIds.length === 0) {
        grid.innerHTML = `<p style="text-align:center; color:#888; padding: 20px; grid-column: 1 / -1;">You have no friends yet. Go to Find Friends to add some!</p>`;
        if (searchInput) searchInput.parentElement.style.display = "none";
        return;
    }

    loadedFriendsData = []; 
    
    const chunks = [];
    for (let i = 0; i < myFriendsIds.length; i += 10) {
        chunks.push(myFriendsIds.slice(i, i + 10));
    }

    try {
        for (const chunk of chunks) {
            const q = query(collection(db, "users"), where(documentId(), "in", chunk));
            const snapshot = await getDocs(q);
            snapshot.forEach((docSnap) => {
                loadedFriendsData.push({ id: docSnap.id, ...docSnap.data() });
            });
        }

        renderMyFriends(loadedFriendsData);

        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                const term = e.target.value.trim().toLowerCase();
                
                if (!term) {
                    renderMyFriends(loadedFriendsData);
                    return;
                }

                const filtered = loadedFriendsData.filter(friend => 
                    friend.username && friend.username.toLowerCase().includes(term)
                );
                
                renderMyFriends(filtered);
            });
        }

    } catch (error) {
        console.error("Error loading friends:", error);
        grid.innerHTML = `<p style="color: red; text-align: center; grid-column: 1 / -1;">Failed to load friends. Bobert strikes again.</p>`;
    }
}

function renderMyFriends(friendsArray) {
    const grid = document.getElementById("all-users-grid");
    grid.innerHTML = "";

    if (friendsArray.length === 0) {
        grid.innerHTML = `<p style="text-align:center; color:#888; padding: 40px 0; grid-column: 1 / -1;"><i class="ri-ghost-smile-line" style="font-size: 3rem; color: var(--border-color);"></i><br>No friends found matching that search.</p>`;
        return;
    }

    friendsArray.forEach(friend => {
        const picUrl = friend.profilePic || `https://placehold.co/150`;
        const bioText = friend.bio || "No bio yet.";
        const btnHtml = `<button class="auth-btn" style="background-color: var(--nav-blue); padding: 8px; font-size: 0.85rem; width: 100%; margin: 0; border-radius: 8px;" onclick="window.location.href='user.html?uid=${friend.id}'"><i class="ri-user-smile-fill"></i> Visit Page</button>`;
        
        grid.innerHTML += buildCard(picUrl, friend.username, bioText, btnHtml, friend.id);
    });
}

// --- 3. FETCH: FRIEND REQUESTS (For friend-requests.html) ---
function loadRequests() {
    const grid = document.getElementById("requests-container");
    if (!grid) return;

    grid.innerHTML = `<p style="text-align: center; color: #888; grid-column: 1 / -1;"><i class="ri-loader-4-line ri-spin"></i> Checking mailbox...</p>`;
    
    const q = query(collection(db, "friendRequests"), where("receiverUid", "==", currentUserUid));
    
    onSnapshot(q, (snapshot) => {
        grid.innerHTML = "";
        
        if (snapshot.empty) {
            grid.innerHTML = `<p style="text-align:center; color:#888; padding: 20px; grid-column: 1 / -1;">No pending requests right now.</p>`;
            return;
        }

        snapshot.forEach((reqDoc) => {
            const req = reqDoc.data();
            const id = reqDoc.id;

            const btnHtml = `
                <div style="display: flex; gap: 5px;">
                    <button class="auth-btn" style="background-color: var(--accent-green); padding: 8px; font-size: 0.8rem; flex: 1; margin: 0;" onclick="acceptRequest('${id}', '${req.senderUid}')">Accept</button>
                    <button class="auth-btn" style="background-color: #d9534f; padding: 8px; font-size: 0.8rem; flex: 1; margin: 0;" onclick="declineRequest('${id}')">Decline</button>
                </div>
            `;
            
            grid.innerHTML += buildCard(req.senderPic || "https://placehold.co/150", req.senderName, "Wants to be your friend!", btnHtml, req.senderUid);
        });
    });
}

// --- 4. ACCEPT / DECLINE LOGIC ---
window.acceptRequest = async (requestId, senderUid) => {
    try {
        await updateDoc(doc(db, "users", currentUserUid), { friends: arrayUnion(senderUid) });
        await updateDoc(doc(db, "users", senderUid), { friends: arrayUnion(currentUserUid) });
        await deleteDoc(doc(db, "friendRequests", requestId));
    } catch (error) { 
        console.error("Error accepting request:", error); 
    }
};

window.declineRequest = async (requestId) => {
    try { 
        await deleteDoc(doc(db, "friendRequests", requestId)); 
    } catch (error) { 
        console.error("Error declining request:", error); 
    }
};

// --- 5. FETCH: DISCOVER (For find-friends.html) ---
async function loadDiscover() {
    const grid = document.getElementById("discover-container");
    if (!grid) return;

    try {
        // Loads up to 24 users initially
        const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(24));
        const snapshot = await getDocs(usersQuery);
        grid.innerHTML = ""; 

        snapshot.forEach((docSnap) => {
            const friendData = docSnap.data();
            const friendId = docSnap.id;
            
            // NEW: Only skip yourself. Show EVERYONE else!
            if (friendId === currentUserUid) return;

            const picUrl = friendData.profilePic || `https://placehold.co/150`;
            const btnHtml = `<button class="auth-btn" style="background-color: var(--nav-blue); padding: 8px; font-size: 0.85rem; width: 100%; margin: 0; border-radius: 8px;" onclick="window.location.href='user.html?uid=${friendId}'"><i class="ri-user-search-line"></i> View Profile</button>`;
            
            grid.innerHTML += buildCard(picUrl, friendData.username, friendData.bio || "No bio yet.", btnHtml, friendId);
        });
    } catch (error) { 
        console.error("Error loading discover:", error); 
    }
}

// --- 6. SUPER SMART ADVANCED SEARCH (Checks Username AND Bio) ---
function setupBigSearch() {
    const input = document.getElementById("big-user-search");
    const grid = document.getElementById("discover-container");
    let timeout = null;

    if (!input || !grid) return;

    // Helper function for fuzzy matching (Typo tolerance)
    function isFuzzyMatch(search, target) {
        if (!target) return false; // Prevent errors if bio is missing
        const s = search.toLowerCase().replace(/[^a-z0-9]/g, '');
        const t = target.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        if (t.includes(s)) return true;

        let sIdx = 0;
        for (let i = 0; i < t.length; i++) {
            if (t[i] === s[sIdx]) sIdx++;
            if (sIdx === s.length) return true;
        }
        return false;
    }

    input.addEventListener("input", async (e) => {
        const term = e.target.value.trim();
        clearTimeout(timeout);
        
        if (!term) {
            loadDiscover(); 
            return;
        }

        timeout = setTimeout(async () => {
            grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center;"><i class="ri-loader-4-line ri-spin" style="font-size: 2rem; color: var(--nav-blue);"></i><br><br>Searching...</p>`;
            
            try {
                // Fetch up to 200 users into memory cache for instant, deep searching
                if (allUsersCache.length === 0) {
                    const q = query(collection(db, "users"), limit(200)); 
                    const snapshot = await getDocs(q);
                    snapshot.forEach(docSnap => {
                        allUsersCache.push({ id: docSnap.id, ...docSnap.data() });
                    });
                }

                grid.innerHTML = "";
                let matchCount = 0;

                allUsersCache.forEach((user) => {
                    // NEW: Only skip yourself.
                    if (user.id === currentUserUid || matchCount >= 24) return;

                    // NEW: Smart Search checks BOTH the username and the bio!
                    if (isFuzzyMatch(term, user.username) || isFuzzyMatch(term, user.bio)) {
                        matchCount++;
                        const btnHtml = `<button class="auth-btn" style="background-color: var(--nav-blue); padding: 8px; font-size: 0.85rem; width: 100%; margin: 0; border-radius: 8px;" onclick="window.location.href='user.html?uid=${user.id}'"><i class="ri-user-search-line"></i> View Profile</button>`;
                        grid.innerHTML += buildCard(user.profilePic || "https://placehold.co/150", user.username, user.bio || "No bio yet.", btnHtml, user.id);
                    }
                });

                if (matchCount === 0) {
                    grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888; font-size: 1.1rem; padding: 40px 0;"><i class="ri-ghost-smile-line" style="font-size: 3rem; color: var(--border-color);"></i><br>No citizens found matching "${term}".</p>`;
                }

            } catch (error) {
                console.error("Advanced Search Error:", error);
                grid.innerHTML = `<p style="grid-column: 1/-1; color: red; text-align: center;">Bobert crashed the search engine.</p>`;
            }
        }, 400); 
    });
}

// --- 7. UTILITY: EXACT CUSTOM CARD BUILDER WITH SPRING EFFECT ---
function buildCard(picUrl, name, bio, actionHtml, uid) {
    return `
        <div class="spring-card">
            <img src="${picUrl}" alt="${name}" style="width: 80px; height: 80px; border-radius: 12px; object-fit: cover; margin-bottom: 10px; border: 2px solid var(--nav-blue-dark); cursor:pointer;" onclick="window.location.href='user.html?uid=${uid}'">
            <h3 style="color: var(--nav-blue-dark); font-size: 1.1rem; margin-bottom: 5px; cursor:pointer;" onclick="window.location.href='user.html?uid=${uid}'">${name}</h3>
            <p class="bio-text" style="font-size: 0.8rem; color: #666; margin-bottom: 15px; height: 40px; overflow: hidden;">${bio}</p>
            ${actionHtml}
        </div>
    `;
}