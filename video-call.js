const socket = io();

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const statusText = document.getElementById("status");
const roleText = document.getElementById("role");
const otherRoleText = document.getElementById("otherRole");

const params = new URLSearchParams(window.location.search);

const roomId = params.get("room") || "test-room";
const role = params.get("role") || "patient";


if (role === "doctor") {

    roleText.textContent = "👨‍⚕️ Doctor";
    otherRoleText.textContent = "Patient";

} else {

    roleText.textContent = "🧑 Patient";
    otherRoleText.textContent = "Doctor";

}


let localStream = null;
let peerConnection = null;


const configuration = {

    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]

};


async function startCall() {

    try {

        localStream =
            await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

        localVideo.srcObject = localStream;

        statusText.textContent =
            "Camera ready. Waiting for other participant...";

        socket.emit("join-room", roomId);

    }

    catch (error) {

        console.error(error);

        statusText.textContent =
            "Camera or microphone permission denied.";

    }

}


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

}


socket.on(
    "user-joined",
    async () => {

        statusText.textContent =
            "Other participant joined. Connecting...";

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

    }
);


socket.on(
    "offer",
    async offer => {

        statusText.textContent =
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

    }
);


socket.on(
    "answer",
    async answer => {

        await peerConnection.setRemoteDescription(
            new RTCSessionDescription(answer)
        );

        statusText.textContent =
            "Connected 🎥";

    }
);


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

    statusText.textContent =
        "Call ended";

}


window.startCall = startCall;
window.endCall = endCall;
