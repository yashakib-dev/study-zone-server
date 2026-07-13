const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
import type { Request, Response } from "express";

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

let db: any = null;

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
  } catch (error) {
    console.error("MongoDB connection failed:", error);
  }
}

connectToMongo();

app.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Server is running!",
  });
});

app.get("/api/resources", async (_req: Request, res: Response) => {
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
  } catch (error) {
    console.error("Failed to fetch resources:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch resources",
    });
  }
});

app.get("/api/resources/:id", async (req: Request, res: Response) => {
  if (!db) {
    return res.status(503).json({
      success: false,
      message: "Database is not ready yet.",
    });
  }

  try {
    const id = req.params.id;
    let query = {};

    try {
      query = { _id: new ObjectId(id) };
    } catch {
      // Fallback if not a valid ObjectId (could be a string id in some legacy data)
      query = { id: id };
    }

    const resource = await db.collection("resources").findOne(query);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    return res.json({
      success: true,
      data: resource,
    });
  } catch (error) {
    console.error("Failed to fetch resource:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch resource details",
    });
  }
});

app.post("/api/resources", async (req: Request, res: Response) => {
  if (!db) {
    return res.status(503).json({ success: false, message: "Database is not ready yet." });
  }
  try {
    const body = req.body;
    const doc = {
      ...body,
      createdAt: new Date(),
    };
    const result = await db.collection("resources").insertOne(doc);
    return res.status(201).json({ success: true, data: { _id: result.insertedId, ...doc } });
  } catch (error) {
    console.error("Failed to create resource:", error);
    return res.status(500).json({ success: false, message: "Failed to create resource" });
  }
});

app.put("/api/resources/:id", async (req: Request, res: Response) => {
  if (!db) {
    return res.status(503).json({ success: false, message: "Database is not ready yet." });
  }
  try {
    const id = req.params.id;
    const body = req.body;
    delete body._id;
    const result = await db
      .collection("resources")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: body },
        { returnDocument: "after" }
      );
    if (!result) {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to update resource:", error);
    return res.status(500).json({ success: false, message: "Failed to update resource" });
  }
});

app.delete("/api/resources/:id", async (req: Request, res: Response) => {
  if (!db) {
    return res.status(503).json({ success: false, message: "Database is not ready yet." });
  }
  try {
    const id = req.params.id;
    const result = await db.collection("resources").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }
    return res.json({ success: true, message: "Resource deleted successfully" });
  } catch (error) {
    console.error("Failed to delete resource:", error);
    return res.status(500).json({ success: false, message: "Failed to delete resource" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});