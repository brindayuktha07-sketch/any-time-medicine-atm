const consultationForm = document.getElementById("consultationForm");

consultationForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const consultation = {
        name: localStorage.getItem("patientName"),
        age: localStorage.getItem("patientAge"),

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

        const result = await response.json();

        if (result.success) {
            // Save the consultation ID so the patient can track it
            localStorage.setItem(
                "consultationId",
                result.consultation.id
            );

            // Go to waiting room
            window.location.href = "waiting.html";
        } else {
            alert("Could not send consultation.");
        }

    } catch (error) {
        console.error(error);
        alert("Cannot connect to the server.");
    }
});