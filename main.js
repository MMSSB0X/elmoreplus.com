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













// =========================================
// FLOATING SCROLL TO TOP BUTTON
// =========================================

(function() {
    const scrollBtn = document.getElementById('scrollTopBtn');
    if (!scrollBtn) return;

    // Show/hide button based on scroll position
    function toggleScrollButton() {
        const scrollY = window.scrollY || window.pageYOffset;
        const threshold = 300; // Show after scrolling 300px

        if (scrollY > threshold) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    }

    // Smooth scroll to top when clicked
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // Attach events
    window.addEventListener('scroll', toggleScrollButton, { passive: true });
    scrollBtn.addEventListener('click', scrollToTop);

    // Check initial state
    toggleScrollButton();
})();









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










