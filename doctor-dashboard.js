const doctorName = localStorage.getItem("doctorName");

document.getElementById("doctorName").textContent =
    doctorName || "Doctor";

const patientRequest =
    document.getElementById("patientRequest");


async function checkForPatient() {

    try {

        const response = await fetch("/consultations");

        const data = await response.json();

        const consultations = data.consultations || [];

        // Only show consultations that are waiting
        const waitingConsultation =
            consultations.find(
                consultation =>
                    consultation.status === "waiting"
            );


        if (!waitingConsultation) {

            patientRequest.innerHTML = `
                <p>
                    No patients are currently waiting.
                </p>
            `;

            return;
        }


        const consultation = waitingConsultation;


        patientRequest.innerHTML = `

            <h3>Patient Request</h3>

            <p>
                <strong>Name:</strong>
                ${consultation.name}
            </p>

            <p>
                <strong>Age:</strong>
                ${consultation.age}
            </p>

            <p>
                <strong>Symptoms:</strong>
                ${consultation.symptoms}
            </p>

            <p>
                <strong>Current Medications:</strong>
                ${consultation.medications || "None reported"}
            </p>

            <p>
                <strong>Allergies:</strong>
                ${consultation.allergies || "None reported"}
            </p>

            <h4>Vitals</h4>

            <p>
                Temperature:
                ${consultation.vitals.temperature || "Not provided"} °C
            </p>

            <p>
                Heart Rate:
                ${consultation.vitals.heartRate || "Not provided"} BPM
            </p>

            <p>
                SpO₂:
                ${consultation.vitals.spo2 || "Not provided"} %
            </p>

            <p>
                Blood Pressure:
                ${consultation.vitals.bloodPressure || "Not provided"}
            </p>

            <button id="acceptBtn">
                Accept Consultation
            </button>
        `;


        document
            .getElementById("acceptBtn")
            .addEventListener("click", async function () {

                try {

                    const response = await fetch(
                        `/consultation/${consultation.id}/accept`,
                        {
                            method: "POST"
                        }
                    );

                    const data = await response.json();


                    if (!data.success) {

                        alert(
                            "Could not accept consultation."
                        );

                        return;
                    }


                    // Store accepted consultation locally
                    localStorage.setItem(
                        "currentConsultation",
                        JSON.stringify(data.consultation)
                    );

                    localStorage.setItem(
                        "consultationStatus",
                        "accepted"
                    );


                    // Open video call
                    window.location.href =
                        'video-call.html?room=${consultaton.id}&role=doctor';

                } catch (error) {

                    console.error(
                        "Error accepting consultation:",
                        error
                    );

                    alert(
                        "Could not connect to the server."
                    );
                }

            });


    } catch (error) {

        console.error(
            "Error checking consultations:",
            error
        );

        patientRequest.innerHTML = `
            <p>
                Unable to connect to server.
            </p>
        `;
    }
}


// Check immediately
checkForPatient();


// Check for new patients every 2 seconds
setInterval(checkForPatient, 2000);
