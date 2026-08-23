// Check whether this device already has a registered role
const savedRole = localStorage.getItem("userRole");

const patientBtn = document.getElementById("patientBtn");
const doctorBtn = document.getElementById("doctorBtn");

// If a role is already registered, skip the role-selection page
if (savedRole) {
    if (savedRole === "patient") {
        window.location.href = "patient.html";
    } else if (savedRole === "doctor") {
        window.location.href = "doctor.html";
    }
}

// First-time registration choice
patientBtn.addEventListener("click", function () {
    localStorage.setItem("userRole", "patient");
    window.location.href = "patient.html";
});

doctorBtn.addEventListener("click", function () {
    localStorage.setItem("userRole", "doctor");
    window.location.href = "doctor.html";
});