// // search.js - Global Smart Search System
// import { db } from "./firebase.js";
// import { collection, query, where, getDocs, limit } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// const searchDesktop = document.getElementById("search-desktop");
// const resultsDesktop = document.getElementById("search-results-desktop");

// const searchMobile = document.getElementById("search-mobile");
// const resultsMobile = document.getElementById("search-results-mobile");

// let searchTimeout = null;

// /**
//  * Advanced Firestore Search Function
//  */
// async function performSearch(searchTerm, resultsContainer) {
//     if (!searchTerm) {
//         resultsContainer.classList.add("hidden");
//         return;
//     }

//     resultsContainer.classList.remove("hidden");
//     resultsContainer.innerHTML = `<div class="search-loading"><i class="ri-loader-4-line ri-spin"></i> Searching...</div>`;

//     try {
//         const usersRef = collection(db, "users");
//         // The \uf8ff trick finds any username starting with the typed letters
//         const q = query(
//             usersRef,
//             where("username", ">=", searchTerm),
//             where("username", "<=", searchTerm + "\uf8ff"),
//             limit(5) 
//         );

//         const snapshot = await getDocs(q);
//         resultsContainer.innerHTML = ""; 

//         if (snapshot.empty) {
//             resultsContainer.innerHTML = `<div class="search-empty">No citizens found.</div>`;
//             return;
//         }

//         snapshot.forEach((docSnap) => {
//             const user = docSnap.data();
//             const userId = docSnap.id;
            
//             const resultItem = document.createElement("a");
//             resultItem.href = `user.html?uid=${userId}`; 
//             resultItem.className = "search-result-item";
            
//             resultItem.innerHTML = `
//                 <img src="${user.profilePic || 'https://placehold.co/40'}" class="search-result-img" alt="avatar">
//                 <span class="search-result-name">${user.username}</span>
//             `;
            
//             resultsContainer.appendChild(resultItem);
//         });

//     } catch (error) {
//         console.error("Search failed:", error);
//         resultsContainer.innerHTML = `<div class="search-empty" style="color: #d9534f;">Search error!</div>`;
//     }
// }

// /**
//  * The Debouncer
//  */
// function handleInput(e, resultsContainer) {
//     const term = e.target.value.trim();
//     clearTimeout(searchTimeout);
    
//     searchTimeout = setTimeout(() => {
//         performSearch(term, resultsContainer);
//     }, 300);
// }

// // Safely attach listeners to inputs if they exist on the current HTML page
// if (searchDesktop && resultsDesktop) {
//     searchDesktop.addEventListener("input", (e) => handleInput(e, resultsDesktop));
// }

// if (searchMobile && resultsMobile) {
//     searchMobile.addEventListener("input", (e) => handleInput(e, resultsMobile));
// }

// // Global click listener to close dropdowns when clicking outside
// document.addEventListener("click", (e) => {
//     if (searchDesktop && resultsDesktop && !searchDesktop.contains(e.target) && !resultsDesktop.contains(e.target)) {
//         resultsDesktop.classList.add("hidden");
//     }
//     if (searchMobile && resultsMobile && !searchMobile.contains(e.target) && !resultsMobile.contains(e.target)) {
//         resultsMobile.classList.add("hidden");
//     }
// });










































// search.js - Enhanced Global Smart Search System
import { db } from "./firebase.js";
import { collection, query, where, getDocs, limit, orderBy } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const searchDesktop = document.getElementById("search-desktop");
const resultsDesktop = document.getElementById("search-results-desktop");

const searchMobile = document.getElementById("search-mobile");
const resultsMobile = document.getElementById("search-results-mobile");

let searchTimeout = null;
let allUsersCache = [];
let isCacheLoaded = false;
let currentUserUid = null;

// Get current user UID from auth
import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserUid = user.uid;
    }
});

/**
 * ADVANCED FUZZY MATCHING - Multiple strategies for better results
 */
function advancedFuzzyMatch(search, target) {
    if (!target || !search) return false;
    
    const s = search.toLowerCase().trim();
    const t = target.toLowerCase().trim();
    
    // 1. Exact match (highest priority)
    if (t === s) return true;
    
    // 2. Starts with (for prefix search)
    if (t.startsWith(s)) return true;
    
    // 3. Contains substring
    if (t.includes(s)) return true;
    
    // 4. Character subsequence matching (typo tolerant)
    let sIdx = 0;
    for (let i = 0; i < t.length && sIdx < s.length; i++) {
        if (t[i] === s[sIdx]) sIdx++;
        if (sIdx === s.length) return true;
    }
    
    // 5. Word-by-word matching (for multi-word searches)
    const searchWords = s.split(/\s+/);
    const targetWords = t.split(/\s+/);
    
    for (const searchWord of searchWords) {
        if (searchWord.length < 2) continue;
        for (const targetWord of targetWords) {
            if (targetWord.includes(searchWord) || searchWord.includes(targetWord)) {
                return true;
            }
        }
    }
    
    // 6. Character overlap percentage (75% threshold)
    let matches = 0;
    const maxLen = Math.max(s.length, t.length);
    for (let i = 0; i < Math.min(s.length, t.length); i++) {
        if (s[i] === t[i]) matches++;
    }
    const matchRatio = matches / maxLen;
    if (matchRatio > 0.75) return true;
    
    return false;
}

/**
 * SCORE RELEVANCE - Rank results by match quality
 */
function getMatchScore(search, username, bio) {
    let score = 0;
    const s = search.toLowerCase().trim();
    const u = (username || '').toLowerCase().trim();
    const b = (bio || '').toLowerCase().trim();
    
    // Username matches
    if (u === s) score += 100; // Exact username match
    else if (u.startsWith(s)) score += 80; // Starts with search
    else if (u.includes(s)) score += 60; // Contains search
    else if (advancedFuzzyMatch(search, username)) score += 40; // Fuzzy username
    
    // Bio matches (lower priority)
    if (b === s) score += 50; // Exact bio match
    else if (b.includes(s)) score += 30; // Bio contains search
    else if (advancedFuzzyMatch(search, bio)) score += 15; // Fuzzy bio
    
    // Boost score if search term is in both username AND bio
    if (u.includes(s) && b.includes(s)) score += 20;
    
    return score;
}

/**
 * SMART SEARCH WITH CACHING - Enhanced version
 */
async function performSmartSearch(searchTerm, resultsContainer) {
    if (!searchTerm || searchTerm.length < 1) {
        resultsContainer.classList.add("hidden");
        return;
    }

    resultsContainer.classList.remove("hidden");
    
    // Show loading state with animation
    resultsContainer.innerHTML = `
        <div class="search-loading" style="text-align: center; padding: 25px 15px;">
            <i class="ri-loader-4-line ri-spin" style="font-size: 1.8rem; color: var(--nav-blue);"></i>
            <br><span style="font-size: 0.85rem; color: #888; margin-top: 8px; display: inline-block;">Searching Elmore...</span>
        </div>
    `;

    try {
        // Load cache if not loaded
        if (!isCacheLoaded) {
            const usersRef = collection(db, "users");
            const q = query(usersRef, limit(300));
            const snapshot = await getDocs(q);
            
            allUsersCache = [];
            snapshot.forEach((docSnap) => {
                allUsersCache.push({ 
                    id: docSnap.id, 
                    ...docSnap.data() 
                });
            });
            isCacheLoaded = true;
        }

        resultsContainer.innerHTML = "";
        
        // Score and collect results
        const scoredResults = [];
        const searchLower = searchTerm.toLowerCase().trim();
        
        for (const user of allUsersCache) {
            // Skip current user
            if (user.id === currentUserUid) continue;
            
            const score = getMatchScore(searchLower, user.username, user.bio);
            if (score > 0) {
                scoredResults.push({
                    ...user,
                    score: score,
                    matchType: score >= 80 ? 'high' : score >= 40 ? 'medium' : 'low'
                });
            }
        }
        
        // Sort by score (highest first)
        scoredResults.sort((a, b) => b.score - a.score);
        
        // Limit to 8 results for dropdown
        const topResults = scoredResults.slice(0, 8);

        if (topResults.length === 0) {
            // Show helpful "no results" with suggestions
            resultsContainer.innerHTML = `
                <div class="search-empty" style="text-align: center; padding: 25px 15px; color: #888;">
                    <i class="ri-ghost-smile-line" style="font-size: 2.5rem; color: var(--border-color); display: block; margin-bottom: 10px;"></i>
                    <div style="font-size: 1rem; font-weight: 500; color: var(--nav-blue-dark);">No citizens found</div>
                    <div style="font-size: 0.85rem; margin-top: 5px;">"${searchTerm}"</div>
                    <div style="font-size: 0.75rem; margin-top: 10px; color: #aaa;">
                        <i class="ri-lightbulb-line"></i> Try a different spelling or shorter search
                    </div>
                </div>
            `;
            return;
        }

        // Display results
        topResults.forEach((user, index) => {
            const resultItem = document.createElement("a");
            resultItem.href = `user.html?uid=${user.id}`;
            resultItem.className = "search-result-item";
            
            // Add animation delay for smooth appearance
            resultItem.style.animationDelay = `${index * 0.05}s`;
            
            // Highlight matching part in username
            const highlightedName = highlightMatch(searchLower, user.username);
            
            // Show bio if available and relevant
            const bioPreview = user.bio ? 
                `<span style="font-size: 0.65rem; color: #999; margin-left: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px;">
                    ${user.bio.substring(0, 20)}${user.bio.length > 20 ? '...' : ''}
                </span>` : '';
            
            resultItem.innerHTML = `
                <img src="${user.profilePic || 'https://placehold.co/40'}" class="search-result-img" alt="avatar" style="border-radius: 50%; width: 40px; height: 40px; object-fit: cover; border: 2px solid ${user.score >= 80 ? 'var(--accent-green)' : 'var(--border-color)'};">
                <span class="search-result-name" style="font-weight: ${user.score >= 80 ? '600' : '400'};">
                    ${highlightedName}
                </span>
                ${bioPreview}
                ${user.score >= 80 ? `<span style="font-size: 0.55rem; background: var(--accent-green); color: white; padding: 1px 6px; border-radius: 10px; margin-left: 4px;">Top</span>` : ''}
            `;
            
            resultsContainer.appendChild(resultItem);
        });

        // Show "View All" if more results exist
        if (scoredResults.length > 8) {
            const viewAll = document.createElement("div");
            viewAll.className = "search-view-all";
            viewAll.style.cssText = `
                padding: 12px;
                text-align: center;
                border-top: 1px solid var(--border-color);
                color: var(--nav-blue);
                font-size: 0.85rem;
                cursor: pointer;
                transition: background 0.2s ease;
                border-radius: 0 0 12px 12px;
            `;
            viewAll.innerHTML = `
                <i class="ri-search-line"></i> 
                View all ${scoredResults.length} results for "${searchTerm}"
                <i class="ri-arrow-right-s-line"></i>
            `;
            viewAll.onmouseover = () => viewAll.style.background = 'var(--primary-light-blue)';
            viewAll.onmouseout = () => viewAll.style.background = 'transparent';
            viewAll.onclick = () => {
                window.location.href = `find-friends.html?search=${encodeURIComponent(searchTerm)}`;
            };
            resultsContainer.appendChild(viewAll);
        }

    } catch (error) {
        console.error("Search failed:", error);
        resultsContainer.innerHTML = `
            <div class="search-empty" style="text-align: center; padding: 20px; color: #d9534f;">
                <i class="ri-error-warning-line" style="font-size: 1.8rem; display: block; margin-bottom: 5px;"></i>
                <span style="font-weight: 500;">Search error</span>
                <br><span style="font-size: 0.8rem;">Please try again</span>
            </div>
        `;
    }
}

/**
 * HIGHLIGHT MATCH - Show which part of the username matched
 */
function highlightMatch(search, username) {
    if (!username) return '';
    
    const s = search.toLowerCase();
    const u = username;
    const uLower = u.toLowerCase();
    
    // If exact match or starts with, highlight the prefix
    if (uLower.startsWith(s)) {
        const prefix = u.substring(0, s.length);
        const rest = u.substring(s.length);
        return `<span style="background: var(--primary-light-blue); padding: 0 2px; border-radius: 3px;">${prefix}</span>${rest}`;
    }
    
    // If contains match, highlight the first occurrence
    const index = uLower.indexOf(s);
    if (index !== -1) {
        const before = u.substring(0, index);
        const match = u.substring(index, index + s.length);
        const after = u.substring(index + s.length);
        return `${before}<span style="background: var(--primary-light-blue); padding: 0 2px; border-radius: 3px;">${match}</span>${after}`;
    }
    
    // No direct match, return as is
    return u;
}

/**
 * QUICK SEARCH - For very short queries (1-2 chars)
 */
async function performQuickSearch(searchTerm, resultsContainer) {
    if (!searchTerm || searchTerm.length < 1) {
        resultsContainer.classList.add("hidden");
        return;
    }

    resultsContainer.classList.remove("hidden");
    resultsContainer.innerHTML = `
        <div class="search-loading" style="text-align: center; padding: 15px;">
            <i class="ri-loader-4-line ri-spin" style="color: var(--nav-blue);"></i>
        </div>
    `;

    try {
        const usersRef = collection(db, "users");
        const q = query(
            usersRef,
            where("username", ">=", searchTerm),
            where("username", "<=", searchTerm + "\uf8ff"),
            limit(5)
        );

        const snapshot = await getDocs(q);
        resultsContainer.innerHTML = "";

        if (snapshot.empty) {
            // Fallback to smart search
            await performSmartSearch(searchTerm, resultsContainer);
            return;
        }

        let count = 0;
        snapshot.forEach((docSnap) => {
            const user = docSnap.data();
            const userId = docSnap.id;
            
            if (userId === currentUserUid || count >= 5) return;
            count++;
            
            const resultItem = document.createElement("a");
            resultItem.href = `user.html?uid=${userId}`;
            resultItem.className = "search-result-item";
            
            resultItem.innerHTML = `
                <img src="${user.profilePic || 'https://placehold.co/40'}" class="search-result-img" alt="avatar" style="border-radius: 50%; width: 40px; height: 40px; object-fit: cover;">
                <span class="search-result-name">${user.username}</span>
            `;
            
            resultsContainer.appendChild(resultItem);
        });

    } catch (error) {
        console.error("Quick search failed:", error);
        await performSmartSearch(searchTerm, resultsContainer);
    }
}

/**
 * THE DEBOUNCER - Smart routing based on search length
 */
function handleInput(e, resultsContainer) {
    const term = e.target.value.trim();
    clearTimeout(searchTimeout);
    
    if (!term) {
        resultsContainer.classList.add("hidden");
        return;
    }
    
    // Route to appropriate search method
    searchTimeout = setTimeout(() => {
        if (term.length <= 2) {
            performQuickSearch(term, resultsContainer);
        } else {
            performSmartSearch(term, resultsContainer);
        }
    }, 250); // Slightly faster response
}

/**
 * KEYBOARD SHORTCUTS
 */
document.addEventListener("keydown", (e) => {
    // Ctrl+K or Cmd+K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (searchDesktop && !searchDesktop.disabled) {
            searchDesktop.focus();
            searchDesktop.select();
        } else if (searchMobile && !searchMobile.disabled) {
            searchMobile.focus();
            searchMobile.select();
        }
    }
    
    // ESC to close
    if (e.key === 'Escape') {
        if (resultsDesktop) resultsDesktop.classList.add("hidden");
        if (resultsMobile) resultsMobile.classList.add("hidden");
        if (searchDesktop) searchDesktop.blur();
        if (searchMobile) searchMobile.blur();
    }
});

// Attach listeners
if (searchDesktop && resultsDesktop) {
    searchDesktop.addEventListener("input", (e) => handleInput(e, resultsDesktop));
    searchDesktop.addEventListener("focus", () => {
        const term = searchDesktop.value.trim();
        if (term) {
            performSmartSearch(term, resultsDesktop);
        }
    });
    // Add placeholder hint for keyboard shortcut
    if (!searchDesktop.placeholder.includes('Ctrl+K')) {
        searchDesktop.placeholder = 'Search citizens... (Ctrl+K)';
    }
}

if (searchMobile && resultsMobile) {
    searchMobile.addEventListener("input", (e) => handleInput(e, resultsMobile));
    searchMobile.addEventListener("focus", () => {
        const term = searchMobile.value.trim();
        if (term) {
            performSmartSearch(term, resultsMobile);
        }
    });
}

// Click outside to close
document.addEventListener("click", (e) => {
    if (searchDesktop && resultsDesktop && !searchDesktop.contains(e.target) && !resultsDesktop.contains(e.target)) {
        resultsDesktop.classList.add("hidden");
    }
    if (searchMobile && resultsMobile && !searchMobile.contains(e.target) && !resultsMobile.contains(e.target)) {
        resultsMobile.classList.add("hidden");
    }
});

// Cache refresh
setInterval(() => {
    isCacheLoaded = false;
    allUsersCache = [];
}, 300000);