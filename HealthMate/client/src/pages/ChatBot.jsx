import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import PersonIcon from "@mui/icons-material/Person";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import SaveIcon from "@mui/icons-material/Save";
import LockOpenIcon from "@mui/icons-material/LockOpen";

const QUICK_PROMPTS = [
  "Create a 7-day diet plan for me",
  "How many calories in 2 rotis and dal?",
  "Suggest exercises for weight loss",
  "Should I eat mango if I have diabetes?",
];

function formatLine(line) {
  const trimmed = line.trim();
  if (trimmed.startsWith("###")) {
    return { type: "h1", text: trimmed.replace(/^###\s*/, "").replace(/\*\*/g, "") };
  }
  if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
    return { type: "h2", text: trimmed.replace(/\*\*/g, "") };
  }
  return { type: "p", text: trimmed };
}

const ChatBot = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const urlSessionId = queryParams.get("sessionId");

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [environment, setEnvironment] = useState(null);
  const chatEndRef = useRef(null);

  // Auth and chat count limits
  const loggedIn = !!localStorage.getItem("authToken");
  const [chatSessionId, setChatSessionId] = useState(null);
  const [guestChats, setGuestChats] = useState(0);
  const [limitModalOpen, setLimitModalOpen] = useState(false);

  const [profile, setProfile] = useState({
    age: "",
    gender: "",
    weight: "",
    height: "",
    vegpreference: "",
    healthGoal: "",
    healthProblem: "",
    allergy: "",
    locality: "",
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Load user data on startup
  useEffect(() => {
    if (loggedIn) {
      // Fetch persisted user profile
      const fetchProfile = async () => {
        try {
          const { data } = await axios.get("/api/v1/auth/profile");
          if (data?.user?.profile) {
            setProfile({
              age: data.user.profile.age || "",
              gender: data.user.profile.gender || "",
              weight: data.user.profile.weight || "",
              height: data.user.profile.height || "",
              vegpreference: data.user.profile.vegpreference || "",
              healthGoal: data.user.profile.healthGoal || "",
              healthProblem: data.user.profile.healthProblem || "",
              allergy: data.user.profile.allergy || "",
              locality: data.user.profile.locality || "",
            });
          }
        } catch (err) {
          console.error("Failed to load user profile in chatbot:", err);
        }
      };

      fetchProfile();

      // If resuming a session from URL
      if (urlSessionId) {
        const fetchSession = async () => {
          setLoading(true);
          try {
            const { data } = await axios.get(`/api/v1/openai/chat/${urlSessionId}`);
            if (data?.chat) {
              const prevMsgs = [];
              data.chat.messages.forEach((msg) => {
                prevMsgs.push({ role: msg.role, content: msg.content });
              });
              setMessages(prevMsgs);
              setChatSessionId(urlSessionId);
            }
          } catch (err) {
            console.error("Failed to fetch chat session details in console:", err);
          } finally {
            setLoading(false);
          }
        };
        fetchSession();
      }
    } else {
      // Guest chat limits
      const count = parseInt(localStorage.getItem("healthmate_guest_chats") || "0", 10);
      setGuestChats(count);
    }
  }, [loggedIn, urlSessionId]);

  // Fetch environment details
  useEffect(() => {
    if (!profile.locality?.trim()) return;
    const timer = setTimeout(async () => {
      try {
        const { data } = await axios.get("/api/v1/environment/data", {
          params: { location: profile.locality },
        });
        if (data.available) setEnvironment(data);
      } catch (err) {
        console.error("Failed to fetch environment details:", err);
        setEnvironment(null);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [profile.locality]);

  const handleSaveProfile = async () => {
    if (!loggedIn) {
      toast.error("Please login to save profile details.");
      return;
    }

    try {
      const { data } = await axios.put("/api/v1/auth/profile", profile);
      if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        toast.success("Profile details synced!");
      }
    } catch (err) {
      console.error("Failed to sync profile in chatbot sidebar:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || loading) return;

    // Guest limits check
    if (!loggedIn && guestChats >= 3) {
      setLimitModalOpen(true);
      return;
    }

    const userMsg = text.trim();
    setText("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const { data } = await axios.post("/api/v1/openai/chatbot", {
        text: userMsg,
        ...profile,
        environment: environment?.available ? environment : undefined,
        chatSessionId,
      });

      const botContent = Array.isArray(data.reply) ? data.reply.join("\n") : String(data.reply);
      setMessages((prev) => [...prev, { role: "assistant", content: botContent }]);
      
      if (data.chatSessionId) {
        setChatSessionId(data.chatSessionId);
      }

      if (!loggedIn) {
        const newCount = guestChats + 1;
        setGuestChats(newCount);
        localStorage.setItem("healthmate_guest_chats", newCount);
      }
    } catch (err) {
      console.error("Chat completion error in console:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = (field) => (e) => {
    setProfile((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-4 p-4 md:p-6 h-[calc(100vh-5rem)]">
        
        {/* Profile sidebar */}
        <aside className={`lg:w-80 shrink-0 ${showProfile ? "block" : "hidden lg:block"}`}>
          <div className="rounded-2xl border border-white/10 bg-gray-800/30 backdrop-blur-md p-4 h-full flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex justify-between items-center mb-4 lg:hidden">
                <h2 className="font-semibold text-[#fd5b5b]">Health Profile</h2>
                <IconButton onClick={() => setShowProfile(false)} size="small" sx={{ color: "white" }}>
                  <ExpandLessIcon />
                </IconButton>
              </div>
              <h2 className="hidden lg:block font-semibold text-[#fd5b5b] mb-4 text-lg">Your Health Profile</h2>
              <p className="text-xs text-gray-400 mb-4">Provide details for personalized recommendations.</p>

              <div className="space-y-3">
                {[
                  { key: "age", label: "Age", placeholder: "e.g. 25" },
                  { key: "gender", label: "Gender", placeholder: "e.g. Male" },
                  { key: "weight", label: "Weight (kg)", placeholder: "e.g. 70" },
                  { key: "height", label: "Height (cm)", placeholder: "e.g. 175" },
                  { key: "vegpreference", label: "Diet Type", placeholder: "Veg / Non-veg" },
                  { key: "healthGoal", label: "Health Goal", placeholder: "Weight loss, muscle gain..." },
                  { key: "healthProblem", label: "Health Problem", placeholder: "Diabetes, asthma..." },
                  { key: "allergy", label: "Allergies", placeholder: "Peanuts, lactose..." },
                  { key: "locality", label: "Location", placeholder: "City for env tips" },
                ].map(({ key, label, placeholder }) => (
                  <TextField
                    key={key}
                    fullWidth
                    size="small"
                    label={label}
                    placeholder={placeholder}
                    value={profile[key]}
                    onChange={updateProfile(key)}
                    sx={{ "& .MuiInputBase-root": { bgcolor: "#ead5d3", borderRadius: "8px", fontSize: "13px", color: "black" } }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/15 space-y-3">
              {environment?.available && (
                <div className="p-3 rounded-lg bg-[#fd5b5b]/10 border border-[#fd5b5b]/30 text-xs">
                  <p className="font-semibold text-[#fd5b5b] mb-1">Environment Context</p>
                  <p>{environment.temperature}°C · AQI {environment.aqi} ({environment.aqiLabel})</p>
                  <p className="text-gray-400 capitalize">{environment.description}</p>
                </div>
              )}
              {loggedIn && (
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  onClick={handleSaveProfile}
                  startIcon={<SaveIcon />}
                  className="!border-[#fd5b5b] !text-[#fd5b5b] hover:!bg-[#fd5b5b]/10 !rounded-lg !py-1.5 !normal-case !font-semibold"
                >
                  Save Profile Details
                </Button>
              )}
            </div>
          </div>
        </aside>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-h-0 rounded-2xl border border-white/10 bg-gray-800/20 backdrop-blur-md overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#fd5b5b]">HealthMate AI</h1>
              <p className="text-xs text-gray-400">Personalized Health Checkups & AI Guidance</p>
            </div>
            <div className="flex items-center gap-2">
              {!loggedIn && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400 font-medium">
                  {3 - guestChats} Free Chats Left
                </span>
              )}
              <button
                className="lg:hidden flex items-center gap-1 text-sm text-[#fd5b5b]"
                onClick={() => setShowProfile(!showProfile)}
              >
                Profile {showProfile ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12 max-w-lg mx-auto">
                <SmartToyIcon sx={{ fontSize: 48, color: "#fd5b5b", mb: 2 }} />
                <p className="text-gray-400 text-sm mb-6">
                  Get instant AI suggestions on custom diet plans, fitness workouts, food suitability based on your conditions, and location health guidelines.
                </p>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 justify-center">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => setText(prompt)}
                      className="px-3.5 py-2 text-xs rounded-xl border border-white/15 bg-white/5 hover:border-[#fd5b5b] hover:text-[#fd5b5b] hover:bg-[#fd5b5b]/5 transition-all text-left sm:text-center"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-[#fd5b5b]/10 border border-[#fd5b5b]/30 flex items-center justify-center shrink-0">
                    <SmartToyIcon fontSize="small" sx={{ color: "#fd5b5b" }} />
                  </div>
                )}
                <div
                  className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#fd5b5b] text-white rounded-br-md"
                      : "bg-white/5 border border-white/10 text-gray-100 rounded-bl-md"
                  }`}
                >
                  {msg.content.split("\n").map((line, lineIdx) => {
                    const formatted = formatLine(line);
                    if (formatted.type === "h1") {
                      return <h3 key={lineIdx} className="font-bold text-[#fd5b5b] mt-2 mb-1 text-base">{formatted.text}</h3>;
                    }
                    if (formatted.type === "h2") {
                      return <h4 key={lineIdx} className="font-semibold text-[#fd5b5b] mt-1">{formatted.text}</h4>;
                    }
                    return formatted.text ? <p key={lineIdx} className="mb-1">{formatted.text}</p> : null;
                  })}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <PersonIcon fontSize="small" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-[#fd5b5b]/10 flex items-center justify-center">
                  <SmartToyIcon fontSize="small" sx={{ color: "#fd5b5b" }} />
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <div className="w-4 h-4 border-2 border-[#fd5b5b] border-t-transparent rounded-full animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 flex gap-2">
            <TextField
              fullWidth
              placeholder={!loggedIn && guestChats >= 3 ? "Please login to continue chatting..." : "Ask HealthMate AI: diet, calorie tracking, fitness plans..."}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading || (!loggedIn && guestChats >= 3)}
              size="small"
              sx={{ "& .MuiInputBase-root": { bgcolor: "#ead5d3", borderRadius: "12px", color: "black" } }}
            />
            <IconButton
              type="submit"
              disabled={loading || !text.trim() || (!loggedIn && guestChats >= 3)}
              sx={{
                bgcolor: "#fd5b5b",
                color: "white",
                "&:hover": { bgcolor: "#e04a4a" },
                "&.Mui-disabled": { bgcolor: "#333", color: "#666" }
              }}
            >
              <SendIcon />
            </IconButton>
          </form>

          <p className="text-center text-[10px] text-gray-500 pb-3">
            Not a substitute for professional medical advice. <Link to="/" className="text-[#fd5b5b]">Go Home</Link>
          </p>
        </div>
      </div>

      {/* Limit Exhausted Modal */}
      <Dialog
        open={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: "#111827",
            color: "white",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "20px",
            maxWidth: "400px"
          }
        }}
      >
        <DialogTitle sx={{ textAlign: "center", color: "#fd5b5b", fontWeight: "bold" }}>
          Chat Limit Reached
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center", py: 1 }}>
          <LockOpenIcon sx={{ fontSize: 48, color: "#fd5b5b", mb: 2 }} />
          <p className="text-gray-300 text-sm leading-relaxed">
            You have used all 3 free AI health checkup consultations.
          </p>
          <p className="text-gray-400 text-xs mt-2">
            Please sign in or create an account to unlock unlimited health consultations, keep track of your previous chats, and save your customized plans.
          </p>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3, gap: 2 }}>
          <Button
            onClick={() => navigate("/login")}
            className="!bg-[#fd5b5b] hover:!bg-[#e04a4a] !text-white !font-bold !px-6 !py-2.5 !rounded-xl !normal-case"
          >
            Sign In
          </Button>
          <Button
            onClick={() => navigate("/register")}
            className="!border !border-white/20 hover:!bg-white/5 !text-white !font-semibold !px-6 !py-2.5 !rounded-xl !normal-case"
          >
            Register
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ChatBot;
