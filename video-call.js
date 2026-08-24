const socket = io();

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const statusText = document.getElementById("status");
const roleText = document.getElementById("role");
const otherRoleText = document.getElementById("otherRole");

const params = new URLSearchParams(window.location.search);

const roomId = params.get("room") || "test-room";
const role = params.get("role") || "patient";


// =========================================
// ROLE
// =========================================

if (role === "doctor") {

    roleText.textContent = "👨‍⚕️ Doctor";
    otherRoleText.textContent = "Patient";

} else {

    roleText.textContent = "🧑 Patient";
    otherRoleText.textContent = "Doctor";

}


// =========================================
// SHOW CORRECT PRESCRIPTION PANEL
// =========================================

const doctorPrescription =
    document.getElementById("doctorPrescription");

const patientPrescription =
    document.getElementById("patientPrescription");


if (role === "doctor") {

    doctorPrescription.style.display = "block";
    patientPrescription.style.display = "none";

} else {

    doctorPrescription.style.display = "none";
    patientPrescription.style.display = "block";

}


// =========================================
// WEBRTC
// =========================================

let localStream = null;
let peerConnection = null;

const configuration = {

    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]

};


// =========================================
// START CALL
// =========================================

async function startCall() {

    try {

        statusText.textContent =
            "Requesting camera and microphone...";

        localStream =
            await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

        localVideo.srcObject = localStream;

        statusText.textContent =
            "Camera ready. Waiting for other participant...";

        socket.emit("join-room", roomId);

    } catch (error) {

        console.error(error);

        statusText.textContent =
            "Camera or microphone permission denied.";

    }

}


// =========================================
// PEER CONNECTION
// =========================================

function createPeerConnection() {

    if (peerConnection) {
        return;
    }

    peerConnection =
        new RTCPeerConnection(configuration);


    localStream
        .getTracks()
        .forEach(track => {

            peerConnection.addTrack(
                track,
                localStream
            );

        });


    peerConnection.ontrack = event => {

        if (event.streams && event.streams[0]) {

            remoteVideo.srcObject =
                event.streams[0];

            statusText.textContent =
                "Connected 🎥";

        }

    };


    peerConnection.onicecandidate =
        event => {

            if (event.candidate) {

                socket.emit(
                    "ice-candidate",
                    {
                        roomId: roomId,
                        candidate: event.candidate
                    }
                );

            }

        };


    peerConnection.onconnectionstatechange =
        () => {

            console.log(
                "Connection:",
                peerConnection.connectionState
            );

            if (
                peerConnection.connectionState ===
                "connected"
            ) {

                statusText.textContent =
                    "Connected 🎥";

            }

        };

}


// =========================================
// OTHER USER JOINED
// =========================================

socket.on(
    "user-joined",
    async () => {

        createPeerConnection();

        try {

            const offer =
                await peerConnection.createOffer();

            await peerConnection.setLocalDescription(
                offer
            );

            socket.emit(
                "offer",
                {
                    roomId: roomId,
                    offer: offer
                }
            );

        } catch (error) {

            console.error(
                "Offer error:",
                error
            );

        }

    }
);


// =========================================
// RECEIVE OFFER
// =========================================

socket.on(
    "offer",
    async offer => {

        createPeerConnection();

        try {

            await peerConnection.setRemoteDescription(
                new RTCSessionDescription(offer)
            );

            const answer =
                await peerConnection.createAnswer();

            await peerConnection.setLocalDescription(
                answer
            );

            socket.emit(
                "answer",
                {
                    roomId: roomId,
                    answer: answer
                }
            );

        } catch (error) {

            console.error(
                "Answer error:",
                error
            );

        }

    }
);


// =========================================
// RECEIVE ANSWER
// =========================================

socket.on(
    "answer",
    async answer => {

        try {

            await peerConnection.setRemoteDescription(
                new RTCSessionDescription(answer)
            );

            statusText.textContent =
                "Connected 🎥";

        } catch (error) {

            console.error(
                "Answer error:",
                error
            );

        }

    }
);


// =========================================
// ICE CANDIDATES
// =========================================

socket.on(
    "ice-candidate",
    async candidate => {

        try {

            if (
                peerConnection &&
                peerConnection.remoteDescription
            ) {

                await peerConnection.addIceCandidate(
                    new RTCIceCandidate(candidate)
                );

            }

        } catch (error) {

            console.error(
                "ICE error:",
                error
            );

        }

    }
);


// =========================================
// ADD MEDICINE
// =========================================

function addMedicine() {

    const medicineList =
        document.getElementById("medicineList");

    const row =
        document.createElement("div");

    row.className =
        "medicine-row";

    row.innerHTML = `

        <input
            type="text"
            class="medicineName"
            placeholder="Medicine name">

        <input
            type="text"
            class="medicineDosage"
            placeholder="Dosage (e.g. 500 mg)">

        <input
            type="number"
            class="medicineQuantity"
            placeholder="Quantity">

        <input
            type="text"
            class="medicineInstructions"
            placeholder="Instructions">

    `;

    medicineList.appendChild(row);

}


// =========================================
// SAVE PRESCRIPTION
// =========================================

async function savePrescription() {

    if (role !== "doctor") {
        return;
    }

    const rows =
        document.querySelectorAll(
            ".medicine-row"
        );

    const prescription = [];


    rows.forEach(row => {

        const name =
            row.querySelector(
                ".medicineName"
            ).value.trim();

        const dosage =
            row.querySelector(
                ".medicineDosage"
            ).value.trim();

        const quantity =
            row.querySelector(
                ".medicineQuantity"
            ).value;

        const instructions =
            row.querySelector(
                ".medicineInstructions"
            ).value.trim();


        if (name) {

            prescription.push({

                name: name,

                dosage: dosage,

                quantity:
                    Number(quantity) || 0,

                instructions:
                    instructions

            });

        }

    });


    if (prescription.length === 0) {

        alert(
            "Please add at least one medicine."
        );

        return;

    }


    try {

        const response =
            await fetch(
                `/consultation/${roomId}/prescription`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        prescription:
                            prescription
                    })
                }
            );


        const data =
            await response.json();


        if (!data.success) {

            alert(
                "Could not save prescription."
            );

            return;

        }


        alert(
            "Prescription saved successfully."
        );


    } catch (error) {

        console.error(error);

        alert(
            "Could not connect to server."
        );

    }

}


// =========================================
// PATIENT CHECKS PRESCRIPTION
// =========================================

async function checkPrescription() {

    if (role !== "patient") {
        return;
    }


    try {

        const response =
            await fetch("/consultations");

        const data =
            await response.json();

        const consultations =
            data.consultations || [];


        const consultation =
            consultations.find(
                c =>
                    c.id == roomId
            );


        if (
            !consultation ||
            !consultation.prescription ||
            consultation.prescription.length === 0
        ) {

            return;

        }


        displayPrescription(
            consultation.prescription
        );


    } catch (error) {

        console.error(
            "Prescription check error:",
            error
        );

    }

}


// =========================================
// DISPLAY PRESCRIPTION
// =========================================

function displayPrescription(
    prescription
) {

    const list =
        document.getElementById(
            "prescriptionList"
        );


    list.innerHTML = "";


    prescription.forEach(
        medicine => {

            const card =
                document.createElement("div");

            card.className =
                "medicine-card";


            card.innerHTML = `

                <strong>
                    ${medicine.name}
                </strong>

                <br><br>

                <b>Dosage:</b>
                ${medicine.dosage || "Not specified"}

                <br>

                <b>Quantity:</b>
                ${medicine.quantity}

                <br>

                <b>Instructions:</b>
                ${medicine.instructions || "None"}

            `;


            list.appendChild(card);

        }
    );

}


// =========================================
// DISPENSE MEDICINES
// =========================================

async function dispenseMedicines() {

    if (role !== "patient") {
        return;
    }


    try {

        const response =
            await fetch(
                `/consultation/${roomId}/dispense`,
                {
                    method: "POST"
                }
            );


        const data =
            await response.json();


        if (!data.success) {

            alert(
                data.message ||
                "Could not request dispensing."
            );

            return;

        }


        alert(
            "✅ Dispensing request sent to the ATM!"
        );


    } catch (error) {

        console.error(error);

        alert(
            "Could not connect to the ATM server."
        );

    }

}


// =========================================
// CHECK PRESCRIPTION EVERY 2 SECONDS
// =========================================

if (role === "patient") {

    setInterval(
        checkPrescription,
        2000
    );

}


// =========================================
// END CALL
// =========================================

function endCall() {

    if (localStream) {

        localStream
            .getTracks()
            .forEach(
                track => track.stop()
            );

        localStream = null;
    }


    if (peerConnection) {

        peerConnection.close();

        peerConnection = null;
    }


    localVideo.srcObject = null;

    remoteVideo.srcObject = null;

    statusText.textContent =
        "Call ended.";

}


window.startCall = startCall;
window.endCall = endCall;
window.addMedicine = addMedicine;
window.savePrescription = savePrescription;
window.dispenseMedicines = dispenseMedicines;
