const consultation = JSON.parse(
    localStorage.getItem("currentConsultation")
);

const cancelBtn = document.getElementById("cancelBtn");

cancelBtn.addEventListener("click", function () {

    localStorage.removeItem("currentConsultation");

    window.location.href = "patient-dashboard.html";

});