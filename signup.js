/**
 * Enhanced Signup Component
 * A secure, accessible, and configurable signup component
 */

// Import Firebase modules
import { app, auth } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

// Configuration
const CONFIG = {
  minPasswordLength: 6
};

// DOM Elements
const signupForm = document.getElementById("signup-form");
const googleSignupBtn = document.getElementById("google-signup-btn");
const passwordToggles = document.querySelectorAll(".password-toggle");

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  // Form submission
  if (signupForm) {
    signupForm.addEventListener("submit", handleSignup);
  }
  
  // Google signup
  if (googleSignupBtn) {
    googleSignupBtn.addEventListener("click", handleGoogleSignup);
  }
  
  // Password toggle
  passwordToggles.forEach(toggle => {
    toggle.addEventListener("click", togglePasswordVisibility);
  });
  
  // Real-time validation
  const inputs = document.querySelectorAll(".form-input");
  inputs.forEach(input => {
    input.addEventListener("blur", () => validateField(input));
    input.addEventListener("input", () => clearFieldError(input));
  });
}

// Handle email/password signup
async function handleSignup(event) {
  event.preventDefault();
  
  const formData = new FormData(signupForm);
  const email = formData.get("email")?.trim();
  const password = formData.get("password");
  const confirmPassword = formData.get("confirm-password");
  
  // Validate form
  if (!validateSignupForm(email, password, confirmPassword)) {
    return;
  }
  
  setLoading(true);
  clearMessages();
  
  try {
    // Create user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile (optional)
    await updateProfile(user, {
      displayName: email.split("@")[0]
    });
    
    showMessage("Account created successfully! Redirecting...", "success");
    
    // Redirect after short delay
    setTimeout(() => {
      window.location.href = "logged.html";
    }, 1500);
    
  } catch (error) {
    handleSignupError(error);
  } finally {
    setLoading(false);
  }
}

// Handle Google signup
async function handleGoogleSignup() {
  setLoading(true, "google-signup-btn");
  clearMessages();
  
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope("email");
    provider.addScope("profile");
    
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    showMessage("Account created with Google! Redirecting...", "success");
    
    // Redirect after short delay
    setTimeout(() => {
      window.location.href = "logged.html";
    }, 1500);
    
  } catch (error) {
    handleSignupError(error);
  } finally {
    setLoading(false, "google-signup-btn");
  }
}

// Signup form validation
function validateSignupForm(email, password, confirmPassword) {
  let isValid = true;
  
  // Email validation
  if (!email) {
    showFieldError("email", "Email is required");
    isValid = false;
  } else if (!isValidEmail(email)) {
    showFieldError("email", "Please enter a valid email address");
    isValid = false;
  }
  
  // Password validation
  if (!password) {
    showFieldError("password", "Password is required");
    isValid = false;
  } else if (password.length < CONFIG.minPasswordLength) {
    showFieldError("password", `Password must be at least ${CONFIG.minPasswordLength} characters`);
    isValid = false;
  }
  
  // Confirm password validation
  if (!confirmPassword) {
    showFieldError("confirm-password", "Please confirm your password");
    isValid = false;
  } else if (password !== confirmPassword) {
    showFieldError("confirm-password", "Passwords do not match");
    isValid = false;
  }
  
  return isValid;
}

// Validate individual field
function validateField(input) {
  const value = input.value.trim();
  const fieldName = input.name;
  
  clearFieldError(input);
  
  if (fieldName === "email" && value) {
    if (!isValidEmail(value)) {
      showFieldError("email", "Please enter a valid email address");
    }
  }
  
  if (fieldName === "password" && value) {
    if (value.length < CONFIG.minPasswordLength) {
      showFieldError("password", `Password must be at least ${CONFIG.minPasswordLength} characters`);
    }
  }
  
  if (fieldName === "confirm-password" && value) {
    const password = document.getElementById("password").value;
    if (value !== password) {
      showFieldError("confirm-password", "Passwords do not match");
    }
  }
}

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Toggle password visibility
function togglePasswordVisibility(event) {
  const toggle = event.currentTarget;
  const passwordInput = toggle.closest('.password-input-wrapper').querySelector('input');
  const icon = toggle.querySelector("i");
  
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    icon.className = "fas fa-eye-slash";
  } else {
    passwordInput.type = "password";
    icon.className = "fas fa-eye";
  }
}

// Handle signup errors
function handleSignupError(error) {
  console.error("Signup error:", error);
  
  let message = "Signup failed. Please try again.";
  
  switch (error.code) {
    case "auth/email-already-in-use":
      message = "An account already exists with this email address.";
      break;
    case "auth/invalid-email":
      message = "Please enter a valid email address.";
      break;
    case "auth/weak-password":
      message = "Password is too weak. Please use a stronger password.";
      break;
    case "auth/network-request-failed":
      message = "Network error. Please check your connection and try again.";
      break;
    case "auth/popup-closed-by-user":
      message = "Sign-up was cancelled. Please try again.";
      break;
    case "auth/popup-blocked":
      message = "Pop-up was blocked. Please allow pop-ups and try again.";
      break;
    default:
      message = error.message || "An unexpected error occurred. Please try again.";
  }
  
  showMessage(message, "error");
}

// UI Helper methods
function showMessage(message, type = "info") {
  const messagesContainer = document.getElementById("auth-messages");
  if (!messagesContainer) return;
  
  messagesContainer.textContent = message;
  messagesContainer.className = `auth-messages show ${type}`;
  
  // Auto-hide success messages
  if (type === "success") {
    setTimeout(() => {
      messagesContainer.classList.remove("show");
    }, 5000);
  }
}

function clearMessages() {
  const messagesContainer = document.getElementById("auth-messages");
  if (messagesContainer) {
    messagesContainer.classList.remove("show");
  }
}

function showFieldError(fieldName, message) {
  const errorElement = document.getElementById(`${fieldName}-error`);
  const inputElement = document.getElementById(fieldName);
  
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.add("show");
  }
  
  if (inputElement) {
    inputElement.classList.add("error");
  }
}

function clearFieldError(input) {
  const fieldName = input.name || input.id;
  const errorElement = document.getElementById(`${fieldName}-error`);
  
  if (errorElement) {
    errorElement.classList.remove("show");
  }
  
  input.classList.remove("error");
}

function setLoading(loading, buttonId = "signup-btn") {
  const button = document.getElementById(buttonId);
  if (!button) return;
  
  if (loading) {
    button.classList.add("loading");
    button.disabled = true;
  } else {
    button.classList.remove("loading");
    button.disabled = false;
  }
}