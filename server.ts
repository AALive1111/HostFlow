import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import bodyParser from "body-parser";
import admin from "firebase-admin";

// Initialize Firebase Admin
// Note: In this environment, we assume service account credentials or default auth is handled
// For simplicity, we'll try to initialize with default credentials or placeholder if not available
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// WhatsApp Webhook Verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// WhatsApp Webhook Receiver
app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object) {
    if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0].value.messages &&
      body.entry[0].changes[0].value.messages[0]
    ) {
      const message = body.entry[0].changes[0].value.messages[0];
      const from = message.from;
      const msgBody = message.text.body;
      
      console.log(`Incoming message from ${from}: ${msgBody}`);
      // AI Automation removed - Manual communication only
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// API to send WhatsApp message (Disabled - AI Automation removed)
app.post("/api/whatsapp/send", (req, res) => {
  res.status(403).json({ error: "WhatsApp AI automation is disabled." });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
