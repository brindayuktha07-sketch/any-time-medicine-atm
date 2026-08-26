const consultationId =
    localStorage.getItem("consultationId");


const cancelBtn =
    document.getElementById("cancelBtn");


if (cancelBtn) {

    cancelBtn.addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                "consultationId"
            );

            localStorage.removeItem(
                "currentConsultation"
            );

            window.location.href =
                "patient.html";

        }
    );

}


/* =========================================
   CHECK CONSULTATION
========================================= */

async function checkConsultationStatus() {

    if (!consultationId) {

        console.error(
            "No consultation ID found."
        );

        return;

    }


    try {

        const response =
            await fetch(
                "/consultations"
            );


        const data =
            await response.json();


        const consultations =
            data.consultations || [];


        const consultation =
            consultations.find(
                c =>
                    String(c.id) ===
                    String(consultationId)
            );


        if (!consultation) {
            return;
        }


        /* =====================================
           DOCTOR ACCEPTED
        ===================================== */

        if (
            consultation.status ===
            "accepted"
        ) {

            localStorage.setItem(
                "currentConsultation",
                JSON.stringify(
                    consultation
                )
            );


            /*
             * IMPORTANT:
             * Use the REAL consultation ID.
             */

            window.location.href =
                `video-call.html?room=${consultation.id}&role=patient`;

        }

    } catch (error) {

        console.error(
            "Status check error:",
            error
        );

    }

}


checkConsultationStatus();


setInterval(
    checkConsultationStatus,
    2000
);
