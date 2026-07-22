const OpenAI = require("openai");
const jwt = require("jsonwebtoken");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");

const openai = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL || "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENAI_API_KEY,
});

const healthKeywords = [
  "health", "healthcare", "wellness", "wellbeing", "medicine", "medical", "clinic",
  "hospital", "doctor", "diet", "nutrition", "calories", "exercise", "workout",
  "fitness", "symptoms", "allergy", "diabetes", "weight", "BMI", "food", "meal",
  "protein", "vitamin", "mental health", "stress", "sleep", "yoga", "pain",
  "treatment", "prevention", "hydration", "vegetarian", "vegan", "keto",
];

function isHealthRelated(text) {
  const lowerInput = text.toLowerCase();
  return healthKeywords.some((keyword) => {
    const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, "i");
    return regex.test(lowerInput);
  });
}

function buildHealthPrompt({ text, profile, environment }) {
  const parts = [text];

  if (profile) {
    const { age, gender, weight, height, vegpreference, healthGoal, allergy, locality, healthProblem } = profile;
    parts.push(
      `\nUser Profile:`,
      age && `- Age: ${age}`,
      gender && `- Gender: ${gender}`,
      weight && `- Weight: ${weight} kg`,
      height && `- Height: ${height} cm`,
      vegpreference && `- Diet preference: ${vegpreference}`,
      healthGoal && `- Health goal: ${healthGoal}`,
      healthProblem && `- Health condition: ${healthProblem}`,
      allergy && `- Allergies: ${allergy}`,
      locality && `- Location: ${locality}`
    );
  }

  if (environment) {
    parts.push(
      `\nEnvironmental Context (${environment.location}):`,
      `- Temperature: ${environment.temperature}°C`,
      `- Air Quality Index: ${environment.aqi} (${environment.aqiLabel})`,
      `- Humidity: ${environment.humidity}%`,
      `- Conditions: ${environment.description}`
    );
  }

  return parts.filter(Boolean).join("\n");
}
const GUEST_LIMIT = 3;
const GUEST_WINDOW_MS = 24 * 60 * 60 * 1000;
const guestChatLimits = new Map();

exports.chatbotController = async (req, res) => {
  const { text, age, gender, weight, height, vegpreference, healthGoal, allergy, locality, healthProblem, environment, chatSessionId } = req.body;

  if (typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "Please enter a valid health-related question." });
  }

  if (!isHealthRelated(text) && !healthGoal && !healthProblem) {
    return res.status(200).json([
      "Only health-related questions are allowed. Try asking about diet, exercise, calories, symptoms, or wellness plans.",
    ]);
  }

  // Check if JWT token exists to associate chat with user
  let userId = null;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      userId = decoded.id;
    } catch (err) {
      console.error("Token verification failed in chatbot controller:", err.message);
    }
  }

  // Enforce server-side guest chat limits
  if (!userId) {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const now = Date.now();
    const limitInfo = guestChatLimits.get(ip) || { count: 0, resetTime: now + GUEST_WINDOW_MS };

    if (now > limitInfo.resetTime) {
      limitInfo.count = 0;
      limitInfo.resetTime = now + GUEST_WINDOW_MS;
    }

    if (limitInfo.count >= GUEST_LIMIT) {
      return res.status(403).json({
        error: "You have used all 3 free guest consultations. Please sign in or register to continue.",
        limitExceeded: true,
      });
    }

    // Update count in cache
    limitInfo.count += 1;
    guestChatLimits.set(ip, limitInfo);
  }

  const profile = { age, gender, weight, height, vegpreference, healthGoal, allergy, locality, healthProblem };
  const userContent = buildHealthPrompt({ text, profile, environment });

  // Load chat session history from database for conversational context
  let historyMessages = [];
  if (userId && chatSessionId) {
    try {
      const chatSession = await Chat.findOne({ _id: chatSessionId, user: userId });
      if (chatSession && chatSession.messages?.length) {
        historyMessages = chatSession.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));
      }
    } catch (err) {
      console.error("Failed to load chat history in chatbot controller:", err.message);
    }
  }

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "deepseek/deepseek-r1:free",
      messages: [
        {
          role: "system",
          content: `You are HealthMate, an AI health and wellness assistant. You provide:
- Personalized diet and exercise plans based on user profile
- Calorie estimates for foods and whether they suit the user's health condition
- Advice tailored to specific health problems (always recommend consulting a doctor for serious issues)
- Environment-aware suggestions when location/climate data is provided
Keep responses clear, structured with headings, and practical. Never diagnose diseases definitively. Include disclaimers for medical emergencies.`,
        },
        ...historyMessages,
        { role: "user", content: userContent },
      ],
    });

    const content = response.choices[0]?.message?.content || "No response received.";
    const lines = content.split("\n").map((line) => line.trim()).filter(Boolean);
    const botReply = lines.length ? lines : [content];

    let savedSessionId = chatSessionId;

    // If logged in, save to database
    if (userId) {
      let chatSession = null;
      if (chatSessionId) {
        chatSession = await Chat.findOne({ _id: chatSessionId, user: userId });
      }

      if (!chatSession) {
        const title = text.length > 40 ? text.substring(0, 40) + "..." : text;
        chatSession = new Chat({
          user: userId,
          title,
          messages: [],
        });
      }

      chatSession.messages.push({ role: "user", content: text });
      chatSession.messages.push({ role: "assistant", content: botReply.join("\n") });
      await chatSession.save();
      savedSessionId = chatSession._id;
    }

    return res.status(200).json({
      reply: botReply,
      chatSessionId: savedSessionId,
    });
  } catch (error) {
    console.error("AI error:", error.message);
    const hint = error.message?.includes("401")
      ? "Invalid or expired OpenRouter API key. Get a free key at https://openrouter.ai/keys"
      : error.message;
    return res.status(500).json({
      error: hint || "AI service unavailable. Check your API key in .env",
    });
  }
};

// GET ALL CHATS FOR LOGGED IN USER
exports.getChatHistoryController = async (req, res) => {
  try {
    const history = await Chat.find({ user: req.user.id }).sort({ updatedAt: -1 });
    return res.status(200).json({ success: true, history });
  } catch (error) {
    console.error("History fetch error:", error);
    return res.status(500).json({ error: "Failed to fetch chat history." });
  }
};

// GET SINGLE CHAT SESSION
exports.getChatSessionController = async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, user: req.user.id });
    if (!chat) {
      return res.status(404).json({ error: "Conversation not found." });
    }
    return res.status(200).json({ success: true, chat });
  } catch (error) {
    console.error("Session fetch error:", error);
    return res.status(500).json({ error: "Failed to fetch conversation details." });
  }
};

// DELETE CHAT SESSION
exports.deleteChatSessionController = async (req, res) => {
  try {
    const chat = await Chat.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!chat) {
      return res.status(404).json({ error: "Conversation not found." });
    }
    return res.status(200).json({ success: true, message: "Conversation deleted successfully." });
  } catch (error) {
    console.error("Session delete error:", error);
    return res.status(500).json({ error: "Failed to delete conversation." });
  }
};

// SCAN MEAL PHOTO
exports.scanMealController = async (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ error: "Please provide a base64 food image." });
  }

  if (!process.env.OPENAI_API_KEY) {
    const mockMeals = [
      { food: "Avocado Chicken Salad", calories: 420, carbs: 12, protein: 32, fat: 26 },
      { food: "Protein Oatmeal with Berries", calories: 350, carbs: 48, protein: 18, fat: 8 },
      { food: "Salmon Quinoa Bowl", calories: 550, carbs: 42, protein: 38, fat: 22 },
      { food: "Greek Yogurt Honey Parfait", calories: 280, carbs: 34, protein: 15, fat: 6 }
    ];
    const result = mockMeals[Math.floor(Math.random() * mockMeals.length)];
    return res.status(200).json({
      success: true,
      mocked: true,
      ...result
    });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Identify the food in this image and estimate its macronutrients. Return a raw JSON object ONLY, with no markdown codeblocks, prefix or suffix. Format: { \"food\": \"Item Name\", \"calories\": number, \"carbs\": number, \"protein\": number, \"fat\": number }" },
            {
              type: "image_url",
              image_url: {
                url: image
              }
            }
          ]
        }
      ]
    });

    const contentText = response.choices[0]?.message?.content || "{}";
    const cleanedJsonText = contentText.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleanedJsonText);

    return res.status(200).json({
      success: true,
      mocked: false,
      ...result
    });
  } catch (error) {
    console.error("AI meal scan error:", error.message);
    const mockMeals = [
      { food: "Avocado Chicken Salad", calories: 420, carbs: 12, protein: 32, fat: 26 }
    ];
    return res.status(200).json({
      success: true,
      mocked: true,
      ...mockMeals[0]
    });
  }
};
