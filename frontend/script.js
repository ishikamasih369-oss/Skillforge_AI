console.log("SkillForge AI loaded successfully!");

const API_BASE_URL = "http://127.0.0.1:8000";

let currentUser = null;
let authToken = null;

const select = (selector) => document.querySelector(selector);
const selectAll = (selector) => document.querySelectorAll(selector);

function showMessage(message) {
    alert(message);
}

function initializeLandingPage() {
    const getStartedButton = select(".primary-btn");

    if (
        getStartedButton &&
        window.location.pathname.includes("index")
    ) {
        getStartedButton.addEventListener("click", function (event) {
            event.preventDefault();
            window.location.href = "register.html";
        });
    }
}

function initializeNavigation() {
    const navigationLinks = selectAll(".nav-links a");

    navigationLinks.forEach((link) => {
        link.addEventListener("click", () => {
            console.log(
                "Navigation clicked:",
                link.textContent.trim()
            );
        });
    });
}

function showFormError(input, message) {
    clearFormError(input);

    const error = document.createElement("small");

    error.className = "form-error";
    error.textContent = message;

    input.parentElement.appendChild(error);
    input.classList.add("input-error");
}

function clearFormError(input) {
    const existingError =
        input.parentElement.querySelector(".form-error");

    if (existingError) {
        existingError.remove();
    }

    input.classList.remove("input-error");
}

function clearAllFormErrors(form) {
    const errors = form.querySelectorAll(".form-error");

    errors.forEach((error) => error.remove());

    const inputs = form.querySelectorAll("input");

    inputs.forEach((input) => {
        input.classList.remove("input-error");
    });
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateRegistrationForm(form) {
    clearAllFormErrors(form);

    const name = select("#name");
    const email = select("#email");
    const password = select("#password");
    const confirmPassword = select("#confirmPassword");

    let isValid = true;

    if (!name.value.trim()) {
        showFormError(
            name,
            "Please enter your full name."
        );

        isValid = false;
    }

    if (!email.value.trim()) {
        showFormError(
            email,
            "Please enter your email."
        );

        isValid = false;

    } else if (!isValidEmail(email.value.trim())) {

        showFormError(
            email,
            "Please enter a valid email address."
        );

        isValid = false;
    }

    if (!password.value) {

        showFormError(
            password,
            "Please enter a password."
        );

        isValid = false;

    } else if (password.value.length < 8) {

        showFormError(
            password,
            "Password must contain at least 8 characters."
        );

        isValid = false;
    }

    if (!confirmPassword.value) {

        showFormError(
            confirmPassword,
            "Please confirm your password."
        );

        isValid = false;

    } else if (
        password.value !== confirmPassword.value
    ) {

        showFormError(
            confirmPassword,
            "Passwords do not match."
        );

        isValid = false;
    }

    return isValid;
}

function initializeRegistration() {
    const registerForm = select("#registerForm");

    if (!registerForm) {
        return;
    }

    registerForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            if (!validateRegistrationForm(registerForm)) {
                return;
            }

            const userData = {
                name: select("#name").value.trim(),
                email: select("#email").value.trim(),
                password: select("#password").value
            };

            registerUser(userData);
        }
    );
}

function validateLoginForm(form) {
    clearAllFormErrors(form);

    const email = select("#loginEmail");
    const password = select("#loginPassword");

    let isValid = true;

    if (!email.value.trim()) {

        showFormError(
            email,
            "Please enter your email."
        );

        isValid = false;

    } else if (!isValidEmail(email.value.trim())) {

        showFormError(
            email,
            "Please enter a valid email address."
        );

        isValid = false;
    }

    if (!password.value) {

        showFormError(
            password,
            "Please enter your password."
        );

        isValid = false;
    }

    return isValid;
}

function initializeLogin() {
    const loginForm = select("#loginForm");

    if (!loginForm) {
        return;
    }

    loginForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            if (!validateLoginForm(loginForm)) {
                return;
            }

            const email =
                select("#loginEmail").value.trim();

            const password =
                select("#loginPassword").value;

            loginUser(email, password);
        }
    );
}


async function registerUser(userData) {
    const result = await apiRequest("/api/auth/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(userData)
    });

    if (!result) {
        showMessage("Registration failed. Check the server and try again.");
        return;
    }

    showMessage("Registration successful! Please log in.");

    window.location.href = "login.html";
}

async function loginUser(email, password) {
    const params = new URLSearchParams({
        email: email,
        password: password
    });

    const result = await apiRequest(
        `/api/auth/login?${params.toString()}`,
        {
            method: "POST"
        }
    );

    if (!result) {
        showMessage(
            "Login failed. Check your credentials and server connection."
        );
        return;
    }

    authToken = result.access_token;
    currentUser = result.user;

    localStorage.setItem("skillforge_token", authToken);
    localStorage.setItem(
        "skillforge_user",
        JSON.stringify(currentUser)
    );

    showMessage(`Welcome back, ${currentUser.name}! Login successful.`);
}

function logoutUser() {
    currentUser = null;
    authToken = null;

    localStorage.removeItem("skillforge_token");
    localStorage.removeItem("skillforge_user");

    console.log("User logged out.");
}

a
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(
            API_BASE_URL + endpoint,
            {
                ...options,
                headers: {
                    ...(options.headers || {}),
                    ...(authToken
                        ? { Authorization: `Bearer ${authToken}` }
                        : {})
                }
            }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            const message =
                typeof data?.detail === "string"
                    ? data.detail
                    : `Request failed: ${response.status}`;

            console.error("API error:", data);
            showMessage(message);

            return null;
        }

        return data;

    } catch (error) {
        console.error("API request failed:", error);

        showMessage(
            "Cannot connect to SkillForge AI. Check that FastAPI is running."
        );

        return null;
    }
}


function initializeSkillForge() {

    initializeLandingPage();
    initializeNavigation();
    initializeRegistration();
    initializeLogin();

    console.log("SkillForge AI ready!");
}

document.addEventListener(
    "DOMContentLoaded",
    initializeSkillForge
);