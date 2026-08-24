const socket = io();

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const statusText = document.getElementById("status");
const roleText = document.getElementById("role");
const otherRoleText = document.getElementById("otherRole");


// =========================================
// GET ROOM + ROLE
// =========================================

const params = new URLSearchParams(window.location.search);

const roomId = params.get("room") || "test-room";
const role = params.get("role") || "patient";


// =========================================
// DISPLAY ROLE
// =========================================

if (role === "doctor") {

    roleText.textContent = "👨‍⚕️ Doctor";
    otherRoleText.textContent = "Patient";

} else {

    roleText.textContent = "🧑 Patient";
    otherRoleText.textContent = "Doctor";

}


// =========================================
// WEBRTC
// =========================================

let localStream = null;
let peerConnection = null;

let isCaller = false;

const configuration = {

    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]

};


// =========================================
// START CAMERA
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

        // Join the room
        socket.emit("join-room", roomId);

    } catch (error) {

        console.error(
            "Camera error:",
            error
        );

        statusText.textContent =
            "Camera or microphone permission denied.";

    }

}


// =========================================
// CREATE PEER CONNECTION
// =========================================

function createPeerConnection() {

    if (peerConnection) {
        return;
    }

    peerConnection =
        new RTCPeerConnection(
            configuration
        );


    // Add local tracks
    localStream
        .getTracks()
        .forEach(track => {

            peerConnection.addTrack(
                track,
                localStream
            );

        });


    // Receive remote video/audio
    peerConnection.ontrack =
        event => {

            console.log(
                "Remote track received"
            );

            if (
                event.streams &&
                event.streams[0]
            ) {

                remoteVideo.srcObject =
                    event.streams[0];

                statusText.textContent =
                    "Connected 🎥";

            }

        };


    // ICE candidates
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


    // Connection status
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
                    "Connection failed.";

            }

        };

}


// =========================================
// SERVER SAYS ANOTHER USER JOINED
// =========================================

socket.on(
    "user-joined",
    async () => {

        console.log(
            "Other participant joined"
        );

        statusText.textContent =
            "Other participant joined. Connecting...";

        isCaller = true;

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

        console.log(
            "Offer received"
        );

        statusText.textContent =
            "Incoming video call...";

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

        console.log(
            "Answer received"
        );

        try {

            await peerConnection.setRemoteDescription(
                new RTCSessionDescription(answer)
            );

            statusText.textContent =
                "Connected 🎥";

        } catch (error) {

            console.error(
                "Answer connection error:",
                error
            );

        }

    }
);


// =========================================
// RECEIVE ICE CANDIDATE
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
                "ICE candidate error:",
                error
            );

        }

    }
);


// =========================================
// END CALL
// =========================================

function endCall() {

    if (localStream) {

        localStream
            .getTracks()
            .forEach(track => {
                track.stop();
            });

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


// Make functions available to HTML buttons
window.startCall = startCall;
window.endCall = endCall;
