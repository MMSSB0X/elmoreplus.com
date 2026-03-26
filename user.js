// user.js - Handles visiting other citizens' profiles
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc, arrayUnion, arrayRemove, serverTimestamp, addDoc, limit, getDocs } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { getDirectImageUrl } from "./gdrive.js";
const urlParams = new URLSearchParams(window.location.search);
const targetUid = urlParams.get('uid');

if (!targetUid) {
    window.location.href = "index.html";
}

let currentUser = null;
let targetUserData = null;

// FORCE LOADER TO HIDE
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
                document.querySelectorAll(".display-pic").forEach(el => el.src = myData.profilePic);
                currentUser.displayName = myData.username;
                currentUser.photoURL = myData.profilePic;
            }

            await loadTargetUser();
            
            // NEW: Check if you are friends and setup the Add Friend button!
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
        document.getElementById("target-username").textContent = targetUserData.username;
        document.getElementById("target-profile-pic").src = targetUserData.profilePic || "https://placehold.co/150";
        document.getElementById("target-bio").textContent = targetUserData.bio || "This citizen is a mystery.";
        document.getElementById("target-feed-title").textContent = `${targetUserData.username}'s Posts`;
        document.title = `${targetUserData.username} | Elmore Plus`;
    } else {
        document.getElementById("target-username").textContent = "User Not Found";
        document.getElementById("target-bio").textContent = "This account may have been deleted by Bobert.";
    }
}

// --- NEW: FRIEND REQUEST LOGIC ---
async function checkFriendStatus() {
    const addBtn = document.getElementById("add-friend-btn");
    if (!addBtn) return;

    // 1. Are they already your friend?
    const myDoc = await getDoc(doc(db, "users", currentUser.uid));
    const myFriends = myDoc.data().friends || [];
    
    if (myFriends.includes(targetUid)) {
        addBtn.innerHTML = `<i class="ri-user-follow-fill"></i> Friends`;
        addBtn.style.background = "var(--nav-blue-dark)";
        addBtn.disabled = true;
        return;
    }

    // 2. Did you already send a request?
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

    // 3. Setup Click to Send Request
    addBtn.onclick = async () => {
        addBtn.disabled = true;
        addBtn.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Sending...`;
        
        try {
            // Send Request to Database
            await addDoc(collection(db, "friendRequests"), {
                senderUid: currentUser.uid,
                receiverUid: targetUid,
                senderName: currentUser.displayName,
                senderPic: currentUser.photoURL,
                status: "pending",
                createdAt: serverTimestamp()
            });
            
            // Send Notification to their Bell Icon
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

            // Update UI
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

            const postDiv = document.createElement("div");
            postDiv.className = "post";
            postDiv.innerHTML = `
                <img src="${post.authorPic}" class="post-avatar" onerror="this.src='https://placehold.co/150'">
                <div class="post-bubble">
                    <div class="post-header">
                        <div style="display: flex; flex-direction: column;">
                            <strong>${post.author}</strong>
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