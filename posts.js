// posts.js - Universal Post Engine for Elmore Plus
import { db } from "./firebase.js";
import { doc, getDoc, collection, onSnapshot, updateDoc, arrayUnion, arrayRemove, deleteDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { getDirectImageUrl } from "./gdrive.js";

export function initFeed(queryRef, containerId, currentUser, userCache) {
    const feedContainer = document.getElementById(containerId);
    if (!feedContainer) return;

    onSnapshot(queryRef, async (snapshot) => {
        // 1. Find missing users to cache
        const missingUids = new Set();
        snapshot.forEach((postDoc) => {
            const uid = postDoc.data().authorUid;
            if (uid && !userCache[uid]) missingUids.add(uid);
        });

        // 2. Fetch missing users
        for (const uid of missingUids) {
            try {
                const uDoc = await getDoc(doc(db, "users", uid));
                if (uDoc.exists()) {
                    userCache[uid] = uDoc.data();
                } else {
                    userCache[uid] = { username: "Unknown Citizen", profilePic: "https://placehold.co/150" };
                }
            } catch (err) { console.error("Failed fetching user info:", err); }
        }

        // 3. Render Feed
        feedContainer.innerHTML = "";
        
        if (snapshot.empty) {
            feedContainer.innerHTML = `<div style="text-align:center; padding: 20px; color:#888;">No posts found.</div>`;
            return;
        }

        snapshot.forEach((postDoc) => {
            const post = postDoc.data();
            const id = postDoc.id;
            const likedBy = post.likedBy || [];
            const commentCount = post.commentCount || 0; // New comment count tracking
            const hasLiked = currentUser && likedBy.includes(currentUser.uid);
            
            const isMe = currentUser && currentUser.uid === post.authorUid;
            const profileLink = isMe ? "profile.html" : `user.html?uid=${post.authorUid}`;

            const liveAuthor = userCache[post.authorUid];
            const rawPic = liveAuthor ? liveAuthor.profilePic : post.authorPic;
            const displayPic = getDirectImageUrl(rawPic) || "https://placehold.co/150";
            const displayName = liveAuthor ? liveAuthor.username : (post.author || "Citizen");

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
                            <strong style="color: var(--nav-blue-dark);">${displayName}</strong>
                            <span style="font-size: 0.7rem; color: #888; margin-top: 3px;">${timeString}</span>
                        </div>
                        ${isMe ? `<button class="delete-btn" data-id="${id}"><i class="ri-delete-bin-line"></i></button>` : ''}
                    </div>
                    
                    <!-- Clicking the text opens the post details -->
                    <p style="cursor: pointer;" onclick="window.location.href='post.html?id=${id}'">${post.text}</p>
                </div>
                
                <div class="post-actions-col">
                    <div class="like-section ${hasLiked ? 'liked' : ''}" style="margin-bottom: 5px;">
                        <button class="like-btn" data-id="${id}" data-liked="${hasLiked}">
                            <i class="fa-solid fa-thumbs-up"></i>
                            <span style="margin-left:5px">${likedBy.length}</span>
                        </button>
                    </div>
                    <div class="comment-section" onclick="window.location.href='post.html?id=${id}'">
                        <button class="comment-btn">
                            <i class="ri-chat-3-fill"></i>
                            <span style="margin-left:5px">${commentCount}</span>
                        </button>
                    </div>
                </div>
            `;
            feedContainer.appendChild(postDiv);
        });

        attachPostListeners(currentUser);
    });
}

function attachPostListeners(currentUser) {
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.onclick = async () => {
            if (!currentUser) return;
            const id = btn.getAttribute('data-id');
            const isLiked = btn.getAttribute('data-liked') === 'true';
            const postRef = doc(db, "posts", id);
            if (isLiked) await updateDoc(postRef, { likedBy: arrayRemove(currentUser.uid) });
            else await updateDoc(postRef, { likedBy: arrayUnion(currentUser.uid) });
        };
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = async () => {
            const id = btn.getAttribute('data-id');
            if (confirm("Delete Post? This can't be undone!")) {
                await deleteDoc(doc(db, "posts", id));
            }
        };
    });
}