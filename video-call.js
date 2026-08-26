const socket = io();

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const statusText = document.getElementById("status");
const roleText = document.getElementById("role");
const otherRoleText = document.getElementById("otherRole");

const params = new URLSearchParams(window.location.search);

const roomId = params.get("room") || "test123";
const role = params.get("role") || "patient";


// =====================================================
// ROLE
// =====================================================

if (role === "doctor") {

    roleText.textContent = "👨‍⚕️ Doctor";
    otherRoleText.textContent = "Patient";

} else {

    roleText.textContent = "🧑 Patient";
    otherRoleText.textContent = "Doctor";

}


// =====================================================
// PRESCRIPTION PANELS
// =====================================================

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


// =====================================================
// WEBRTC
// =====================================================

let localStream = null;
let peerConnection = null;

let pendingIceCandidates = [];

let callStarted = false;


const configuration = {

    iceServers: [

        {
            urls: "stun:stun.l.google.com:19302"
        }

    ]

};


// =====================================================
// START CALL
// =====================================================

async function startCall() {

    if (callStarted) {
        return;
    }

    callStarted = true;

    try {

        statusText.textContent =
            "Starting camera and microphone...";


        localStream =
            await navigator.mediaDevices.getUserMedia({

                video: true,
                audio: true

            });


        localVideo.srcObject =
            localStream;


        statusText.textContent =
            "Camera ready. Waiting for other participant...";


        socket.emit(
            "join-room",
            roomId
        );


        console.log(
            "Joined room:",
            roomId
        );


    } catch (error) {

        console.error(
            "Camera error:",
            error
        );

        callStarted = false;

        statusText.textContent =
            "Camera or microphone permission denied.";

    }

}


// =====================================================
// CREATE PEER CONNECTION
// =====================================================

function createPeerConnection() {

    if (peerConnection) {
        return peerConnection;
    }


    peerConnection =
        new RTCPeerConnection(
            configuration
        );


    // Add camera + microphone

    if (localStream) {

        localStream
            .getTracks()
            .forEach(track => {

                peerConnection.addTrack(
                    track,
                    localStream
                );

            });

    }


    // =================================================
    // RECEIVE OTHER PERSON'S VIDEO
    // =================================================

    peerConnection.ontrack =
        event => {

            console.log(
                "Remote video received"
            );


            if (
                event.streams &&
                event.streams.length > 0
            ) {

                remoteVideo.srcObject =
                    event.streams[0];


                statusText.textContent =
                    "Connected 🎥";

            }

        };


    // =================================================
    // SEND ICE CANDIDATES
    // =================================================

    peerConnection.onicecandidate =
        event => {

            if (event.candidate) {

                socket.emit(
                    "ice-candidate",
                    {

                        roomId:
                            roomId,

                        candidate:
                            event.candidate

                    }
                );

            }

        };


    // =================================================
    // CONNECTION STATUS
    // =================================================

    peerConnection.onconnectionstatechange =
        () => {

            if (!peerConnection) {
                return;
            }


            console.log(
                "WebRTC connection:",
                peerConnection.connectionState
            );


            if (
                peerConnection.connectionState ===
                "connected"
            ) {

                statusText.textContent =
                    "Connected 🎥";

            }


            if (
                peerConnection.connectionState ===
                "connecting"
            ) {

                statusText.textContent =
                    "Connecting to other participant...";

            }


            if (
                peerConnection.connectionState ===
                "disconnected"
            ) {

                statusText.textContent =
                    "Connection interrupted.";

            }


            if (
                peerConnection.connectionState ===
                "failed"
            ) {

                statusText.textContent =
                    "Video connection failed.";

            }

        };


    return peerConnection;

}


// =====================================================
// OTHER USER JOINED
// =====================================================

socket.on(
    "user-joined",
    async () => {

        console.log(
            "Other participant joined"
        );


        statusText.textContent =
            "Other participant joined. Connecting...";


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

                    roomId:
                        roomId,

                    offer:
                        offer

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


// =====================================================
// RECEIVE OFFER
// =====================================================

socket.on(
    "offer",
    async offer => {

        console.log(
            "Offer received"
        );


        createPeerConnection();


        try {

            await peerConnection.setRemoteDescription(
                new RTCSessionDescription(
                    offer
                )
            );


            // Add ICE candidates that arrived early

            for (
                const candidate
                of pendingIceCandidates
            ) {

                await peerConnection.addIceCandidate(
                    candidate
                );

            }


            pendingIceCandidates = [];


            const answer =
                await peerConnection.createAnswer();


            await peerConnection.setLocalDescription(
                answer
            );


            socket.emit(
                "answer",
                {

                    roomId:
                        roomId,

                    answer:
                        answer

                }
            );


        } catch (error) {

            console.error(
                "Offer handling error:",
                error
            );

        }

    }
);


// =====================================================
// RECEIVE ANSWER
// =====================================================

socket.on(
    "answer",
    async answer => {

        console.log(
            "Answer received"
        );


        try {

            await peerConnection.setRemoteDescription(
                new RTCSessionDescription(
                    answer
                )
            );


            // Add ICE candidates that arrived early

            for (
                const candidate
                of pendingIceCandidates
            ) {

                await peerConnection.addIceCandidate(
                    candidate
                );

            }


            pendingIceCandidates = [];


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


// =====================================================
// RECEIVE ICE CANDIDATE
// =====================================================

socket.on(
    "ice-candidate",
    async candidate => {

        try {

            const iceCandidate =
                new RTCIceCandidate(
                    candidate
                );


            /*
             * Sometimes ICE arrives before the
             * remote offer/answer.
             *
             * Store it until remoteDescription
             * exists instead of throwing it away.
             */

            if (
                peerConnection &&
                peerConnection.remoteDescription
            ) {

                await peerConnection.addIceCandidate(
                    iceCandidate
                );

            } else {

                pendingIceCandidates.push(
                    iceCandidate
                );

            }

        } catch (error) {

            console.error(
                "ICE candidate error:",
                error
            );

        }

    }
);


// =====================================================
// ADD MEDICINE
// =====================================================

function addMedicine() {

    const medicineList =
        document.getElementById(
            "medicineList"
        );


    const medicine =
        document.createElement("div");


    medicine.className =
        "medicine";


    medicine.innerHTML = `

        <input
            class="medicineName"
            type="text"
            placeholder="Medicine name"
        >

        <input
            class="medicineDosage"
            type="text"
            placeholder="Dosage (e.g. 500 mg)"
        >

        <input
            class="medicineQuantity"
            type="number"
            placeholder="Quantity"
            min="1"
        >

        <input
            class="medicineInstructions"
            type="text"
            placeholder="Instructions"
        >

    `;


    medicineList.appendChild(
        medicine
    );

}


// =====================================================
// SAVE PRESCRIPTION
// =====================================================

async function savePrescription() {

    if (role !== "doctor") {
        return;
    }


    const rows =
        document.querySelectorAll(
            ".medicine"
        );


    const prescription = [];


    rows.forEach(
        row => {

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

                    name:
                        name,

                    dosage:
                        dosage,

                    quantity:
                        Number(quantity) || 0,

                    instructions:
                        instructions

                });

            }

        }
    );


    if (
        prescription.length === 0
    ) {

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

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            prescription:
                                prescription

                        })

                }
            );


        const data =
            await response.json();


        if (!data.success) {

            alert(
                data.message ||
                "Could not save prescription."
            );

            return;

        }


        alert(
            "✅ Prescription saved successfully!"
        );


    } catch (error) {

        console.error(
            "Prescription error:",
            error
        );


        alert(
            "Could not connect to the server."
        );

    }

}


// =====================================================
// PATIENT CHECKS FOR PRESCRIPTION
// =====================================================

async function checkPrescription() {

    if (role !== "patient") {
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
                consultation =>
                    consultation.id ==
                    roomId
            );


        if (!consultation) {
            return;
        }


        if (
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


// =====================================================
// DISPLAY PRESCRIPTION TO PATIENT
// =====================================================

function displayPrescription(
    prescription
) {

    const list =
        document.getElementById(
            "prescriptionList"
        );


    if (!list) {
        return;
    }


    list.innerHTML = "";


    prescription.forEach(
        medicine => {

            const card =
                document.createElement(
                    "div"
                );


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


            list.appendChild(
                card
            );

        }
    );

}


// =====================================================
// PATIENT → DISPENSE MEDICINES
// =====================================================

async function dispenseMedicines() {

    if (role !== "patient") {
        return;
    }


    try {

        const response =
            await fetch(
                `/consultation/${roomId}/dispense`,
                {

                    method:
                        "POST"

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

        console.error(
            "Dispensing error:",
            error
        );


        alert(
            "Could not connect to the ATM server."
        );

    }

}


// =====================================================
// PATIENT CHECKS EVERY 2 SECONDS
// =====================================================

if (role === "patient") {

    checkPrescription();


    setInterval(
        checkPrescription,
        2000
    );

}


// =====================================================
// END CALL
// =====================================================

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


    callStarted = false;


    statusText.textContent =
        "Call ended.";

}


// =====================================================
// MAKE FUNCTIONS AVAILABLE TO HTML
// =====================================================

window.startCall =
    startCall;

window.endCall =
    endCall;

window.addMedicine =
    addMedicine;

window.savePrescription =
    savePrescription;

window.dispenseMedicines =
    dispenseMedicines;
