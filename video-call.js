const socket = io();

const localVideo =
    document.getElementById("localVideo");

const remoteVideo =
    document.getElementById("remoteVideo");

const statusText =
    document.getElementById("status");

const roleText =
    document.getElementById("role");

const otherRoleText =
    document.getElementById("otherRole");


/* =========================================
   GET ROLE + ROOM FROM URL
========================================= */

const params =
    new URLSearchParams(window.location.search);

const roomId =
    params.get("room") || "test-room";

const role =
    params.get("role") || "patient";


/* Display role */

if (role === "doctor") {

    roleText.innerText =
        "👨‍⚕️ Doctor";

    otherRoleText.innerText =
        "Patient";

}
else {

    roleText.innerText =
        "🧑 Patient";

    otherRoleText.innerText =
        "Doctor";

}


/* =========================================
   VARIABLES
========================================= */

let localStream;
let peerConnection;

const configuration = {

    iceServers: [
        {
            urls:
                "stun:stun.l.google.com:19302"
        }
    ]

};


/* =========================================
   START CALL
========================================= */

async function startCall() {

    try {

        localStream =
            await navigator.mediaDevices.getUserMedia({

                video: true,
                audio: true

            });

        localVideo.srcObject =
            localStream;

        statusText.innerText =
            "Camera and microphone ready";

        socket.emit(
            "join-room",
            roomId
        );

    }

    catch (error) {

        console.error(error);

        statusText.innerText =
            "Camera/microphone permission denied";

    }

}


/* =========================================
   CREATE PEER CONNECTION
========================================= */

function createPeerConnection() {

    peerConnection =
        new RTCPeerConnection(
            configuration
        );


    /* Add camera + microphone */

    localStream
        .getTracks()
        .forEach(track => {

            peerConnection.addTrack(
                track,
                localStream
            );

        });


    /* Receive other person's video */

    peerConnection.ontrack =
        event => {

            remoteVideo.srcObject =
                event.streams[0];

            statusText.innerText =
                "Connected 🎥";

        };


    /* ICE candidates */

    peerConnection.onicecandidate =
        event => {

            if (event.candidate) {

                socket.emit(
                    "ice-candidate",
                    {
                        roomId: roomId,
                        candidate:
                            event.candidate
                    }
                );

            }

        };

}


/* =========================================
   SOMEONE JOINED
========================================= */

socket.on(
    "user-joined",
    async () => {

        statusText.innerText =
            "Other participant joined...";

        createPeerConnection();


        const offer =
            await peerConnection
                .createOffer();


        await peerConnection
            .setLocalDescription(
                offer
            );


        socket.emit(
            "offer",
            {
                roomId: roomId,
                offer: offer
            }
        );

    }
);


/* =========================================
   RECEIVE OFFER
========================================= */

socket.on(
    "offer",
    async offer => {

        statusText.innerText =
            "Incoming call...";


        createPeerConnection();


        await peerConnection
            .setRemoteDescription(
                new RTCSessionDescription(
                    offer
                )
            );


        const answer =
            await peerConnection
                .createAnswer();


        await peerConnection
            .setLocalDescription(
                answer
            );


        socket.emit(
            "answer",
            {
                roomId: roomId,
                answer: answer
            }
        );

    }
);


/* =========================================
   RECEIVE ANSWER
========================================= */

socket.on(
    "answer",
    async answer => {

        await peerConnection
            .setRemoteDescription(
                new RTCSessionDescription(
                    answer
                )
            );

        statusText.innerText =
            "Connected 🎥";

    }
);


/* =========================================
   RECEIVE ICE
========================================= */

socket.on(
    "ice-candidate",
    async candidate => {

        try {

            if (peerConnection) {

                await peerConnection
                    .addIceCandidate(
                        new RTCIceCandidate(
                            candidate
                        )
                    );

            }

        }

        catch (error) {

            console.error(
                "ICE error:",
                error
            );

        }

    }
);


/* =========================================
   END CALL
========================================= */

function endCall() {

    if (localStream) {

        localStream
            .getTracks()
            .forEach(
                track =>
                    track.stop()
            );

    }

    if (peerConnection) {

        peerConnection.close();

    }

    localVideo.srcObject = null;

    remoteVideo.srcObject = null;

    statusText.innerText =
        "Call ended";

}
