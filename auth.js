// auth.js
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { auth, db } from "./firebase.js";

// --- FUNNY ERROR TRANSLATOR ---
function getFunnyErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/email-already-in-use':
            return "Dude, you already have an account. Stop trying to clone yourself.";
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
            return "Something broke. Probably Gumball's fault. Try again.";
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
        
        const name = document.getElementById('signup-name').value; // Get the Name!
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const errorMessage = document.getElementById('signup-error');
        const submitBtn = document.getElementById('signup-btn-submit');

        submitBtn.textContent = "Asking Mr. Small for permission..."; // Funny loading state
        submitBtn.disabled = true;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Save the custom Name instead of the email prefix!
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                username: name, // Using their provided name
                bio: "I survived Elmore Junior High today.",
                profilePic: `images/user.png`,
                // profilePic: `https://placehold.co/150x150/87CEEB/FFF?text=${name.charAt(0).toUpperCase()}`,
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
        
        const email = document.getElementById('login-email').value;
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