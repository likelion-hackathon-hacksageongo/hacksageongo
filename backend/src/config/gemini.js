import { GoogleGenAI } from "@google/genai";
import { env } from "./env.js";

export const gemini = env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: env.GEMINI_API_KEY,
    })
  : null;
