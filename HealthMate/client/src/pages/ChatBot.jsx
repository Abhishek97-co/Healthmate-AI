import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from "@mui/material";
import {
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as SmartToyIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Save as SaveIcon,
  LockOpen as LockOpenIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon
} from "@mui/icons-material";
import { useAuthStore } from "../store/useAuthStore";

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
  const user = useAuthStore((state) => state.user);
  const storeToken = useAuthStore((state) => state.token);
  const updateProfileState = useAuthStore((state) => state.updateProfileState);
  const loggedIn = !!storeToken;
  const [chatSessionId, setChatSessionId] = useState(null);
  const [guestChats, setGuestChats] = useState(0);
  const [limitModalOpen, setLimitModalOpen] = useState(false);

  // Voice States
  const [isRecording, setIsRecording] = useState(false);
  const [currentlySpeakingMsgIdx, setCurrentlySpeakingMsgIdx] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      rec.onresult = (e) => {
        const resultText = e.results[0][0].transcript;
        setText((prev) => (prev ? prev + " " + resultText : resultText));
      };

      rec.onerror = (e) => {
        console.error("Speech recognition error:", e);
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in this browser. Please use Chrome.");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const speakText = (messageText, msgIndex) => {
    if (!("speechSynthesis" in window)) {
      toast.error("Text-to-speech is not supported in this browser.");
      return;
    }

    if (currentlySpeakingMsgIdx === msgIndex) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingMsgIdx(null);
      return;
    }

    window.speechSynthesis.cancel();

    const cleanedText = messageText
      .replace(/[\*#`_]/g, "")
      .replace(/-\s+/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.lang = "en-US";
    
    utterance.onend = () => {
      setCurrentlySpeakingMsgIdx(null);
    };

    utterance.onerror = (err) => {
      console.error("Speech synthesis error:", err);
      setCurrentlySpeakingMsgIdx(null);
    };

    setCurrentlySpeakingMsgIdx(msgIndex);
    window.speechSynthesis.speak(utterance);
  };

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
    if (loggedIn && user?.profile) {
      setProfile({
        age: user.profile.age || "",
        gender: user.profile.gender || "",
        weight: user.profile.weight || "",
        height: user.profile.height || "",
        vegpreference: user.profile.vegpreference || "",
        healthGoal: user.profile.healthGoal || "",
        healthProblem: user.profile.healthProblem || "",
        allergy: user.profile.allergy || "",
        locality: user.profile.locality || "",
      });

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
    } else if (!loggedIn) {
      // Guest chat limits
      const count = parseInt(localStorage.getItem("healthmate_guest_chats") || "0", 10);
      setGuestChats(count);
    }
  }, [loggedIn, user, urlSessionId]);

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
        updateProfileState(data.user);
        toast.success("Profile details synced!");
      }
    } catch (err) {
      console.error("Failed to sync profile in chatbot sidebar:", err);
      toast.error(err.response?.data?.error || "Failed to save profile. Please try again.");
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
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-4 p-4 md:p-6 h-[calc(100vh-5rem)] relative">
        
        {/* Backdrop for mobile drawer */}
        {showProfile && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setShowProfile(false)}
          />
        )}

        {/* Profile sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 w-80 lg:w-80 h-full shrink-0 z-50 transform transition-transform duration-300 ease-in-out bg-[#0f172a] lg:bg-transparent p-4 lg:p-0
          ${showProfile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}>
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
                className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#fd5b5b]/30 bg-[#fd5b5b]/10 text-xs font-semibold text-[#fd5b5b] hover:bg-[#fd5b5b]/20 transition-all"
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
                      : "bg-white/5 border border-white/10 text-gray-100 rounded-bl-md relative group pr-10"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <button
                      onClick={() => speakText(msg.content, idx)}
                      className="absolute right-2 top-2 p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                      aria-label="Speak text"
                    >
                      {currentlySpeakingMsgIdx === idx ? (
                        <VolumeOffIcon fontSize="small" className="text-[#fd5b5b] animate-pulse" />
                      ) : (
                        <VolumeUpIcon fontSize="small" />
                      )}
                    </button>
                  )}
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
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-[#fd5b5b]/10 border border-[#fd5b5b]/30 flex items-center justify-center shrink-0">
                  <SmartToyIcon fontSize="small" sx={{ color: "#fd5b5b" }} />
                </div>
                <div className="bg-white/5 border border-white/10 text-gray-400 rounded-2xl rounded-bl-md px-4 py-3 text-sm flex items-center gap-1.5 min-w-[60px] h-[36px]">
                  <span className="w-2.5 h-2.5 bg-[#fd5b5b] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-2.5 h-2.5 bg-[#fd5b5b] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-2.5 h-2.5 bg-[#fd5b5b] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 flex gap-2 items-center">
            <TextField
              fullWidth
              placeholder={!loggedIn && guestChats >= 3 ? "Please login to continue chatting..." : "Ask HealthMate AI: diet, calorie tracking, fitness plans..."}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading || (!loggedIn && guestChats >= 3)}
              size="small"
            />
            {!(!loggedIn && guestChats >= 3) && (
              <IconButton
                onClick={toggleRecording}
                disabled={loading}
                className={isRecording ? "animate-pulse" : ""}
                sx={{
                  color: isRecording ? "#fd5b5b" : "slate.400",
                  bgcolor: isRecording ? "rgba(253, 91, 91, 0.15)" : "transparent",
                  border: isRecording ? "1px solid rgba(253, 91, 91, 0.3)" : "1px solid rgba(255,255,255,0.1)",
                  "&:hover": { bgcolor: isRecording ? "rgba(253, 91, 91, 0.25)" : "white/5" },
                }}
              >
                {isRecording ? <MicOffIcon /> : <MicIcon />}
              </IconButton>
            )}
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
