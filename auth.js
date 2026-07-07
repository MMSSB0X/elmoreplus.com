// auth.js
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
// WE ADDED collection, query, where, and getDocs to check the database!
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { auth, db } from "./firebase.js";

// --- FUNNY ERROR TRANSLATOR ---
function getFunnyErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/email-already-in-use':
            return "Too late! Tobias (or someone else) already took that Elmore Account name. Try another one!";
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
            return "Wrong! Are you sure you even go to Elmore Junior High?";
        case 'auth/weak-password':
            return "That password is so weak, it just lost an arm wrestling match to a cloud.";
        case 'auth/user-not-found':
            return "Who are you? The system has literally no idea who you are.";
        case 'auth/too-many-requests':
            return "Whoa, slow down! You're clicking faster than Richard running to a buffet. Try again later.";
        default:
            return "Whoa there, copycat! That Display Name is already taken. Are you trying to pull a Zach? Pick a new one.";
            // return "Something broke. Probably Gumball's fault. Try again.";
    }
}

// --- SIGN UP LOGIC ---
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    
    // The Password Strength Meter!
    const passwordInput = document.getElementById('signup-password');
    const meterText = document.getElementById('password-meter');

    passwordInput.addEventListener('input', (e) => {
        const val = e.target.value;
        if (val.length === 0) {
            meterText.textContent = "Strength: Waiting for you to type...";
            meterText.className = "funny-meter";
        } else if (val.length < 6) {
            meterText.textContent = "Strength: Weak as a wet paper towel.";
            meterText.className = "funny-meter meter-weak";
        } else if (val.length >= 6 && val.length < 9) {
            meterText.textContent = "Strength: Meh. Anais could hack this in 3 seconds.";
            meterText.className = "funny-meter meter-medium";
        } else {
            meterText.textContent = "Strength: Stronger than Nicole's rage!";
            meterText.className = "funny-meter meter-strong";
        }
    });

    // Handle the actual Sign Up
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('signup-name').value.trim();
        
        // Grab the username and automatically append the domain
        const rawUsername = document.getElementById('signup-username').value.trim();
        const email = rawUsername.includes('@') ? rawUsername : `${rawUsername}@elmore.com`;
        
        const password = document.getElementById('signup-password').value;
        const errorMessage = document.getElementById('signup-error');
        const submitBtn = document.getElementById('signup-btn-submit');

        submitBtn.textContent = "Asking Mr. Small for permission..."; 
        submitBtn.disabled = true;

        try {
            // --- NEW: DISPLAY NAME PROTECTION ---
            // 1. Look in the "users" database
            const usersRef = collection(db, "users");
            // 2. Check if a lowercase version of this name already exists
            const q = query(usersRef, where("usernameLower", "==", name.toLowerCase()));
            const querySnapshot = await getDocs(q);

            // 3. If we found someone with this name, STOP the sign up!
            if (!querySnapshot.empty) {
                errorMessage.textContent = "Identity theft is not a joke! That Display Name is already taken.";
                errorMessage.style.display = "block";
                submitBtn.textContent = "CREATE ACCOUNT";
                submitBtn.disabled = false;
                return; // Stop the code right here
            }
            // --- END OF PROTECTION ---

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                username: name, 
                // We save a lowercase version to make our protection check bulletproof
                usernameLower: name.toLowerCase(), 
                bio: "I survived Elmore Junior High today.",
                profilePic: `images/user.png`,
                friends: [],
                role: "user",
                createdAt: serverTimestamp()
            });

            alert(`Welcome to Elmore Plus, ${name}! Don't accept friend requests from Jamie.`);
            window.location.href = "index.html"; 

        } catch (error) {
            errorMessage.textContent = getFunnyErrorMessage(error.code);
            errorMessage.style.display = "block";
            submitBtn.textContent = "CREATE ACCOUNT";
            submitBtn.disabled = false;
        }
    });
}

// --- LOGIN LOGIC ---
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Grab the username and automatically append the domain
        const rawUsername = document.getElementById('login-username').value.trim();
        const email = rawUsername.includes('@') ? rawUsername : `${rawUsername}@elmore.com`;
        
        const password = document.getElementById('login-password').value;
        const errorMessage = document.getElementById('login-error');
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        submitBtn.textContent = "Waking up the server... 😴";
        submitBtn.disabled = true;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = "index.html"; 
        } catch (error) {
            errorMessage.textContent = getFunnyErrorMessage(error.code);
            errorMessage.style.display = "block";
            submitBtn.textContent = "ENTER THE MADNESS";
            submitBtn.disabled = false;
        }
    });
}