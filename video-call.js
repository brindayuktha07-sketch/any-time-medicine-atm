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
// PRESCRIPTION PANELS
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
// WEBRTC VARIABLES
// =========================================

let localStream = null;
let peerConnection = null;

let pendingIceCandidates = [];

let isCallStarted = false;


// =========================================
// STUN SERVER
// =========================================

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

    if (isCallStarted) {
        return;
    }

    isCallStarted = true;

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
            "Camera/microphone error:",
            error
        );

        isCallStarted = false;

        statusText.textContent =
            "Camera or microphone permission denied.";

    }

}


// =========================================
// CREATE PEER CONNECTION
// =========================================

function createPeerConnection() {

    if (peerConnection) {
        return peerConnection;
    }


    peerConnection =
        new RTCPeerConnection(
            configuration
        );


    // Add local camera + microphone

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


    // =====================================
    // RECEIVE REMOTE VIDEO
    // =====================================

    peerConnection.ontrack =
        event => {

            console.log(
                "REMOTE TRACK RECEIVED"
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


    // =====================================
    // SEND ICE CANDIDATES
    // =================================
