const consultationForm = document.getElementById("consultationForm");

consultationForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const consultation = {
        name: localStorage.getItem("patientName") || "Patient",
        age: localStorage.getItem("patientAge") || "-",

        symptoms: document.getElementById("symptoms").value,
        medications: document.getElementById("medications").value,
        allergies: document.getElementById("allergies").value,

        vitals: {
            temperature: document.getElementById("temperature").value,
            heartRate: document.getElementById("heartRate").value,
            spo2: document.getElementById("spo2").value,
            bloodPressure: document.getElementById("bloodPressure").value
        }
    };

    try {

        const response = await fetch("/consultation", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(consultation)
        });

        const data = await response.json();

        if (!data.success) {
            alert("Could not send consultation.");
            return;
        }

        // Save the consultation ID locally
        // so this device knows which consultation belongs to it.
        localStorage.setItem(
            "consultationId",
            data.consultation.id
        );

        localStorage.setItem(
            "currentConsultation",
            JSON.stringify(data.consultation)
        );

        // Go to waiting screen
        window.location.href = "waiting.html";

    } catch (error) {

        console.error("Error sending consultation:", error);

        alert(
            "Could not connect to the server. Please try again."
        );
    }
});


// Display patient information
const patientNameDisplay =
    document.getElementById("patientName");

const patientAgeDisplay =
    document.getElementById("patientAge");

if (patientNameDisplay) {
    patientNameDisplay.textContent =
        localStorage.getItem("patientName") || "Patient";
}

if (patientAgeDisplay) {
    patientAgeDisplay.textContent =
        localStorage.getItem("patientAge") || "-";
}
