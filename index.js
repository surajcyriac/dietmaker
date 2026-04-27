require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 3, // Limit each IP to 3 requests per `window` (here, per minute)
  message: { error: "You have exceeded the 3 requests per minute limit. Please try again soon." },
  standardHeaders: true,
  legacyHeaders: false,
});

const MOCK_API_KEY = "NO_API_KEY_PROVIDED"; 

// Initialize OpenAI client pointing to OpenRouter
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.GEMINI_API_KEY, // Reusing your existing .env variable name
});

app.post('/finddiet', apiLimiter, async (req, res) => {
  try {
    const formData = req.body;
    
    // Safety check
    const currentKey = process.env.GEMINI_API_KEY;
    if (!currentKey || currentKey === MOCK_API_KEY || currentKey === 'YOUR_API_KEY_HERE') {
       console.warn("WARNING: No valid API Key found. Using fallback response.");
       return res.status(200).json({
          dailyCalories: 2500,
          protein: 180,
          carbs: 280,
          fats: 75,
          meals: [
            {
              name: "Error - API Key Missing",
              time: "Now",
              calories: 0,
              items: [
                { food: "Please configure your API KEY in backend .env to get real AI responses.", weight: 0, protein: 0, carbs: 0, fats: 0 }
              ]
            }
          ]
       });
    }

    const prompt = `
      You are an expert AI nutritionist. Formulate a personalized daily diet plan based on the following user details:
      Gender: ${formData.gender || 'Not specified'}
      Age: ${formData.age || 'Not specified'}
      Height: ${formData.height || 'Not specified'} cm
      Weight: ${formData.weight || 'Not specified'} kg
      Body Type: ${formData.bodyType || 'Not specified'}
      Activity Level: ${formData.activityLevel || 'Not specified'}
      
      Goal: ${formData.goal || 'Not specified'}
      Calorie Delta: ${formData.calorieDelta || 'Not specified'} % (adjust maintenance calories by this percentage)
      Macro Preference: ${formData.macroPreference || 'Not specified'}
      Meal Frequency: ${formData.mealFrequency || 3} meals a day
      
      Region/Country: ${formData.country || 'Not specified'}
      State: ${formData.state || 'Not specified'}
      Dietary Preferences: ${formData.dietaryPreferences?.join(', ') || 'None'}
      
      Food Pool (preferred foods): ${formData.foodPool || 'Not specified'}
      
      Please return a highly structured diet plan fulfilling these requirements. You MUST ONLY return a raw JSON object string with no markdown formatting. The output JSON schema must strictly match this format exactly:
      {
        "dailyCalories": integer,
        "protein": integer,
        "carbs": integer,
        "fats": integer,
        "meals": [
          {
            "name": "string",
            "time": "string",
            "calories": integer,
            "items": [
              {
                "food": "string",
                "weight": integer,
                "protein": integer,
                "carbs": integer,
                "fats": integer
              }
            ]
          }
        ]
      }
    `;

   const modelName = 'openrouter/free'; // OpenRouter Free Tier string

    const response = await openai.chat.completions.create({
      model: "openrouter/free",
      messages: [
        { role: "system", content: "You are a specialized AI designed entirely to strictly output valid JSON objects based on instructions. No conversational text." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const outputJsonString = response.choices[0].message.content;
    const dietPlan = JSON.parse(outputJsonString);
    
    res.status(200).json(dietPlan);
  } catch (error) {
    console.error("Error generating diet:", error);
    res.status(500).json({ error: "API Error: " + (error.message || "Failed to generate diet using AI.") });
  }
});

app.post('/generateworkout', apiLimiter, async (req, res) => {
  try {
    const formData = req.body;
    
    // Safety check
    const currentKey = process.env.GEMINI_API_KEY;
    if (!currentKey || currentKey === MOCK_API_KEY || currentKey === 'YOUR_API_KEY_HERE') {
       console.warn("WARNING: No valid API Key found. Using fallback response.");
       return res.status(200).json({
          workout_plan: {
            theme: "gym",
            color_scheme: { mode: "dark", primary: "#FF4D4D", secondary: "#121212", accent: "#FFA726", text: "#FFFFFF" },
            goal: "Error - No API Key",
            experience_level: "N/A",
            days_per_week: "0",
            session_duration: "0",
            split_type: "Error",
            weekly_plan: [
              {
                day: "Day 1",
                focus: "Configuration Issue",
                estimated_duration: "0",
                exercises: [{ name: "Please configure your API KEY in backend .env to get real AI responses.", sets: "0", reps: "0", rest_seconds: "0", muscle_group: "None", type: "isolation", video_query: "how to get openrouter api key" }],
                cardio: { included: false, type: "", intensity: "low", duration_minutes: "0", notes: "" }
              }
            ]
          }
       });
    }

    const prompt = `
      You are an expert Strength & Conditioning Coach.
      Generate a STRUCTURED, SAFE, and PRACTICAL gym workout plan based on these user inputs:
      Goal: ${formData.goal || 'Not specified'}
      Gym Experience: ${formData.experienceLevel || 'Not specified'}
      Days per Week: ${formData.daysPerWeek || 'Not specified'}
      Cardio Preference: ${formData.cardioPreference || 'No cardio'}
      
      CORE LOGIC RULES:
      1. CRITICAL: If the goal is "Strength", make sure the user gets dedicated rest days instead of continuous high-intensity training programs! Do not over-train. Rest days are marked by no exercises and optional light cardio.
      2. Time-based: Assume 60 min session. Focus on Compound movements first, Isolation after.
      3. Balance & Structure: Avoid imbalanced splits, ensure major muscle groups are covered logically.
      4. UI Context: Return dark theme with strong red/orange accents.
      
      Return ONLY valid JSON. No explanations.
      The output JSON schema must strictly match this format exactly:
      {
        "workout_plan": {
          "theme": "gym",
          "color_scheme": {
            "mode": "dark",
            "primary": "#FF4D4D",
            "secondary": "#121212",
            "accent": "#FFA726",
            "text": "#FFFFFF"
          },
          "goal": "string",
          "experience_level": "string",
          "days_per_week": "string",
          "session_duration": "60",
          "split_type": "string",
          "weekly_plan": [
            {
              "day": "Day 1",
              "focus": "string",
              "estimated_duration": "60",
              "exercises": [
                {
                  "name": "string",
                  "sets": "string",
                  "reps": "string",
                  "rest_seconds": "string",
                  "muscle_group": "string",
                  "type": "compound | isolation",
                  "video_query": "string"
                }
              ],
              "cardio": {
                "included": boolean,
                "type": "string",
                "intensity": "low | moderate | high",
                "duration_minutes": "string",
                "notes": "string"
              }
            }
          ]
        }
      }
    `;

    const response = await openai.chat.completions.create({
      model: "openrouter/free",
      messages: [
        { role: "system", content: "You are a specialized AI designed entirely to strictly output valid JSON objects based on instructions. No conversational text." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const outputJsonString = response.choices[0].message.content;
    const workoutPlan = JSON.parse(outputJsonString);
    
    res.status(200).json(workoutPlan);
  } catch (error) {
    console.error("Error generating workout:", error);
    res.status(500).json({ error: "API Error: " + (error.message || "Failed to generate workout using AI.") });
  }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
