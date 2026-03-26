// search.js - Global Smart Search System
import { db } from "./firebase.js";
import { collection, query, where, getDocs, limit } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const searchDesktop = document.getElementById("search-desktop");
const resultsDesktop = document.getElementById("search-results-desktop");

const searchMobile = document.getElementById("search-mobile");
const resultsMobile = document.getElementById("search-results-mobile");

let searchTimeout = null;

/**
 * Advanced Firestore Search Function
 */
async function performSearch(searchTerm, resultsContainer) {
    if (!searchTerm) {
        resultsContainer.classList.add("hidden");
        return;
    }

    resultsContainer.classList.remove("hidden");
    resultsContainer.innerHTML = `<div class="search-loading"><i class="ri-loader-4-line ri-spin"></i> Searching...</div>`;

    try {
        const usersRef = collection(db, "users");
        // The \uf8ff trick finds any username starting with the typed letters
        const q = query(
            usersRef,
            where("username", ">=", searchTerm),
            where("username", "<=", searchTerm + "\uf8ff"),
            limit(5) 
        );

        const snapshot = await getDocs(q);
        resultsContainer.innerHTML = ""; 

        if (snapshot.empty) {
            resultsContainer.innerHTML = `<div class="search-empty">No citizens found.</div>`;
            return;
        }

        snapshot.forEach((docSnap) => {
            const user = docSnap.data();
            const userId = docSnap.id;
            
            const resultItem = document.createElement("a");
            resultItem.href = `profile.html?uid=${userId}`; 
            resultItem.className = "search-result-item";
            
            resultItem.innerHTML = `
                <img src="${user.profilePic || 'https://placehold.co/40'}" class="search-result-img" alt="avatar">
                <span class="search-result-name">${user.username}</span>
            `;
            
            resultsContainer.appendChild(resultItem);
        });

    } catch (error) {
        console.error("Search failed:", error);
        resultsContainer.innerHTML = `<div class="search-empty" style="color: #d9534f;">Search error!</div>`;
    }
}

/**
 * The Debouncer
 */
function handleInput(e, resultsContainer) {
    const term = e.target.value.trim();
    clearTimeout(searchTimeout);
    
    searchTimeout = setTimeout(() => {
        performSearch(term, resultsContainer);
    }, 300);
}

// Safely attach listeners to inputs if they exist on the current HTML page
if (searchDesktop && resultsDesktop) {
    searchDesktop.addEventListener("input", (e) => handleInput(e, resultsDesktop));
}

if (searchMobile && resultsMobile) {
    searchMobile.addEventListener("input", (e) => handleInput(e, resultsMobile));
}

// Global click listener to close dropdowns when clicking outside
document.addEventListener("click", (e) => {
    if (searchDesktop && resultsDesktop && !searchDesktop.contains(e.target) && !resultsDesktop.contains(e.target)) {
        resultsDesktop.classList.add("hidden");
    }
    if (searchMobile && resultsMobile && !searchMobile.contains(e.target) && !resultsMobile.contains(e.target)) {
        resultsMobile.classList.add("hidden");
    }
});