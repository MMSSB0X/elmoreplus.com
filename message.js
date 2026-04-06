// message.js - Elmore Plus Advanced Chat System
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { doc, getDoc, getDocs, collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, serverTimestamp, documentId } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { getDirectImageUrl } from "./gdrive.js";

// =================================================================
// ⚙️ CHAT SELF-DESTRUCT SETTINGS (SUPER EASY TO CHANGE)
// =================================================================
const CHAT_SETTINGS = {
    expiration: {
        enabled: true,  
        days: 10,       
        hours: 0,       
        minutes: 0      
    }
};
// =================================================================

let currentUser = null;
let currentChatId = null;
let activeChatUnsubscribe = null;

const getExpirationMs = () => {
    const { days, hours, minutes } = CHAT_SETTINGS.expiration;
    return (days * 24 * 60 * 60 * 1000) + (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);
};

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        updateTimerBadgeUI();
        await loadContacts();
    } else {
        window.location.href = "login.html";
    }
});

function updateTimerBadgeUI() {
    const badge = document.getElementById("destruct-badge");
    if (!CHAT_SETTINGS.expiration.enabled) {
        badge.innerHTML = `<i class="ri-shield-check-fill"></i> Permanent Chat`;
        badge.style.background = "#dcfce7";
        badge.style.color = "#166534";
        badge.style.borderColor = "#86efac";
    } else {
        const d = CHAT_SETTINGS.expiration.days;
        badge.innerHTML = `<i class="ri-timer-flash-line"></i> Auto-Deletes in ${d} Days`;
    }
}

async function loadContacts() {
    const contactList = document.getElementById("contact-list");
    
    try {
        const myDoc = await getDoc(doc(db, "users", currentUser.uid));
        const myFriendsIds = myDoc.data().friends || [];

        if (myFriendsIds.length === 0) {
            contactList.innerHTML = `
                <div style="text-align:center; padding: 30px 20px; color:#888;">
                    <i class="ri-user-unfollow-line" style="font-size: 3rem; color: var(--border-color);"></i>
                    <p style="margin-top: 10px;">You need to add friends before you can chat!</p>
                </div>`;
            return;
        }

        const q = query(collection(db, "users"), where(documentId(), "in", myFriendsIds));
        const snapshot = await getDocs(q);

        contactList.innerHTML = "";

        snapshot.forEach((userDoc) => {
            const friend = userDoc.data();
            
            let cleanPic = "https://placehold.co/150";
            if (typeof getDirectImageUrl === "function") cleanPic = getDirectImageUrl(friend.profilePic) || cleanPic;
            else cleanPic = friend.profilePic || cleanPic;

            const item = document.createElement("div");
            item.className = "contact-item";
            item.innerHTML = `
                <img src="${cleanPic}" class="contact-avatar">
                <div class="contact-info">
                    <span class="contact-name">${friend.username}</span>
                    <span class="contact-status"><i class="ri-checkbox-blank-circle-fill"></i> Online</span>
                </div>
            `;

            // On Click: Slide chat into view
            item.onclick = () => {
                document.querySelectorAll(".contact-item").forEach(el => el.classList.remove("active"));
                item.classList.add("active");
                
                document.getElementById("no-chat-screen").style.display = "none";
                document.getElementById("active-chat-screen").style.display = "flex";
                
                // Triggers the CSS mobile sliding animation inside the wrapper perfectly
                document.getElementById("messenger-wrapper").classList.add("active-chat");

                document.getElementById("chat-header-pic").src = cleanPic;
                document.getElementById("chat-header-name").textContent = friend.username;

                openChat(friend.uid);
            };

            contactList.appendChild(item);
        });

    } catch (error) {
        console.error("Error loading contacts:", error);
    }
}

function getChatRoomId(uid1, uid2) {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

function openChat(friendUid) {
    const messagesContainer = document.getElementById("chat-messages");
    currentChatId = getChatRoomId(currentUser.uid, friendUid);
    
    if (activeChatUnsubscribe) activeChatUnsubscribe();

    messagesContainer.innerHTML = `
        <div style="display:flex; justify-content:center; align-items:center; height:100%;">
            <div class="spinner" style="border-top-color: var(--nav-blue); width:40px; height:40px;"></div>
        </div>`;

    const messagesRef = collection(db, `chats/${currentChatId}/messages`);
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    activeChatUnsubscribe = onSnapshot(q, (snapshot) => {
        messagesContainer.innerHTML = "";
        
        if (snapshot.empty) {
            messagesContainer.innerHTML = `
                <div style="text-align:center; color:#888; font-size: 0.9rem; margin-top: auto; margin-bottom: auto;">
                    <i class="ri-hand-coin-fill" style="font-size:3rem; color:var(--border-color);"></i>
                    <p>Start the conversation!</p>
                </div>`;
            return;
        }

        snapshot.forEach((docSnap) => {
            const msg = docSnap.data();
            const msgId = docSnap.id;

            if (isMessageExpired(msg.createdAt)) {
                deleteDoc(doc(db, `chats/${currentChatId}/messages`, msgId));
                return; 
            }

            const isMe = msg.senderId === currentUser.uid;
            let timeStr = "Just now";
            if (msg.createdAt) {
                timeStr = msg.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            }

            const msgRow = document.createElement("div");
            msgRow.className = `msg-row ${isMe ? 'sent' : 'received'}`;
            msgRow.innerHTML = `
                <div class="msg-bubble">
                    ${msg.text}
                    <span class="msg-time">${timeStr}</span>
                </div>
            `;
            messagesContainer.appendChild(msgRow);
        });

        messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });
    });
}

function isMessageExpired(timestamp) {
    if (!CHAT_SETTINGS.expiration.enabled) return false;
    if (!timestamp) return false; 

    const messageDate = timestamp.toDate().getTime();
    const expirationLimit = messageDate + getExpirationMs();
    
    return Date.now() > expirationLimit;
}

async function sendMessage() {
    const input = document.getElementById("message-input");
    const text = input.value.trim();
    
    if (!text || !currentChatId) return;

    input.value = ""; 
    input.focus(); 

    try {
        await addDoc(collection(db, `chats/${currentChatId}/messages`), {
            senderId: currentUser.uid,
            text: text,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error sending message:", error);
    }
}

document.getElementById("send-btn").addEventListener("click", sendMessage);
document.getElementById("message-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});

// Mobile Back Button: Safely slides the chat away to reveal contacts without touching the bottom nav
document.getElementById("chat-back-btn").addEventListener("click", () => {
    document.getElementById("messenger-wrapper").classList.remove("active-chat");
    document.querySelectorAll(".contact-item").forEach(el => el.classList.remove("active"));
    currentChatId = null; // Clear chat context
});

// Floating Add Button Event (Optional - Can trigger a search or contact modal later)
const newMsgBtn = document.getElementById("new-msg-btn");
if (newMsgBtn) {
    newMsgBtn.addEventListener("click", () => {
        alert("Feature coming soon: Search for a new citizen to chat with!");
    });
}