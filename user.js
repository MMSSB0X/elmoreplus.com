// user.js - Handles visiting other citizens' profiles
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, updateDoc, arrayUnion, arrayRemove, serverTimestamp, addDoc, limit, getDocs } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// 1. Get the Target User ID from the URL (e.g., ?uid=abc123xyz)
const urlParams = new URLSearchParams(window.location.search);
const targetUid = urlParams.get('uid');

// If someone tries to load user.html without a specific UID, send them home
if (!targetUid) {
    window.location.href = "index.html";
}

let currentUser = null;
let targetUserData = null;

// --- 2. AUTHENTICATION & SMART ROUTING ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        
        // SMART ROUTING: If you clicked your own profile, redirect to the edit page!
        if (currentUser.uid === targetUid) {
            window.location.href = "profile.html";
            return;
        }

        try {
            // Load YOUR data (for the left sidebar)
            const myDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (myDoc.exists()) {
                const myData = myDoc.data();
                document.querySelectorAll(".display-username").forEach(el => el.textContent = myData.username);
                document.querySelectorAll(".display-pic").forEach(el => el.src = myData.profilePic);
                currentUser.displayName = myData.username;
                currentUser.photoURL = myData.profilePic;
            }

            // Load TARGET USER'S data (for the center profile banner)
            await loadTargetUser();
            
            // Load TARGET USER'S posts
            startTargetFeed();
            
            // Load Sidebar Friends
            loadSidebarFriends();

        } catch (error) {
            console.error("Error loading profile:", error);
        }
    } else {
        window.location.href = "login.html";
    }
});

// --- 3. LOAD TARGET USER PROFILE ---
async function loadTargetUser() {
    const targetDoc = await getDoc(doc(db, "users", targetUid));
    
    if (targetDoc.exists()) {
        targetUserData = targetDoc.data();
        
        document.getElementById("target-username").textContent = targetUserData.username;
        document.getElementById("target-profile-pic").src = targetUserData.profilePic || "https://placehold.co/150";
        document.getElementById("target-bio").textContent = targetUserData.bio || "This citizen is a mystery.";
        
        document.getElementById("target-feed-title").textContent = `${targetUserData.username}'s Posts`;
        
        // Change page title so the browser tab looks cool
        document.title = `${targetUserData.username} | Elmore Plus`;
    } else {
        document.getElementById("target-username").textContent = "User Not Found";
        document.getElementById("target-bio").textContent = "This account may have been deleted by Bobert.";
    }
}

// --- 4. LOAD TARGET USER'S POSTS ---
function startTargetFeed() {
    const feedContainer = document.getElementById("user-feed-container");
    if (!feedContainer) return;

    // Notice the 'where' clause: We ONLY want posts where authorUid matches the target!
    const q = query(
        collection(db, "posts"), 
        where("authorUid", "==", targetUid), 
        orderBy("createdAt", "desc")
    );
    
    onSnapshot(q, (snapshot) => {
        feedContainer.innerHTML = "";
        
        if (snapshot.empty) {
            feedContainer.innerHTML = `<div style="text-align:center; padding: 20px; color:#888;">No posts yet.</div>`;
            return;
        }

        snapshot.forEach((postDoc) => {
            const post = postDoc.data();
            const id = postDoc.id;
            const likedBy = post.likedBy || [];
            const hasLiked = currentUser && likedBy.includes(currentUser.uid);
            
            // No delete button here, because you are on someone else's profile!
            const postDiv = document.createElement("div");
            postDiv.className = "post";
            postDiv.innerHTML = `
                <img src="${post.authorPic}" class="post-avatar" onerror="this.src='https://placehold.co/150'">
                <div class="post-bubble">
                    <div class="post-header">
                        <strong>${post.author}</strong>
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
        
        attachLikeListeners();
    });
}

// --- 5. LIKE LOGIC (WITH NOTIFICATIONS) ---
function attachLikeListeners() {
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.onclick = async () => {
            if (!currentUser) return;
            const id = btn.getAttribute('data-id');
            const isLiked = btn.getAttribute('data-liked') === 'true';
            const postRef = doc(db, "posts", id);
            
            try {
                if (isLiked) {
                    await updateDoc(postRef, { likedBy: arrayRemove(currentUser.uid) });
                } else {
                    await updateDoc(postRef, { likedBy: arrayUnion(currentUser.uid) });
                    
                    // Trigger a notification to the profile owner!
                    await addDoc(collection(db, "notifications"), {
                        recipientUid: targetUid,
                        senderUid: currentUser.uid,
                        senderName: currentUser.displayName,
                        senderPic: currentUser.photoURL,
                        type: "like",
                        text: "liked your post.",
                        postId: id,
                        read: false,
                        createdAt: serverTimestamp()
                    });
                }
            } catch (err) { console.error("Like toggle failed:", err); }
        };
    });
}

// --- 6. UTILITIES ---
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
        img.onclick = () => window.location.href = `user.html?uid=${userDoc.id}`;
        friendsGrid.appendChild(img);
    });
}

document.querySelectorAll(".logout-btn").forEach(btn => btn.onclick = () => signOut(auth));