import { GoogleGenAI, Type } from "@google/genai";
import { MCQResponse } from "../types";

const apiKey = process.env.GEMINI_API_KEY;

export async function parseMCQs(text: string): Promise<MCQResponse> {
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Extract all multiple-choice questions (MCQs) from the following text and return them in a structured JSON format. 
            The text might be messy or unorganized. Identify questions, their options, the correct answer, and an explanation if available.
            
            Text to parse:
            ---
            ${text}
            ---`
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          mcqs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING, description: "The MCQ question text" },
                options: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "List of options (usually 4)"
                },
                correctAnswer: { type: Type.STRING, description: "The correct option text or label" },
                explanation: { type: Type.STRING, description: "Brief explanation of why the answer is correct" }
              },
              required: ["question", "options", "correctAnswer"]
            }
          }
        },
        required: ["mcqs"]
      }
    }
  });

  try {
    const result = JSON.parse(response.text || "{}");
    return result as MCQResponse;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Failed to parse the generated MCQ data.");
  }
}
