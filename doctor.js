async function loadConsultations() {

    try {

        const response =
            await fetch("/consultations");

        const data =
            await response.json();

        const consultations =
            data.consultations || [];

        const container =
            document.getElementById("consultations");

        if (!container) return;

        container.innerHTML = "";

        consultations
            .filter(c => c.status === "waiting")
            .forEach(consultation => {

                const card =
                    document.createElement("div");

                card.className = "consultation-card";

                card.innerHTML = `
                    <h3>${consultation.name}</h3>

                    <p>
                        Age: ${consultation.age}
                    </p>

                    <p>
                        Symptoms: ${consultation.symptoms}
                    </p>

                    <button
                        onclick="acceptConsultation(${consultation.id})">
                        Accept Consultation
                    </button>
                `;

                container.appendChild(card);

            });

    } catch (error) {

        console.error(
            "Could not load consultations:",
            error
        );

    }

}


async function acceptConsultation(id) {

    try {

        const response =
            await fetch(
                `/consultation/${id}/accept`,
                {
                    method: "POST"
                }
            );

        const data =
            await response.json();

        if (!data.success) {

            alert(
                data.message ||
                "Could not accept consultation."
            );

            return;

        }


        /*
         * IMPORTANT:
         * Use the REAL consultation ID
         * as the video-call room.
         */

        window.location.href =
            `video-call.html?room=${id}&role=doctor`;

    } catch (error) {

        console.error(error);

        alert(
            "Could not connect to server."
        );

    }

}


loadConsultations();

setInterval(
    loadConsultations,
    3000
);
