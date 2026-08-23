const doctorName = localStorage.getItem("doctorName");

document.getElementById("doctorName").textContent =
    doctorName || "Doctor";

const patientRequest =
    document.getElementById("patientRequest");


async function checkForPatient() {

    try {

        const response = await fetch("/consultations");

        const data = await response.json();

        if (!data.success || data.consultations.length === 0) {

            patientRequest.innerHTML = `
                <div class="empty-state">
                    <h3>No patients waiting</h3>
                    <p>New consultation requests will appear here.</p>
                </div>
            `;

            return;
        }


        // Get the first waiting patient
        const consultation =
            data.consultations.find(
                c => c.status === "waiting"
            );


        if (!consultation) {

            patientRequest.innerHTML = `
                <div class="empty-state">
                    <h3>No patients waiting</h3>
                    <p>New consultation requests will appear here.</p>
                </div>
            `;

            return;
        }


        patientRequest.innerHTML = `

            <div class="patient-request-card">

                <div class="request-header">

                    <div>
                        <span class="request-label">
                            NEW CONSULTATION
                        </span>

                        <h3>
                            Patient Request
                        </h3>
                    </div>

                    <span class="status-badge">
                        Waiting
                    </span>

                </div>


                <div class="patient-info">

                    <div>
                        <span>Patient</span>

                        <strong>
                            ${consultation.name}
                        </strong>
                    </div>


                    <div>
                        <span>Age</span>

                        <strong>
                            ${consultation.age}
                        </strong>
                    </div>

                </div>


                <div class="medical-section">

                    <h4>Symptoms</h4>

                    <p>
                        ${consultation.symptoms}
                    </p>

                </div>


                <div class="medical-section">

                    <h4>Current Medications</h4>

                    <p>
                        ${consultation.medications || "None reported"}
                    </p>

                </div>


                <div class="medical-section">

                    <h4>Allergies</h4>

                    <p>
                        ${consultation.allergies || "None reported"}
                    </p>

                </div>


                <div class="medical-section">

                    <h4>Basic Vitals</h4>

                    <div class="vitals-grid">

                        <div>
                            <span>Temperature</span>
                            <strong>
                                ${consultation.vitals.temperature || "—"} °C
                            </strong>
                        </div>


                        <div>
                            <span>Heart Rate</span>
                            <strong>
                                ${consultation.vitals.heartRate || "—"} BPM
                            </strong>
                        </div>


                        <div>
                            <span>SpO₂</span>
                            <strong>
                                ${consultation.vitals.spo2 || "—"} %
                            </strong>
                        </div>


                        <div>
                            <span>Blood Pressure</span>
                            <strong>
                                ${consultation.vitals.bloodPressure || "—"}
                            </strong>
                        </div>

                    </div>

                </div>


                <button id="acceptBtn" class="accept-button">
                    Accept & Start Consultation
                </button>

            </div>
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

                    const result = await response.json();


                    if (result.success) {

                        localStorage.setItem(
                            "consultationStatus",
                            "accepted"
                        );

                        localStorage.setItem(
                            "activeConsultationId",
                            consultation.id
                        );


                        window.location.href =
                            "video-call.html";

                    } else {

                        alert(
                            result.message ||
                            "Could not accept consultation."
                        );

                    }

                } catch (error) {

                    console.error(error);

                    alert(
                        "Cannot connect to the server."
                    );

                }

            });


    } catch (error) {

        console.error(error);

        patientRequest.innerHTML = `
            <div class="empty-state">
                <h3>Unable to connect</h3>
                <p>
                    Please check that the ATM server is running.
                </p>
            </div>
        `;

    }

}


// Check immediately
checkForPatient();


// Check for new patients every 2 seconds
setInterval(checkForPatient, 2000);