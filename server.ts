import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini API implementation for dynamic story/dialogue
  const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  app.post("/api/cutscene", async (req, res) => {
    try {
      const { sceneContext, playerChoice } = req.body;
      const prompt = `
        You are writing dialogue for a gritty, mature 16-bit TMNT-inspired beat-em-up game called 'Shells in the Shadows'. 
        The tone is dark, urban, and industrial. 
        Context: ${sceneContext}
        Player Choice: ${playerChoice || 'None'}
        
        Write a brief interaction (max 3 lines) between a Turtle and a gritty NPC (e.g. a gang leader, a corrupt cop, or a mysterious contact).
        Include a moral consequence or a hint for the next level.
        Output as JSON: { "dialogue": [ { "name": "CHARACTER_NAME", "text": "DIALOGUE_TEXT" } ] }
      `;
      
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      const text = response.text || "";
      
      // Attempt to parse JSON from response
      const jsonMatch = text.match(/\{.*\}/s);
      if (jsonMatch) {
         res.json(JSON.parse(jsonMatch[0]));
      } else {
         res.json({ dialogue: [{ name: "Shadows", text: "..." }] });
      }
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: "Failed to generate story" });
    }
  });

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
