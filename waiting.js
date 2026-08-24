const consultation =
    JSON.parse(
        localStorage.getItem("currentConsultation")
    );

const cancelBtn =
    document.getElementById("cancelBtn");


/* =========================================
   CANCEL CONSULTATION
========================================= */

cancelBtn.addEventListener(
    "click",
    function () {

        localStorage.removeItem(
            "currentConsultation"
        );

        localStorage.removeItem(
            "consultationId"
        );

        window.location.href =
            "patient-dashboard.html";

    }
);


/* =========================================
   CHECK IF DOCTOR ACCEPTED
========================================= */

async function checkConsultationStatus() {

    const consultationId =
        localStorage.getItem(
            "consultationId"
        );

    if (!consultationId) {
        return;
    }


    try {

        const response =
            await fetch("/consultations");

        const data =
            await response.json();

        const consultations =
            data.consultations || [];


        const current =
            consultations.find(
                consultation =>
                    consultation.id ==
                    consultationId
            );


        if (!current) {
            return;
        }


        /* Doctor accepted */

        if (
            current.status ===
            "accepted"
        ) {

            localStorage.setItem(
                "currentConsultation",
                JSON.stringify(current)
            );


            /*
             * Go directly to the
             * patient side of the video call.
             */

            window.location.href =
                `video-call.html?room=${current.id}&role=patient`;

        }

    }

    catch (error) {

        console.error(
            "Could not check consultation:",
            error
        );

    }

}


/* =========================================
   CHECK EVERY 2 SECONDS
========================================= */

checkConsultationStatus();

setInterval(
    checkConsultationStatus,
    2000
);
