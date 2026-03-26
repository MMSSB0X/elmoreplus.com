// // noti.js - Unified Header Notifications
// import { auth, db } from "./firebase.js";
// import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
// import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// // Now we only target the unified header elements
// const notiBadge = document.getElementById("header-noti-badge");
// const notiBtn = document.getElementById("header-noti-btn");
// const notiDropdown = document.getElementById("header-noti-dropdown");
// const notiList = document.getElementById("header-noti-list");

// let currentUserUid = null;

// onAuthStateChanged(auth, (user) => {
//     if (user) {
//         currentUserUid = user.uid;
//         startNotificationListener();
//     }
// });

// function startNotificationListener() {
//     const q = query(
//         collection(db, "notifications"),
//         where("recipientUid", "==", currentUserUid),
//         orderBy("createdAt", "desc")
//     );

//     onSnapshot(q, (snapshot) => {
//         let unreadCount = 0;
//         if (!notiList) return;
        
//         notiList.innerHTML = "";

//         if (snapshot.empty) {
//             notiList.innerHTML = `<p style="padding: 15px; color: #888; text-align: center; font-size: 0.8rem;">No new notifications</p>`;
//         }

//         snapshot.forEach((notiDoc) => {
//             const noti = notiDoc.data();
//             const id = notiDoc.id;
            
//             if (!noti.read) unreadCount++;

//             const notiItem = document.createElement("a");
//             notiItem.href = `user.html?uid=${noti.senderUid}`; // Link to their profile
//             notiItem.className = `noti-item ${noti.read ? '' : 'unread'}`;
            
//             const timeDate = noti.createdAt ? noti.createdAt.toDate() : new Date();
//             const timeString = timeDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

//             notiItem.innerHTML = `
//                 <img src="${noti.senderPic}" class="noti-img">
//                 <div>
//                     <div class="noti-text"><strong>${noti.senderName}</strong> ${noti.text}</div>
//                     <div class="noti-time">${timeString}</div>
//                 </div>
//             `;

//             // Mark as read when clicked
//             notiItem.onclick = async (e) => {
//                 if (!noti.read) {
//                     await updateDoc(doc(db, "notifications", id), { read: true });
//                 }
//             };

//             notiList.appendChild(notiItem);
//         });

//         // Update the single badge
//         if (notiBadge) {
//             if (unreadCount > 0) {
//                 notiBadge.textContent = unreadCount > 99 ? "99+" : unreadCount;
//                 notiBadge.classList.remove("hidden");
//             } else {
//                 notiBadge.classList.add("hidden");
//             }
//         }
//     });
// }

// // Toggle the dropdown when the bell is clicked
// if (notiBtn && notiDropdown) {
//     notiBtn.addEventListener("click", (e) => {
//         e.preventDefault();
//         notiDropdown.classList.toggle("hidden");
//     });
// }

// // Close the dropdown if the user clicks anywhere else on the screen
// document.addEventListener("click", (e) => {
//     if (notiDropdown && notiBtn && !notiBtn.contains(e.target) && !notiDropdown.contains(e.target)) {
//         notiDropdown.classList.add("hidden");
//     }
// });

























// noti.js - Unified Header Notifications
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const notiBadge = document.getElementById("header-noti-badge");
const notiBtn = document.getElementById("header-noti-btn");
const notiDropdown = document.getElementById("header-noti-dropdown");
const notiList = document.getElementById("header-noti-list");

let currentUserUid = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserUid = user.uid;
        startNotificationListener();
    }
});

function startNotificationListener() {
    const q = query(
        collection(db, "notifications"),
        where("recipientUid", "==", currentUserUid),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {
        let unreadCount = 0;
        if (!notiList) return;
        
        notiList.innerHTML = "";

        if (snapshot.empty) {
            notiList.innerHTML = `<p style="padding: 15px; color: #888; text-align: center; font-size: 0.8rem;">No new notifications</p>`;
        }

        snapshot.forEach((notiDoc) => {
            const noti = notiDoc.data();
            const id = notiDoc.id;
            
            if (!noti.read) unreadCount++;

            const notiItem = document.createElement("a");
            notiItem.href = `user.html?uid=${noti.senderUid}`; // Default link to profile
            notiItem.className = `noti-item ${noti.read ? '' : 'unread'}`;
            
            const timeDate = noti.createdAt ? noti.createdAt.toDate() : new Date();
            const timeString = timeDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

            // Added "Mark as read" text for unread notifications
            notiItem.innerHTML = `
                <img src="${noti.senderPic}" class="noti-img" onerror="this.src='https://placehold.co/150'">
                <div style="flex: 1;">
                    <div class="noti-text"><strong>${noti.senderName}</strong> ${noti.text}</div>
                    <div class="noti-time">${timeString}</div>
                </div>
                ${!noti.read ? `<span class="mark-read-btn" style="font-size: 0.75rem; color: var(--nav-blue); font-weight: bold; cursor: pointer; padding: 5px;">Mark as read</span>` : ''}
            `;

            // Logic for clicking
            notiItem.onclick = async (e) => {
                // If they specifically click the "Mark as read" text...
                if (e.target.classList.contains('mark-read-btn')) {
                    e.preventDefault();   // Stops it from going to the profile page
                    e.stopPropagation();  // Keeps the dropdown open
                }

                // If it hasn't been read yet, update Firebase (This triggers the badge to hide!)
                if (!noti.read) {
                    await updateDoc(doc(db, "notifications", id), { read: true });
                }
            };

            notiList.appendChild(notiItem);
        });

        // Update the red badge indicator
        if (notiBadge) {
            if (unreadCount > 0) {
                notiBadge.textContent = unreadCount > 99 ? "99+" : unreadCount;
                notiBadge.classList.remove("hidden");
            } else {
                notiBadge.classList.add("hidden"); // Hides the red indicator when 0!
            }
        }
    });
}

if (notiBtn && notiDropdown) {
    notiBtn.addEventListener("click", (e) => {
        e.preventDefault();
        notiDropdown.classList.toggle("hidden");
    });
}

document.addEventListener("click", (e) => {
    if (notiDropdown && notiBtn && !notiBtn.contains(e.target) && !notiDropdown.contains(e.target)) {
        notiDropdown.classList.add("hidden");
    }
});