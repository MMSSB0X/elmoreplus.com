// user.js - Handles visiting other citizens' profiles
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc, arrayUnion, arrayRemove, serverTimestamp, addDoc, limit, getDocs, documentId } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// IMPORT YOUR GLOBAL GOOGLE DRIVE FIX
import { getDirectImageUrl } from "./gdrive.js";

const urlParams = new URLSearchParams(window.location.search);
const targetUid = urlParams.get('uid');

if (!targetUid) {
    window.location.href = "index.html";
}

let currentUser = null;
let targetUserData = null;
let cleanTargetPic = null; 

function hideLoader() {
    const loader = document.getElementById("site-loader");
    if (loader) {
        loader.classList.add("fade-out");
        setTimeout(() => loader.style.display = "none", 500);
    }
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        
        if (currentUser.uid === targetUid) {
            window.location.href = "profile.html";
            return;
        }

        try {
            const myDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (myDoc.exists()) {
                const myData = myDoc.data();
                document.querySelectorAll(".display-username").forEach(el => el.textContent = myData.username);
                const myCleanPic = getDirectImageUrl(myData.profilePic) || "https://placehold.co/150";
                document.querySelectorAll(".display-pic").forEach(el => el.src = myCleanPic);
                currentUser.displayName = myData.username;
                currentUser.photoURL = myCleanPic;
            }

            await loadTargetUser();
            await checkFriendStatus(); 
            startTargetFeed();
            loadSidebarFriends();

            hideLoader();

        } catch (error) {
            console.error("Error loading profile:", error);
            hideLoader();
        }
    } else {
        window.location.href = "login.html";
    }
});

async function loadTargetUser() {
    const targetDoc = await getDoc(doc(db, "users", targetUid));
    
    if (targetDoc.exists()) {
        targetUserData = targetDoc.data();
        cleanTargetPic = getDirectImageUrl(targetUserData.profilePic) || "https://placehold.co/150";
        
        document.getElementById("target-profile-pic").src = cleanTargetPic;
        document.getElementById("target-username").textContent = targetUserData.username;
        document.getElementById("target-bio").textContent = targetUserData.bio || "This citizen is a mystery.";
        document.getElementById("target-feed-title").textContent = `${targetUserData.username}'s Posts`;
        document.title = `${targetUserData.username} | Elmore Plus`;
    } else {
        document.getElementById("target-username").textContent = "User Not Found";
        document.getElementById("target-bio").textContent = "This account may have been deleted by Bobert.";
    }
}

async function checkFriendStatus() {
    const addBtn = document.getElementById("add-friend-btn");
    if (!addBtn) return;

    const myDoc = await getDoc(doc(db, "users", currentUser.uid));
    const myFriends = myDoc.data().friends || [];
    
    if (myFriends.includes(targetUid)) {
        addBtn.innerHTML = `<i class="ri-user-follow-fill"></i> Friends`;
        addBtn.style.background = "var(--nav-blue-dark)";
        addBtn.disabled = true;
        return;
    }

    const qSent = query(
        collection(db, "friendRequests"), 
        where("senderUid", "==", currentUser.uid), 
        where("receiverUid", "==", targetUid)
    );
    const sentSnap = await getDocs(qSent);
    
    if (!sentSnap.empty) {
        addBtn.innerHTML = `<i class="ri-time-line"></i> Request Sent`;
        addBtn.style.background = "#888";
        addBtn.disabled = true;
        return;
    }

    addBtn.onclick = async () => {
        addBtn.disabled = true;
        addBtn.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Sending...`;
        
        try {
            await addDoc(collection(db, "friendRequests"), {
                senderUid: currentUser.uid,
                receiverUid: targetUid,
                senderName: currentUser.displayName,
                senderPic: currentUser.photoURL,
                status: "pending",
                createdAt: serverTimestamp()
            });
            
            await addDoc(collection(db, "notifications"), {
                recipientUid: targetUid,
                senderUid: currentUser.uid,
                senderName: currentUser.displayName,
                senderPic: currentUser.photoURL,
                type: "friend_request",
                text: "sent you a friend request.",
                read: false,
                createdAt: serverTimestamp()
            });

            addBtn.innerHTML = `<i class="ri-time-line"></i> Request Sent`;
            addBtn.style.background = "#888";
        } catch (error) {
            console.error("Failed to send request", error);
            addBtn.disabled = false;
            addBtn.innerHTML = `<i class="ri-user-add-line"></i> Try Again`;
        }
    };
}

function startTargetFeed() {
    const feedContainer = document.getElementById("user-feed-container");
    if (!feedContainer) return;

    const q = query(collection(db, "posts"), where("authorUid", "==", targetUid));
    
    onSnapshot(q, (snapshot) => {
        feedContainer.innerHTML = "";
        
        if (snapshot.empty) {
            feedContainer.innerHTML = `<div style="text-align:center; padding: 20px; color:#888;">No posts yet.</div>`;
            return;
        }

        const postsArray = [];
        snapshot.forEach(docSnap => postsArray.push({ id: docSnap.id, ...docSnap.data() }));
        
        postsArray.sort((a, b) => {
            const timeA = a.createdAt ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt ? b.createdAt.toMillis() : 0;
            return timeB - timeA;
        });

        postsArray.forEach((post) => {
            const id = post.id;
            const likedBy = post.likedBy || [];
            const hasLiked = currentUser && likedBy.includes(currentUser.uid);
            
            let timeString = "Just now";
            if (post.createdAt) {
                const dateObj = post.createdAt.toDate();
                timeString = dateObj.toLocaleString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric',
                    hour: 'numeric', minute: '2-digit', hour12: true
                });
            }

            const liveName = targetUserData.username;
            const liveBio = targetUserData.bio || "No bio yet.";

            const postDiv = document.createElement("div");
            postDiv.className = "post";
            postDiv.innerHTML = `
                <div class="avatar-wrapper" style="cursor: default;">
                    <img src="${cleanTargetPic}" class="post-avatar" onerror="this.src='https://placehold.co/150'">
                </div>
                <div class="post-bubble">
                    <div class="post-header">
                        <div style="display: flex; flex-direction: column;">
                            <strong style="color: var(--nav-blue-dark);">${liveName}</strong>
                            <span style="font-size: 0.7rem; color: #888; margin-top: 3px;">${timeString}</span>
                        </div>
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

// FIX: Safe Sidebar Loading
// --- SIDEBAR: TARGET USER'S FRIENDS ---
async function loadSidebarFriends() {
    const friendsGrid = document.querySelector(".friends-grid");
    if (!friendsGrid) return;
    
    // 1. Use the TARGET USER'S friends array, not the current user's!
    const targetFriendsIds = targetUserData.friends || [];
    friendsGrid.innerHTML = ""; // Clear the placeholders
    
    // 2. If THEY have no friends, show a little message
    if (targetFriendsIds.length === 0) {
        friendsGrid.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: #888; font-size: 0.85rem; padding: 10px 0;'>No friends yet.</p>";
        return;
    }
    
    // 3. Grab up to 6 of THEIR friends
    const chunk = targetFriendsIds.slice(0, 6);
    const q = query(collection(db, "users"), where(documentId(), "in", chunk));
    const snapshot = await getDocs(q);
    
    snapshot.forEach((userDoc) => {
        const friend = userDoc.data();
        
        // Ensure the profile owner doesn't show up in their own sidebar
        if (userDoc.id === targetUid) return; 

        // Apply Google Drive Fix
        const cleanFriendPic = getDirectImageUrl(friend.profilePic) || "https://placehold.co/150";

        const img = document.createElement("img");
        img.src = cleanFriendPic;
        img.title = friend.username || "Citizen"; 
        img.style.cursor = "pointer";
        
        // If you click one of THEIR friends, it takes you to that friend's page!
        img.onclick = () => window.location.href = `user.html?uid=${userDoc.id}`;
        
        friendsGrid.appendChild(img);
    });
}

document.querySelectorAll(".logout-btn").forEach(btn => btn.onclick = () => signOut(auth));