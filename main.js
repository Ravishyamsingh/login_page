/**
 * Enhanced Login Component
 * A secure, accessible, and configurable login component
 */

// Import Firebase modules
import { app, auth } from "./firebase-config.js";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

// Configuration
const CONFIG = {
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  minPasswordLength: 6,
  enableRateLimiting: true
};

// State management
let loginAttempts = getLoginAttempts();
let isLocked = checkLockout();

// Initialize Firebase auth language
auth.languageCode = "en";

// DOM Elements
const loginForm = document.getElementById("login-form");
const googleLoginBtn = document.getElementById("google-login-btn");
const passwordToggle = document.querySelector(".password-toggle");
const signupLink = document.getElementById("signup-link");
const forgotPasswordLink = document.querySelector(".forgot-password");

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
  setupEventListeners();
  setupUI();
});

// Setup event listeners
function setupEventListeners() {
  // Form submission
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
  
  // Google login
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener("click", handleGoogleLogin);
  }
  
  // Password toggle
  if (passwordToggle) {
    passwordToggle.addEventListener("click", togglePasswordVisibility);
  }
  
  // Social login buttons
  const socialBtns = document.querySelectorAll(".social-btn");
  socialBtns.forEach(btn => {
    btn.addEventListener("click", handleSocialLogin);
  });
  
  // Navigation links
  if (signupLink) {
    signupLink.addEventListener("click", function(e) {
      e.preventDefault();
      window.location.href = "signup.html";
    });
  }
  
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", function(e) {
      e.preventDefault();
      showMessage("Password reset functionality would be implemented here", "info");
    });
  }
  
  // Real-time validation
  const inputs = document.querySelectorAll(".form-input");
  inputs.forEach(input => {
    input.addEventListener("blur", () => validateField(input));
    input.addEventListener("input", () => clearFieldError(input));
  });
}

// Setup UI based on state
function setupUI() {
  if (isLocked) {
    showLockoutMessage();
  }
}

// Handle email/password login
async function handleLogin(event) {
  event.preventDefault();
  
  if (isLocked) {
    showLockoutMessage();
    return;
  }
  
  const formData = new FormData(loginForm);
  const email = formData.get("email")?.trim();
  const password = formData.get("password");
  const rememberMe = formData.get("remember") === "on";
  
  // Validate form
  if (!validateForm(email, password)) {
    return;
  }
  
  setLoading(true);
  clearMessages();
  
  try {
    // Set persistence based on remember me
    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);
    
    // Sign in
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Reset login attempts on success
    resetLoginAttempts();
    
    showMessage("Login successful! Redirecting...", "success");
    
    // Redirect after short delay
    setTimeout(() => {
      window.location.href = "logged.html";
    }, 1500);
    
  } catch (error) {
    handleLoginError(error);
    incrementLoginAttempts();
  } finally {
    setLoading(false);
  }
}

// Handle Google login
async function handleGoogleLogin() {
  if (isLocked) {
    showLockoutMessage();
    return;
  }
  
  setLoading(true, "google-login-btn");
  clearMessages();
  
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope("email");
    provider.addScope("profile");
    
    const result = await signInWithPopup(auth, provider);
    
    // Reset login attempts on success
    resetLoginAttempts();
    
    showMessage("Google login successful! Redirecting...", "success");
    
    // Redirect after short delay
    setTimeout(() => {
      window.location.href = "logged.html";
    }, 1500);
    
  } catch (error) {
    handleLoginError(error);
    incrementLoginAttempts();
  } finally {
    setLoading(false, "google-login-btn");
  }
}

// Handle social login
function handleSocialLogin(event) {
  const provider = event.currentTarget.getAttribute("data-provider");
  showMessage(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login is not implemented yet.`, "warning");
}

// Form validation
function validateForm(email, password) {
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
}

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Toggle password visibility
function togglePasswordVisibility() {
  const passwordInput = document.getElementById("password");
  const icon = passwordToggle.querySelector("i");
  
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    icon.className = "fas fa-eye-slash";
  } else {
    passwordInput.type = "password";
    icon.className = "fas fa-eye";
  }
}

// Handle login errors
function handleLoginError(error) {
  console.error("Login error:", error);
  
  let message = "Login failed. Please try again.";
  
  switch (error.code) {
    case "auth/user-not-found":
      message = "No account found with this email address.";
      break;
    case "auth/wrong-password":
      message = "Incorrect password. Please try again.";
      break;
    case "auth/invalid-email":
      message = "Please enter a valid email address.";
      break;
    case "auth/user-disabled":
      message = "This account has been disabled. Please contact support.";
      break;
    case "auth/too-many-requests":
      message = "Too many failed attempts. Please try again later.";
      break;
    case "auth/network-request-failed":
      message = "Network error. Please check your connection and try again.";
      break;
    case "auth/popup-closed-by-user":
      message = "Sign-in was cancelled. Please try again.";
      break;
    case "auth/popup-blocked":
      message = "Pop-up was blocked. Please allow pop-ups and try again.";
      break;
    default:
      message = error.message || "An unexpected error occurred. Please try again.";
  }
  
  showMessage(message, "error");
}

// Login attempt tracking
function getLoginAttempts() {
  const attempts = localStorage.getItem("loginAttempts");
  return attempts ? JSON.parse(attempts) : { count: 0, timestamp: Date.now() };
}

function incrementLoginAttempts() {
  if (!CONFIG.enableRateLimiting) return;
  
  loginAttempts.count++;
  loginAttempts.timestamp = Date.now();
  localStorage.setItem("loginAttempts", JSON.stringify(loginAttempts));
  
  if (loginAttempts.count >= CONFIG.maxLoginAttempts) {
    isLocked = true;
    showLockoutMessage();
  }
}

function resetLoginAttempts() {
  loginAttempts = { count: 0, timestamp: Date.now() };
  localStorage.removeItem("loginAttempts");
  isLocked = false;
}

function checkLockout() {
  if (!CONFIG.enableRateLimiting) return false;
  
  const attempts = getLoginAttempts();
  if (attempts.count >= CONFIG.maxLoginAttempts) {
    const timeSinceLockout = Date.now() - attempts.timestamp;
    if (timeSinceLockout < CONFIG.lockoutDuration) {
      return true;
    } else {
      // Lockout period has expired
      resetLoginAttempts();
      return false;
    }
  }
  return false;
}

function showLockoutMessage() {
  const remainingTime = Math.ceil((CONFIG.lockoutDuration - (Date.now() - loginAttempts.timestamp)) / 60000);
  showMessage(`Account temporarily locked due to too many failed attempts. Try again in ${remainingTime} minutes.`, "error");
  
  // Disable form
  if (loginForm) {
    const inputs = loginForm.querySelectorAll("input, button");
    inputs.forEach(input => input.disabled = true);
  }
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

function setLoading(loading, buttonId = "login-btn") {
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
