const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Serve the website files from this folder
app.use(express.static(__dirname));

// Store active consultations while server is running
let consultations = [];


/* =========================================
   HOME
========================================= */

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});


/* =========================================
   PATIENT → SEND CONSULTATION
========================================= */

app.post("/consultation", (req, res) => {

    const consultation = {
        id: Date.now(),

        name: req.body.name,
        age: req.body.age,

        symptoms: req.body.symptoms,
        medications: req.body.medications,
        allergies: req.body.allergies,

        vitals: {
            temperature: req.body.vitals?.temperature || "",
            heartRate: req.body.vitals?.heartRate || "",
            spo2: req.body.vitals?.spo2 || "",
            bloodPressure: req.body.vitals?.bloodPressure || ""
        },

        status: "waiting",

        createdAt: new Date().toISOString()
    };

    consultations.push(consultation);

    console.log(
        `New consultation from ${consultation.name}`
    );

    res.json({
        success: true,
        consultation: consultation
    });
});


/* =========================================
   DOCTOR → GET CONSULTATIONS
========================================= */

app.get("/consultations", (req, res) => {

    res.json({
        success: true,
        consultations: consultations
    });

});


/* =========================================
   DOCTOR → ACCEPT CONSULTATION
========================================= */

app.post("/consultation/:id/accept", (req, res) => {

    const consultation = consultations.find(
        c => c.id == req.params.id
    );

    if (!consultation) {

        return res.status(404).json({
            success: false,
            message: "Consultation not found"
        });

    }

    consultation.status = "accepted";

    console.log(
        `Consultation ${consultation.id} accepted`
    );

    res.json({
        success: true,
        consultation: consultation
    });

});


/* =========================================
   SERVER
========================================= */

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {

    console.log(
        `Any Time Medicine ATM server running on port ${PORT}`
    );

});
