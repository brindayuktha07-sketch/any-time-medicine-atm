const doctorForm = document.getElementById("doctorForm");

doctorForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("doctorName").value;
    const doctorId = document.getElementById("doctorId").value;

    // Save doctor information on this device
    localStorage.setItem("userRole", "doctor");
    localStorage.setItem("doctorName", name);
    localStorage.setItem("doctorId", doctorId);

    // Go to doctor dashboard
    window.location.href = "doctor-dashboard.html";
});