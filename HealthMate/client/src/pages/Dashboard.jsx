import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Grid, Button, IconButton, Collapse, Divider } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ForumIcon from "@mui/icons-material/Forum";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PersonIcon from "@mui/icons-material/Person";
import EventNoteIcon from "@mui/icons-material/EventNote";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [expandedChatId, setExpandedChatId] = useState(null);
  const [expandedMessages, setExpandedMessages] = useState([]);
  const [fetchingSession, setFetchingSession] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const historyRes = await axios.get("/api/v1/openai/history");
      setHistory(historyRes.data.history || []);

      const profileRes = await axios.get("/api/v1/auth/profile");
      if (profileRes.data?.user) {
        setUserProfile(profileRes.data.user.profile);
      }
    } catch (err) {
      console.error("Dashboard loading failed in console:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchDashboardData();
  }, [navigate]);

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

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
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

          <Grid item xs={12} md={8}>
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
                <div className="space-y-3">
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
      </div>
    </div>
  );
};

export default Dashboard;
