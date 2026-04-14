require('dotenv').config();
const { GoogleGenAI, Type } = require('@google/genai');

async function test() {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const responseSchema = {
          type: Type.OBJECT,
          properties: {
            dailyCalories: { type: Type.INTEGER, description: "Total daily target calories" }
          },
          required: ["dailyCalories"]
        };

        const response = await ai.models.generateContent({
model: 'gemini-2.5-pro-latest', 
// or for the Flash version (faster/cheaper):
model: 'gemini-3-flash',          contents: "tell me a calorie count",
          config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
          }
        });
        console.log(response.text());
    } catch (e) {
        console.error("SDK Error:", e.name, e.message);
        console.error(e);
    }
}
test();
