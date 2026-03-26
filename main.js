// main.js - Handles all UI, Menus, and Animations

document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Mobile Search Toggle
    const mobileSearchBtn = document.getElementById("mobile-search-trigger");
    const searchDropdown = document.getElementById("mobile-search-box");

    if (mobileSearchBtn && searchDropdown) {
        mobileSearchBtn.addEventListener("click", (e) => {
            e.preventDefault();
            searchDropdown.classList.toggle("active");
            
            // Close the nav menu if it's open
            const mobileMenu = document.getElementById("mobile-nav-menu");
            if (mobileMenu) mobileMenu.classList.remove("active");
        });
    }

    // 2. Mobile Nav Menu Toggle (Hamburger Menu)
    const mobileMenuTriggers = document.querySelectorAll(".mobile-menu-trigger");
    const mobileMenu = document.getElementById("mobile-nav-menu");

    if (mobileMenuTriggers.length > 0 && mobileMenu) {
        mobileMenuTriggers.forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                mobileMenu.classList.toggle("active");
                
                // Close the search if it's open
                if (searchDropdown) searchDropdown.classList.remove("active");
            });
        });
    }

    // 3. Add Post Modal Toggle
    const modal = document.getElementById("post-modal");
    const openModalBtn = document.getElementById("open-post-modal");
    const closeModalBtn = document.getElementById("close-post-modal");

    if (openModalBtn && modal) {
        openModalBtn.addEventListener("click", () => {
            modal.classList.add("active");
        });
    }
    
    if (closeModalBtn && modal) {
        closeModalBtn.addEventListener("click", () => {
            modal.classList.remove("active");
        });
    }
});