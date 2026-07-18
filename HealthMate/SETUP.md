# HealthMate Setup Guide

## Quick Start

### 1. Install dependencies

```bash
cd MernStack-chatGPT-Clone
npm install
cd client && npm install && cd ..
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

### 3. Run the app

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8080

---

## Free API Keys — Step by Step

### 1. AI Chatbot (Required) — OpenRouter (FREE)

OpenRouter provides free AI models including DeepSeek.

1. Go to **https://openrouter.ai/**
2. Click **Sign Up** (Google/GitHub login works)
3. Go to **Keys** → **Create Key**
4. Copy the key (starts with `sk-or-v1-...`)
5. Add to `.env`:
   ```
   OPENAI_API_KEY=sk-or-v1-your-key-here
   OPENAI_BASE_URL=https://openrouter.ai/api/v1
   OPENAI_MODEL=deepseek/deepseek-r1:free
   ```

**Free models you can try:**
- `deepseek/deepseek-r1:free`
- `google/gemma-2-9b-it:free`
- `meta-llama/llama-3.2-3b-instruct:free`

> OpenRouter gives free credits. Check https://openrouter.ai/docs for current limits.

---

### 2. Nearby Places with Google Ratings (Optional)

Without this key, the app uses **OpenStreetMap** (free, no ratings).

**To get Google ratings:**

1. Go to **https://console.cloud.google.com/**
2. Create a new project (e.g. "HealthMate")
3. Enable **Places API** (Legacy) or **Places API (New)**
4. Go to **APIs & Services → Credentials → Create Credentials → API Key**
5. Restrict the key to Places API only (recommended)
6. Add to `.env`:
   ```
   GOOGLE_PLACES_API_KEY=your_google_key
   ```

**Free tier:** Google gives $200/month credit — enough for development and small projects.

---

### 3. Environment Health Tips (Optional) — OpenWeatherMap

For air quality, temperature, and climate-based health advice:

1. Go to **https://openweathermap.org/api**
2. Click **Sign Up** (free)
3. Go to **API keys** in your account
4. Copy your default API key (activates in ~10 minutes)
5. Add to `.env`:
   ```
   OPENWEATHER_API_KEY=your_openweather_key
   ```

**Free tier:** 1,000 API calls/day — plenty for this project.

---

### 4. MongoDB (Required for Auth & Reviews)

1. Go to **https://www.mongodb.com/atlas**
2. Create a free cluster (M0 Sandbox)
3. Create a database user and whitelist IP `0.0.0.0/0` (for dev)
4. Get connection string → add to `.env` as `MONGO_URI`

---

## Features Overview

| Feature | Page | API Used |
|---------|------|----------|
| AI Health Chat | `/chatbot` | OpenRouter |
| Diet & Exercise Plans | `/chatbot` | OpenRouter + user profile |
| Calorie & Food Advice | `/chatbot` | OpenRouter |
| Environment Tips | `/chatbot` | OpenWeatherMap (optional) |
| Nearby Clinics/Pharmacies | `/nearby` | Google Places or OpenStreetMap |
| User Reviews | `/reviews` | MongoDB |

---

## Project Structure

```
MernStack-chatGPT-Clone/
├── server.js
├── controllers/
│   ├── openaiController.js   # AI chatbot
│   ├── placesController.js   # Nearby medical resources
│   ├── environmentController.js
│   └── reviewController.js
├── client/src/
│   ├── pages/
│   │   ├── Homepage.jsx
│   │   ├── ChatBot.jsx
│   │   ├── NearbyPlaces.jsx
│   │   └── Reviews.jsx
│   └── components/Navbar.jsx
└── .env
```

---

## Troubleshooting

**Chatbot returns 500 error**
- Check `OPENAI_API_KEY` in `.env`
- Restart server after changing `.env`

**Nearby places show no ratings**
- Add `GOOGLE_PLACES_API_KEY` or use OpenStreetMap results (no ratings)

**Environment data not showing**
- Add `OPENWEATHER_API_KEY` and enter a location in the chat profile

**MongoDB connection failed**
- Verify `MONGO_URI` and network access in Atlas
