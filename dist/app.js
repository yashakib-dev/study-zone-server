"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion } = require("mongodb");
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const uri = process.env.MONGODB_URI || "";
app.use(cors());
app.use(express.json());
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});
let db = null;
async function connectToMongo() {
    if (!uri) {
        console.warn("MONGODB_URI is not set. Skipping database connection.");
        return;
    }
    try {
        await client.connect();
        db = client.db("studyZone");
        await client.db("admin").command({ ping: 1 });
        console.log("MongoDB connected successfully.");
    }
    catch (error) {
        console.error("MongoDB connection failed:", error);
    }
}
connectToMongo();
app.get("/", (_req, res) => {
    res.json({
        success: true,
        message: "Server is running!",
    });
});
app.get("/api/resources", async (_req, res) => {
    if (!db) {
        return res.status(503).json({
            success: false,
            message: "Database is not ready yet.",
        });
    }
    try {
        const resources = await db.collection("resources").find({}).toArray();
        return res.json({
            success: true,
            data: resources,
        });
    }
    catch (error) {
        console.error("Failed to fetch resources:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch resources",
        });
    }
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=app.js.map