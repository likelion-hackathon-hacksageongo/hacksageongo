import { gemini } from "../../config/gemini.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/AppError.js";

export async function generateText(prompt) {
  if (!gemini) {
    throw new AppError(
      500,
      "GEMINI_CLIENT_NOT_CONFIGURED",
      "Gemini API key is not configured.",
    );
  }

  try {
    const response = await gemini.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error(error);

    throw new AppError(
      502,
      "AI_PROVIDER_ERROR",
      "Failed to generate response from Gemini.",
    );
  }
}
