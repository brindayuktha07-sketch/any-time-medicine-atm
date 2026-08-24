const socket = io();

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const statusText = document.getElementById("status");

let localStream;
let peerConnection;

const roomId =
    new URLSearchParams(window.location.search)
        .get("room") || "test-room";

const configuration = {

    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]

};


/* =========================================
   START CAMERA + MICROPHONE
========================================= */

async function startCall() {

    try {

        localStream =
            await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

        localVideo.srcObject = localStream;

        statusText.innerText =
            "Camera and microphone ready";

        socket.emit("join-room", roomId);

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
        new RTCPeerConnection(configuration);


    // Add our camera + microphone
    localStream.getTracks().forEach(track => {

        peerConnection.addTrack(
            track,
            localStream
        );

    });


    // Receive other person's video
    peerConnection.ontrack = event => {

        remoteVideo.srcObject =
            event.streams[0];

    };


    // ICE candidates
    peerConnection.onicecandidate = event => {

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

}


/* =========================================
   SOMEONE JOINED
========================================= */

socket.on("user-joined", async () => {

    statusText.innerText =
        "Doctor / Patient joined. Connecting...";

    createPeerConnection();


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

});


/* =========================================
   RECEIVE OFFER
========================================= */

socket.on("offer", async offer => {

    statusText.innerText =
        "Incoming video call...";

    createPeerConnection();


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

});


/* =========================================
   RECEIVE ANSWER
========================================= */

socket.on("answer", async answer => {

    await peerConnection.setRemoteDescription(
        new RTCSessionDescription(answer)
    );

    statusText.innerText =
        "Connected 🎥";

});


/* =========================================
   RECEIVE ICE CANDIDATE
========================================= */

socket.on(
    "ice-candidate",
    async candidate => {

        try {

            if (peerConnection) {

                await peerConnection.addIceCandidate(
                    new RTCIceCandidate(candidate)
                );

            }

        }

        catch (error) {

            console.error(
                "ICE candidate error:",
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
            .forEach(track => track.stop());

    }

    if (peerConnection) {

        peerConnection.close();

    }

    localVideo.srcObject = null;
    remoteVideo.srcObject = null;

    statusText.innerText =
        "Call ended";

}
