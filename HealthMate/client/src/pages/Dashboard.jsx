import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Grid, Button, IconButton, Collapse, Divider } from "@mui/material";
import {
  Delete as DeleteIcon,
  Forum as ForumIcon,
  OpenInNew as OpenInNewIcon,
  Person as PersonIcon,
  EventNote as EventNoteIcon,
  Air as AirIcon,
  Close as CloseIcon
} from "@mui/icons-material";
import { useAuthStore } from "../store/useAuthStore";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, Legend } from "recharts";

const Dashboard = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const storeToken = useAuthStore((state) => state.token);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const userProfile = user?.profile || null;

  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [expandedChatId, setExpandedChatId] = useState(null);
  const [expandedMessages, setExpandedMessages] = useState([]);
  const [fetchingSession, setFetchingSession] = useState(false);

  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (user?.id) {
      try {
        const stored = localStorage.getItem(`clinicBookings_${user.id}`);
        setBookings(stored ? JSON.parse(stored) : []);
      } catch {
        setBookings([]);
      }
    } else {
      setBookings([]);
    }
  }, [user]);

  const handleCancelBooking = (bookingId) => {
    const updated = bookings.filter((b) => b.id !== bookingId);
    setBookings(updated);
    if (user?.id) {
      localStorage.setItem(`clinicBookings_${user.id}`, JSON.stringify(updated));
    } else {
      localStorage.setItem("clinicBookings", JSON.stringify(updated));
    }
    toast.success("Appointment cancelled successfully");
  };

  const [showEnvBanner, setShowEnvBanner] = useState(true);
  const [envData, setEnvData] = useState(null);

  useEffect(() => {
    const fetchEnvData = async () => {
      if (userProfile?.locality) {
        try {
          const { data } = await axios.get("/api/v1/environment/data", {
            params: { location: userProfile.locality }
          });
          if (data && data.available) {
            setEnvData(data);
          }
        } catch (err) {
          console.error("Failed to load real environment data, falling back to mock metrics:", err);
        }
      }
    };
    fetchEnvData();
  }, [userProfile?.locality]);

  const demoEnvData = envData || (userProfile?.locality ? {
    available: true,
    location: userProfile.locality,
    temperature: 34,
    humidity: 78,
    aqi: 4,
    aqiLabel: "Poor"
  } : null);

  const weight = parseFloat(userProfile?.weight);
  const height = parseFloat(userProfile?.height) / 100;
  let bmi = null;
  let bmiCategory = "";
  let bmiColor = "";

  if (weight && height) {
    bmi = parseFloat((weight / (height * height)).toFixed(1));
    if (bmi < 18.5) {
      bmiCategory = "Underweight";
      bmiColor = "#38bdf8";
    } else if (bmi < 25) {
      bmiCategory = "Normal";
      bmiColor = "#4ade80";
    } else if (bmi < 30) {
      bmiCategory = "Overweight";
      bmiColor = "#facc15";
    } else {
      bmiCategory = "Obese";
      bmiColor = "#f87171";
    }
  }

  const bmiData = [
    { name: "Underweight", value: 18.5, color: "#38bdf8" },
    { name: "Normal", value: 6.5, color: "#4ade80" },
    { name: "Overweight", value: 5.0, color: "#facc15" },
    { name: "Obese", value: 10.0, color: "#f87171" },
  ];

  const [scanning, setScanning] = useState(false);
  const [scannedMeals, setScannedMeals] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("scannedMeals") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("scannedMeals", JSON.stringify(scannedMeals));
  }, [scannedMeals]);

  const totalConsumed = scannedMeals.reduce(
    (acc, m) => {
      acc.carbs += m.carbs || 0;
      acc.protein += m.protein || 0;
      acc.fat += m.fat || 0;
      acc.calories += m.calories || 0;
      return acc;
    },
    { carbs: 0, protein: 0, fat: 0, calories: 0 }
  );

  const getMacroTargets = () => {
    let calories = 2000;
    let carbs = 250;
    let protein = 120;
    let fat = 60;

    if (userProfile?.healthGoal?.toLowerCase().includes("loss")) {
      calories = 1800;
      carbs = 180;
      protein = 140;
      fat = 50;
    } else if (userProfile?.healthGoal?.toLowerCase().includes("gain")) {
      calories = 2600;
      carbs = 320;
      protein = 160;
      fat = 75;
    }

    return [
      { name: "Carbs", Target: carbs, Consumed: totalConsumed.carbs },
      { name: "Protein", Target: protein, Consumed: totalConsumed.protein },
      { name: "Fat", Target: fat, Consumed: totalConsumed.fat },
    ];
  };

  const macroData = getMacroTargets();

  const handleMealUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64Image = reader.result;
      setScanning(true);

      try {
        const { data } = await axios.post("/api/v1/openai/scan-meal", { image: base64Image });
        if (data && data.success) {
          const newMeal = {
            id: Date.now(),
            food: data.food,
            calories: data.calories,
            carbs: data.carbs,
            protein: data.protein,
            fat: data.fat,
            createdAt: new Date().toISOString()
          };
          setScannedMeals((prev) => [newMeal, ...prev]);
          toast.success(`Scanned: ${data.food}! Added ${data.calories} kcal.`);
        } else {
          toast.error("Failed to parse meal image. Try again.");
        }
      } catch (err) {
        console.error("Meal scan error:", err);
        toast.error("Error analyzing meal image.");
      } finally {
        setScanning(false);
      }
    };
  };

  const aqiTrendData = [
    { day: "Mon", AQI: 42, Temp: 28 },
    { day: "Tue", AQI: 55, Temp: 29 },
    { day: "Wed", AQI: 78, Temp: 31 },
    { day: "Thu", AQI: 95, Temp: 32 },
    { day: "Fri", AQI: 60, Temp: 30 },
    { day: "Sat", AQI: 48, Temp: 28 },
    { day: "Sun", AQI: 35, Temp: 27 },
  ];

  // Gamification States
  const [waterGlasses, setWaterGlasses] = useState(() => {
    try {
      return parseInt(localStorage.getItem("waterGlasses") || "0");
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    localStorage.setItem("waterGlasses", waterGlasses.toString());
  }, [waterGlasses]);

  const [dailyWorkoutDone, setDailyWorkoutDone] = useState(() => {
    try {
      return localStorage.getItem("dailyWorkoutDone") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem("dailyWorkoutDone", dailyWorkoutDone.toString());
  }, [dailyWorkoutDone]);

  const questAI = history.length > 0;
  const questMeals = scannedMeals.length > 0;
  const questWater = waterGlasses >= 8;
  const questWorkout = dailyWorkoutDone;

  const totalQuests = 4;
  const completedQuestsCount = [questAI, questMeals, questWater, questWorkout].filter(Boolean).length;

  const [streakCount, setStreakCount] = useState(() => {
    try {
      return parseInt(localStorage.getItem("habitStreak") || "0");
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    if (completedQuestsCount === totalQuests && streakCount === 0) {
      setStreakCount(1);
      localStorage.setItem("habitStreak", "1");
    }
  }, [completedQuestsCount, streakCount]);

  // Helper to get local YYYY-MM-DD date string
  const getLocalDateStr = (date = new Date()) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  // Wellness Activity History (scoped by user ID, visit recorded today, no random mock data)
  const [activityHistory, setActivityHistory] = useState({});

  useEffect(() => {
    if (user?.id) {
      try {
        const saved = localStorage.getItem(`wellnessActivityHistory_${user.id}`);
        setActivityHistory(saved ? JSON.parse(saved) : {});
      } catch {
        setActivityHistory({});
      }
    } else {
      setActivityHistory({});
    }
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    const todayStr = getLocalDateStr();
    const currentActivity = activityHistory[todayStr] || 0;
    // Visit represents at least value 1. If more quests are completed, it matches the completed count.
    const targetActivity = Math.max(1, completedQuestsCount);
    if (targetActivity > currentActivity) {
      const updated = {
        ...activityHistory,
        [todayStr]: targetActivity
      };
      setActivityHistory(updated);
      localStorage.setItem(`wellnessActivityHistory_${user.id}`, JSON.stringify(updated));
    }
  }, [completedQuestsCount, activityHistory, user?.id]);

  const getCalendarMonth = (year, monthIndex) => {
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const numDays = lastDay.getDate();
    const startWeekday = firstDay.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

    const days = [];
    // Empty slots before the first day of the month to align weekdays
    for (let i = 0; i < startWeekday; i++) {
      days.push({ dummy: true });
    }
    // Days of the month
    for (let d = 1; d <= numDays; d++) {
      const dateObj = new Date(year, monthIndex, d);
      const dateStr = getLocalDateStr(dateObj);
      days.push({
        dayNum: d,
        dateStr,
        dateObj,
        value: activityHistory[dateStr] || 0
      });
    }
    return {
      name: firstDay.toLocaleDateString("en-US", { month: "long" }),
      year,
      days
    };
  };

  const getRecentMonths = () => {
    const months = [];
    const today = new Date();
    // Display the last 6 months dynamically (including the current month)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(getCalendarMonth(d.getFullYear(), d.getMonth()));
    }
    return months;
  };

  const recentMonths = React.useMemo(() => {
    return getRecentMonths();
  }, [activityHistory]);

  const badges = [
    {
      id: "hydration",
      icon: "🥤",
      name: "Hydration Hero",
      desc: "Logged 8+ glasses of water",
      unlocked: questWater
    },
    {
      id: "ai_seeker",
      icon: "🤖",
      name: "AI Seeker",
      desc: "Logged an AI consultation",
      unlocked: questAI
    },
    {
      id: "meal_scan",
      icon: "🥗",
      name: "Calorie Master",
      desc: "Scanned a meal photo",
      unlocked: questMeals
    },
    {
      id: "habit_streak",
      icon: "🔥",
      name: "Habit Champ",
      desc: "Maintained a streak",
      unlocked: streakCount > 0
    }
  ];

  useEffect(() => {
    if (!storeToken) {
      navigate("/login");
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const historyRes = await axios.get("/api/v1/openai/history");
        setHistory(historyRes.data.history || []);

        if (!user) {
          await fetchProfile();
        }
      } catch (err) {
        console.error("Dashboard loading failed in console:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [storeToken, navigate, user, fetchProfile]);

  const handleExpandChat = async (chatId) => {
    if (expandedChatId === chatId) {
      setExpandedChatId(null);
      setExpandedMessages([]);
      return;
    }

    setExpandedChatId(chatId);
    setExpandedMessages([]);
    setFetchingSession(true);

    try {
      const { data } = await axios.get(`/api/v1/openai/chat/${chatId}`);
      if (data?.chat) {
        setExpandedMessages(data.chat.messages || []);
      }
    } catch (err) {
      console.error("Failed to load chat details in console:", err);
    } finally {
      setFetchingSession(false);
    }
  };

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this consultation?")) return;

    try {
      await axios.delete(`/api/v1/openai/chat/${chatId}`);
      toast.success("Consultation deleted successfully!");
      setHistory((prev) => prev.filter((item) => item._id !== chatId));
      if (expandedChatId === chatId) {
        setExpandedChatId(null);
        setExpandedMessages([]);
      }
    } catch (err) {
      console.error("Failed to delete chat in console:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 rounded-[24px] border border-white/10 bg-slate-900/70 px-8 py-8 backdrop-blur-xl">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#fd5b5b] border-t-transparent" />
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const hasProfile = userProfile && Object.values(userProfile).some((val) => val && val.trim() !== "");

  return (
    <div className="min-h-screen px-4 py-8 text-white md:py-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#fd5b5b]">Your wellbeing dashboard</p>
            <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Track your health journey with clarity</h1>
            <p className="mt-2 text-sm text-slate-400 sm:text-base">Monitor your consultations and keep your personal profile ready for smarter recommendations.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/chatbot">
              <Button className="!rounded-full !bg-[#fd5b5b] !px-5 !py-2.5 !font-semibold !text-white hover:!bg-[#e04a4a] !normal-case">
                New AI Chat
              </Button>
            </Link>
            <Link to="/profile">
              <Button className="!rounded-full !border !border-white/15 !px-5 !py-2.5 !font-semibold !text-white hover:!bg-white/10 !normal-case">
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>

        {hasProfile && showEnvBanner && demoEnvData && demoEnvData.aqi >= 4 && (
          <div className="rounded-[24px] border border-red-500/20 bg-gradient-to-r from-red-950/40 to-slate-900/60 p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_8px_30px_rgba(239,68,68,0.15)] backdrop-blur-xl relative overflow-hidden">
            <div className="absolute -left-10 -top-10 w-24 h-24 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex gap-3 items-start min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-400">
                <AirIcon />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">High Environmental Risk Alert</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  The Air Quality Index (AQI) in <span className="font-semibold text-white">{demoEnvData.location}</span> is currently <span className="text-red-400 font-bold">{demoEnvData.aqiLabel}</span>. 
                  We advise sensitive groups to wear masks or move outdoor workouts indoors today.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              <Button
                onClick={() => navigate("/chatbot?query=indoor+workout+alternatives+during+poor+air+quality")}
                size="small"
                className="!rounded-full !bg-red-500/20 hover:!bg-red-500/30 !text-red-400 !text-xs !font-bold !px-4 !py-1.5 !normal-case"
              >
                Get Indoor Exercises
              </Button>
              <IconButton 
                onClick={() => setShowEnvBanner(false)}
                size="small"
                sx={{ color: "slate.400", "&:hover": { color: "white" } }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </div>
          </div>
        )}

        {hasProfile && (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-[#fd5b5b]">
                <span className="text-xl">📅</span>
                <h2 className="text-lg font-semibold text-white">Wellness Activity Tracker</h2>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span>Less</span>
                <span className="w-2.5 h-2.5 rounded-sm bg-white/5 border border-white/5" />
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-950/60" />
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-800/60" />
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.3)]" />
                <span>More</span>
              </div>
            </div>

            <div className="max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent space-y-6">
              {recentMonths.map((month, mIdx) => (
                <div key={mIdx} className="space-y-2">
                  {mIdx > 0 && <div className="border-t border-white/10 pt-4" />} {/* One line gap between months */}
                  
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">{month.name} {month.year}</h3>
                    <span className="text-[9px] text-slate-400">
                      {month.days.filter(d => !d.dummy && d.value > 0).length} active days
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-[3px] max-w-[125px]">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <div key={i} className="text-center text-[9px] text-slate-600 font-bold select-none">{d}</div>
                    ))}
                    
                    {month.days.map((day, dIdx) => {
                      if (day.dummy) {
                        return <div key={`dummy-${dIdx}`} className="w-3.5 h-3.5" />;
                      }
                      
                      let colorClass = "bg-white/5 border border-white/5";
                      if (day.value === 1) colorClass = "bg-emerald-950/60 border border-emerald-900/30";
                      else if (day.value === 2) colorClass = "bg-emerald-800/60 border border-emerald-700/30";
                      else if (day.value === 3) colorClass = "bg-emerald-600";
                      else if (day.value >= 4) colorClass = "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]";

                      const formattedDate = day.dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                      
                      return (
                        <div
                          key={dIdx}
                          className={`w-3.5 h-3.5 rounded-[2px] transition duration-200 hover:scale-125 relative group cursor-pointer ${colorClass}`}
                        >
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-950 border border-white/10 rounded-lg p-2 text-[9px] text-slate-300 w-32 opacity-0 pointer-events-none group-hover:opacity-100 transition z-50 shadow-xl text-center">
                            <p className="font-bold text-white">{formattedDate}</p>
                            <p className="mt-0.5 text-slate-400">{day.value ? `${day.value} objectives completed` : "No activity logged"}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-[10px] text-slate-500 mt-4 text-center">
              Your daily wellness consistency map. A day is marked green when you visit the website, and turns darker as you complete daily quests.
            </p>
          </div>
        )}

        <Grid container spacing={4}>
          <Grid item xs={12} md={4} className="space-y-6">
            <div className="glass-card space-y-6 p-6">
              <div className="flex items-center gap-2 text-[#fd5b5b]">
                <PersonIcon />
                <h2 className="text-lg font-semibold">Your health card</h2>
              </div>

              {hasProfile ? (
                <div className="space-y-4 text-sm">
                  {userProfile.age && (
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-slate-400">Age:</span>
                      <span className="font-medium text-white">{userProfile.age} years</span>
                    </div>
                  )}
                  {userProfile.gender && (
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-slate-400">Gender:</span>
                      <span className="font-medium text-white">{userProfile.gender}</span>
                    </div>
                  )}
                  {userProfile.weight && (
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-slate-400">Weight:</span>
                      <span className="font-medium text-white">{userProfile.weight} kg</span>
                    </div>
                  )}
                  {userProfile.height && (
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-slate-400">Height:</span>
                      <span className="font-medium text-white">{userProfile.height} cm</span>
                    </div>
                  )}
                  {userProfile.vegpreference && (
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-slate-400">Diet Type:</span>
                      <span className="font-medium text-white">{userProfile.vegpreference}</span>
                    </div>
                  )}
                  {userProfile.healthGoal && (
                    <div className="pt-2">
                      <p className="text-xs text-slate-400">Primary Goal</p>
                      <p className="font-medium text-[#fd5b5b]">{userProfile.healthGoal}</p>
                    </div>
                  )}
                  {userProfile.healthProblem && (
                    <div className="pt-2">
                      <p className="text-xs text-slate-400">Medical Condition</p>
                      <p className="font-medium text-amber-400">{userProfile.healthProblem}</p>
                    </div>
                  )}
                  {userProfile.allergy && (
                    <div className="pt-2">
                      <p className="text-xs text-slate-400">Allergies</p>
                      <p className="font-medium text-rose-400">{userProfile.allergy}</p>
                    </div>
                  )}

                  {bmi && (
                    <div className="border-t border-white/10 pt-4 mt-4">
                      <p className="text-xs text-slate-400 mb-2 font-medium">BMI Indicator</p>
                      <div className="flex flex-col items-center justify-center relative">
                        <div className="w-[180px] h-[90px] relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={bmiData}
                                cx="50%"
                                cy="100%"
                                startAngle={180}
                                endAngle={0}
                                innerRadius={45}
                                outerRadius={60}
                                paddingAngle={2}
                                dataKey="value"
                              >
                                {bmiData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end">
                            <span className="text-xl font-black text-white leading-none">{bmi}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: bmiColor }}>
                              {bmiCategory}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 py-6 text-center">
                  <p className="text-sm text-slate-400">You haven&apos;t set up your health profile yet.</p>
                  <Link to="/profile">
                    <Button size="small" className="!font-medium !text-[#fd5b5b] hover:underline !normal-case">
                      Set up profile now →
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Grid>

          <Grid item xs={12} md={8} className="space-y-6">
            {bookings.length > 0 && (
              <div className="glass-card space-y-6 p-6 animate-fade-in">
                <div className="flex items-center gap-2 text-[#fd5b5b]">
                  <span className="text-xl">📅</span>
                  <h2 className="text-lg font-semibold text-white">Upcoming Facility Appointments ({bookings.length})</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="rounded-[20px] border border-white/10 bg-white/5 p-4 flex flex-col justify-between gap-3 relative overflow-hidden group">
                      <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-green-500/5 rounded-full blur-xl" />
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold uppercase tracking-wider">
                            Scheduled
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            {booking.date} at {booking.time}
                          </span>
                        </div>
                        <h3 className="font-bold text-white text-sm mt-2">{booking.clinicName}</h3>
                        <p className="text-[11px] text-slate-400 mt-1 truncate">{booking.clinicAddress}</p>
                        <p className="text-xs text-slate-300 mt-2 bg-slate-950/40 p-2 rounded-xl border border-white/5 italic">
                          "{booking.reason}"
                        </p>
                      </div>
                      <div className="flex justify-end pt-1">
                        <Button
                          onClick={() => handleCancelBooking(booking.id)}
                          size="small"
                          className="!text-[10px] !text-red-400 hover:!text-red-500 hover:underline !font-bold !normal-case !p-0"
                        >
                          Cancel Booking
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="glass-card space-y-6 p-6">
              <div className="flex items-center gap-2 text-[#fd5b5b]">
                <ForumIcon />
                <h2 className="text-lg font-semibold">Previous AI consultations ({history.length})</h2>
              </div>

              {history.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-white/10 py-12 text-center">
                  <p className="text-slate-500">No consultations saved in your profile yet.</p>
                  <Link to="/chatbot">
                    <Button size="small" className="!mt-4 !rounded-full !bg-[#fd5b5b] !px-4 !py-2 !font-semibold !text-white hover:!bg-[#e04a4a] !normal-case">
                      Start your first chat
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 max-h-[190px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {history.map((chat) => (
                    <div
                      key={chat._id}
                      onClick={() => handleExpandChat(chat._id)}
                      className={`cursor-pointer overflow-hidden rounded-[20px] border transition-all ${
                        expandedChatId === chat._id
                          ? "border-[#fd5b5b] bg-[#fd5b5b]/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between p-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <ForumIcon className="shrink-0 text-slate-400" fontSize="small" />
                          <div className="min-w-0">
                            <h3 className="truncate pr-2 text-sm font-semibold text-white sm:text-base">{chat.title}</h3>
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                              <EventNoteIcon sx={{ fontSize: 12 }} />
                              {new Date(chat.updatedAt).toLocaleDateString()} at{" "}
                              {new Date(chat.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/chatbot?sessionId=${chat._id}`);
                            }}
                            size="small"
                            sx={{ color: "white", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}
                            title="Open in Chat"
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={(e) => handleDeleteChat(chat._id, e)}
                            size="small"
                            sx={{ color: "rgb(244 63 94)", "&:hover": { bgcolor: "rgba(244,63,94,0.15)" } }}
                            title="Delete Chat"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </div>
                      </div>

                      <Collapse in={expandedChatId === chat._id}>
                        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
                        <div className="max-h-96 space-y-4 overflow-y-auto bg-slate-950/40 p-4">
                          {fetchingSession ? (
                            <div className="flex items-center justify-center py-4 text-xs text-slate-500">
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-[#fd5b5b] border-t-transparent" />
                              Loading conversation...
                            </div>
                          ) : expandedMessages.length === 0 ? (
                            <p className="text-center text-xs text-slate-500">Empty conversation.</p>
                          ) : (
                            expandedMessages.map((msg, idx) => (
                              <div key={idx} className="space-y-1">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${msg.role === "user" ? "text-slate-400" : "text-[#fd5b5b]"}`}>
                                  {msg.role === "user" ? "You" : "HealthMate AI"}
                                </span>
                                <div className={`rounded-xl p-3 text-sm leading-relaxed ${msg.role === "user" ? "bg-white/5 text-slate-200" : "border-l-2 border-[#fd5b5b] bg-[#fd5b5b]/10 text-white"}`}>
                                  {msg.content.split("\n").map((line, lIdx) => (
                                    <p key={lIdx} className={line.trim() ? "mb-1" : "mb-3"}>{line}</p>
                                  ))}
                                </div>
                              </div>
                            ))
                          )}
                          <div className="flex justify-end pt-2">
                            <Button
                              onClick={() => navigate(`/chatbot?sessionId=${chat._id}`)}
                              variant="outlined"
                              size="small"
                              className="!rounded-full !border-[#fd5b5b] !text-[#fd5b5b] hover:!bg-[#fd5b5b]/10 !text-xs !normal-case"
                            >
                              Resume this chat
                            </Button>
                          </div>
                        </div>
                      </Collapse>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Grid>
        </Grid>

        {hasProfile && (
          <>
            <Grid container spacing={4} className="!mt-4">
              <Grid item xs={12} md={6}>
                <div className="glass-card p-6 flex flex-col justify-between h-[360px]">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-[#fd5b5b]">
                        <EventNoteIcon />
                        <h2 className="text-lg font-semibold">AI Meal Scanner</h2>
                      </div>
                      {scannedMeals.length > 0 && (
                        <Button
                          onClick={() => {
                            setScannedMeals([]);
                            toast.success("Meal log cleared");
                          }}
                          size="small"
                          className="!text-xs !text-slate-400 hover:!text-red-400 !normal-case"
                        >
                          Clear Log
                        </Button>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                      Take or upload a photo of your meal. HealthMate AI will automatically estimate calories and macros!
                    </p>

                    <div className="flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl p-6 bg-white/5 hover:bg-white/10 transition relative cursor-pointer group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMealUpload}
                        disabled={scanning}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      {scanning ? (
                        <div className="flex flex-col items-center gap-2 py-2">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#fd5b5b] border-t-transparent" />
                          <p className="text-xs text-[#fd5b5b] font-bold">Scanning plate with AI...</p>
                        </div>
                      ) : (
                        <div className="text-center py-2">
                          <div className="text-slate-400 group-hover:text-white transition duration-200 text-3xl mb-1">📸</div>
                          <p className="text-xs font-semibold text-slate-300 group-hover:text-white transition">
                            Click to Snap or Upload Meal
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">Supports JPG, PNG, WEBP</p>
                        </div>
                      )}
                    </div>

                    {scannedMeals.length > 0 && (
                      <div className="mt-4 space-y-2 max-h-[100px] overflow-y-auto pr-1">
                        {scannedMeals.map((meal) => (
                          <div key={meal.id} className="flex justify-between items-center rounded-xl bg-slate-950/40 p-2 border border-white/5 text-xs">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-white truncate">{meal.food}</p>
                              <p className="text-slate-500 text-[10px] mt-0.5">
                                P: {meal.protein}g | C: {meal.carbs}g | F: {meal.fat}g
                              </p>
                            </div>
                            <span className="text-[#fd5b5b] font-bold shrink-0 ml-2">+{meal.calories} kcal</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Total Logged Energy:</span>
                    <span className="font-bold text-[#fd5b5b]">{totalConsumed.calories} kcal</span>
                  </div>
                </div>
              </Grid>

              <Grid item xs={12} md={6}>
                <div className="glass-card p-6 h-[360px] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[#fd5b5b] mb-4">
                      <EventNoteIcon />
                      <h2 className="text-lg font-semibold">Nutrient Target Allocations</h2>
                    </div>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={macroData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                            labelStyle={{ color: "#fff", fontWeight: "bold" }}
                          />
                          <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="Target" fill="#fd5b5b" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Consumed" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 text-center font-medium">
                    Daily macro targets (Target) compared against your scanned meals (Consumed) in grams.
                  </p>
                </div>
              </Grid>
            </Grid>



            <Grid container spacing={4} className="!mt-4">
              <Grid item xs={12} md={6}>
                <div className="glass-card p-6 flex flex-col justify-between min-h-[360px]">
                  <div>
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                      <div className="flex items-center gap-2 text-[#fd5b5b]">
                        <span className="text-xl">🏆</span>
                        <h2 className="text-base font-bold text-white">Daily Habits & Quests</h2>
                      </div>
                      <div className="flex items-center gap-1 bg-orange-500/20 text-orange-400 px-2.5 py-0.5 rounded-full text-xs font-bold animate-pulse">
                        <span>🔥</span>
                        <span>{streakCount} Day Streak</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Objectives</p>
                      
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/5 border border-white/5">
                          <span className="text-slate-300">Consult AI Chat</span>
                          <span className={questAI ? "text-green-400 font-bold" : "text-slate-500"}>
                            {questAI ? "✅ Complete" : "⏳ Pending"}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/5 border border-white/5">
                          <span className="text-slate-300">Scan Meal Photo</span>
                          <span className={questMeals ? "text-green-400 font-bold" : "text-slate-500"}>
                            {questMeals ? "✅ Complete" : "⏳ Pending"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/5 border border-white/5">
                          <span className="text-slate-300">Hydration Goal (8 glasses)</span>
                          <span className={questWater ? "text-green-400 font-bold" : "text-slate-500"}>
                            {questWater ? "✅ Complete" : `⏳ ${waterGlasses}/8 glasses`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/5 border border-white/5">
                          <span className="text-slate-300">Daily Exercise Log</span>
                          <button 
                            onClick={() => {
                              const val = !dailyWorkoutDone;
                              setDailyWorkoutDone(val);
                              if (val) {
                                toast.success("Workout logged!");
                              }
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                              questWorkout 
                                ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                                : "bg-[#fd5b5b]/20 text-[#fd5b5b] hover:bg-[#fd5b5b]/30 border border-[#fd5b5b]/30 cursor-pointer"
                            }`}
                          >
                            {questWorkout ? "Logged" : "Log"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-white/5 mt-4">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Water Logger</p>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex gap-1.5 overflow-x-auto py-1">
                          {Array.from({ length: 8 }).map((_, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                if (i < waterGlasses) {
                                  setWaterGlasses(i);
                                } else {
                                  setWaterGlasses(i + 1);
                                }
                              }}
                              className="text-xl transition-all duration-300 transform active:scale-90 hover:scale-110 cursor-pointer"
                            >
                              {i < waterGlasses ? "💧" : "🥛"}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button 
                            onClick={() => setWaterGlasses((v) => Math.max(0, v - 1))}
                            size="small"
                            className="!min-w-0 !p-1 !text-slate-400 hover:!text-white"
                          >
                            -
                          </Button>
                          <span className="text-xs font-bold text-white">{waterGlasses}</span>
                          <Button 
                            onClick={() => {
                              if (waterGlasses < 8) {
                                setWaterGlasses((v) => v + 1);
                                if (waterGlasses + 1 === 8) {
                                  toast.success("Hydration objective achieved! 🥤");
                                }
                              }
                            }}
                            size="small"
                            className="!min-w-0 !p-1 !text-slate-400 hover:!text-white"
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-white/5 mt-4">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Badges Cabinet</p>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        {badges.map((badge) => (
                          <div 
                            key={badge.id} 
                            className={`p-2 rounded-xl border transition-all duration-300 relative group flex flex-col items-center justify-center ${
                              badge.unlocked 
                                ? "bg-slate-900/60 border-[#fd5b5b]/30 shadow-[0_4px_12px_rgba(253,91,91,0.15)] scale-105" 
                                : "bg-slate-950/20 border-white/5 opacity-40 grayscale"
                            }`}
                          >
                            <span className="text-2xl">{badge.icon}</span>
                            <span className="text-[9px] text-slate-300 font-semibold mt-1.5 truncate max-w-full block">{badge.name}</span>
                            
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-950 border border-white/10 rounded-lg p-2 text-[9px] text-slate-300 w-28 opacity-0 pointer-events-none group-hover:opacity-100 transition z-50 shadow-xl">
                              <p className="font-bold text-white">{badge.name}</p>
                              <p className="mt-0.5 text-slate-400 leading-tight">{badge.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Grid>

              <Grid item xs={12} md={6}>
                <div className="glass-card p-6 flex flex-col justify-between min-h-[360px]">
                  <div>
                    <div className="flex items-center gap-2 text-[#fd5b5b] mb-4">
                      <EventNoteIcon />
                      <h2 className="text-lg font-semibold">Environmental Metrics Trend</h2>
                    </div>
                    <div className="h-[240px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={aqiTrendData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorAQI" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#fd5b5b" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#fd5b5b" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                            labelStyle={{ color: "#fff", fontWeight: "bold" }}
                          />
                          <Area type="monotone" dataKey="AQI" stroke="#fd5b5b" strokeWidth={2} fillOpacity={1} fill="url(#colorAQI)" />
                          <Area type="monotone" dataKey="Temp" stroke="#38bdf8" strokeWidth={1} fill="none" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 text-center font-medium">
                    7-day outdoor Air Quality Index (AQI) vs Local Temperature (°C) reference.
                  </p>
                </div>
              </Grid>
            </Grid>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
