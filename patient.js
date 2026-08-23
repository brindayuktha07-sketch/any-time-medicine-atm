const patientForm = document.getElementById("patientForm");

patientForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("patientName").value;
    const age = document.getElementById("patientAge").value;

    // Save patient information on this device
    localStorage.setItem("userRole", "patient");
    localStorage.setItem("patientName", name);
    localStorage.setItem("patientAge", age);

    // Go to patient dashboard
    window.location.href = "patient-dashboard.html";
});