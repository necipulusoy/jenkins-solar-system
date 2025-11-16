const path = require('path');
const fs = require('fs');
const express = require('express');
const OS = require('os');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const app = express();
const cors = require('cors');
const serverless = require('serverless-http');

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/')));
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    user: process.env.MONGO_USERNAME,
    pass: process.env.MONGO_PASSWORD,
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("MongoDB Connection Successful");
}).catch((err) => {
    console.log("MongoDB Connection Error: " + err);
});

// Schema & Model
var Schema = mongoose.Schema;

var dataSchema = new Schema({
    name: String,
    id: Number,
    description: String,
    image: String,
    velocity: String,
    distance: String
});

var planetModel = mongoose.model('planets', dataSchema);

// API: Get planet by ID (fixed for Mongoose v7)
app.post('/planet', async function(req, res) {
    try {
        const planetData = await planetModel.findOne({ id: req.body.id });

        if (!planetData) {
            return res.status(404).send("Planet not found");
        }

        res.send(planetData);

    } catch (err) {
        console.log("Error finding planet:", err);
        res.status(500).send("Error in Planet Data");
    }
});

// Main page
app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, '/', 'index.html'));
});

// API Docs
app.get('/api-docs', (req, res) => {
    fs.readFile('oas.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            res.status(500).send('Error reading file');
        } else {
            res.json(JSON.parse(data));
        }
    });
});

// OS Info
app.get('/os', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send({
        "os": OS.hostname(),
        "env": process.env.NODE_ENV
    });
});

// Liveness probe
app.get('/live', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send({ "status": "live" });
});

// Readiness probe
app.get('/ready', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send({ "status": "ready" });
});

// Server
app.listen(3000, () => {
    console.log("Server successfully running on port - 3000");
});

// Export for Unit Tests
module.exports = app;

// For serverless deployments
// module.exports.handler = serverless(app);
