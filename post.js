// post.js - Single Post & Comment Viewer
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { doc, getDoc, collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, updateDoc, increment } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { getDirectImageUrl } from "./gdrive.js";
import { initFeed } from "./posts.js"; 

const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');

if (!postId) window.location.href = "index.html";

let currentUser = null;
let userData = null;
const userCache = {}; // Local cache for comments

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            userData = userDoc.data();
            const myCleanPic = getDirectImageUrl(userData.profilePic) || "https://placehold.co/150";
            document.getElementById("my-comment-pic").src = myCleanPic;
            currentUser.displayName = userData.username;
            currentUser.photoURL = myCleanPic;
        }

        // Render the main post using the universal posts.js logic!
        // We query just this specific document path
        const qPost = doc(db, "posts", postId);
        
        // Custom snapshot just for the single post view to reuse posts.js HTML logic
        onSnapshot(qPost, async (postSnap) => {
            if (!postSnap.exists()) {
                document.getElementById("single-post-container").innerHTML = "<p>Post deleted.</p>";
                return;
            }
            // Temporarily mock a query snapshot to feed into our universal engine
            const mockSnapshot = {
                empty: false,
                forEach: (cb) => cb(postSnap)
            };
            
            // Render it manually using the exact same HTML logic
            const liveAuthor = await getUserData(postSnap.data().authorUid);
            renderSinglePost(postSnap.data(), postSnap.id, liveAuthor);
        });

        loadComments();
    } else {
        window.location.href = "login.html";
    }
});

// Helper to fetch user data for comments
async function getUserData(uid) {
    if (userCache[uid]) return userCache[uid];
    const uDoc = await getDoc(doc(db, "users", uid));
    if (uDoc.exists()) {
        userCache[uid] = uDoc.data();
        return userCache[uid];
    }
    return { username: "Citizen", profilePic: "https://placehold.co/150" };
}

// Render the single post at the top
function renderSinglePost(post, id, liveAuthor) {
    const container = document.getElementById("single-post-container");
    const likedBy = post.likedBy || [];
    const hasLiked = likedBy.includes(currentUser.uid);
    const displayPic = getDirectImageUrl(liveAuthor.profilePic) || "https://placehold.co/150";
    
    container.innerHTML = `
        <div class="post" style="margin-bottom: 0;">
            <img src="${displayPic}" class="post-avatar">
            <div class="post-bubble">
                <div class="post-header">
                    <strong style="color: var(--nav-blue-dark);">${liveAuthor.username}</strong>
                </div>
                <p>${post.text}</p>
                <div style="margin-top: 10px; font-size: 0.8rem; color: var(--nav-blue);">
                    <i class="fa-solid fa-thumbs-up"></i> ${likedBy.length} Likes
                </div>
            </div>
        </div>
    `;
}

// Load Comments Subcollection
function loadComments() {
    const q = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc"));
    
    onSnapshot(q, async (snapshot) => {
        const list = document.getElementById("comments-list");
        list.innerHTML = "";
        
        if (snapshot.empty) {
            list.innerHTML = "<p style='color: #888; font-size: 0.9rem;'>No comments yet. Be the first!</p>";
            return;
        }

        for (const docSnap of snapshot.docs) {
            const comment = docSnap.data();
            const liveAuthor = await getUserData(comment.authorUid);
            const pic = getDirectImageUrl(liveAuthor.profilePic) || "https://placehold.co/40";
            
            list.innerHTML += `
                <div class="comment-row">
                    <img src="${pic}" class="comment-avatar" onclick="window.location.href='user.html?uid=${comment.authorUid}'" style="cursor: pointer;">
                    <div class="comment-bubble">
                        <strong onclick="window.location.href='user.html?uid=${comment.authorUid}'" style="cursor: pointer;">${liveAuthor.username}</strong>
                        <p>${comment.text}</p>
                    </div>
                </div>
            `;
        }
    });
}

// Submit a Comment
document.getElementById("send-comment").addEventListener("click", async () => {
    const input = document.getElementById("comment-input");
    const text = input.value.trim();
    if (!text) return;
    
    input.value = ""; // Clear input immediately
    
    // Add to subcollection
    await addDoc(collection(db, "posts", postId, "comments"), {
        text: text,
        authorUid: currentUser.uid,
        createdAt: serverTimestamp()
    });

    // Update parent post count
    await updateDoc(doc(db, "posts", postId), {
        commentCount: increment(1)
    });
});