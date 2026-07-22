import "./App.css";
import { Routes, Route } from "react-router-dom";
import { useMemo } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { Toaster } from "react-hot-toast";
import { themeSettings } from "./theme";
import Navbar from "./components/Navbar.jsx";
import Homepage from "./pages/Homepage.jsx";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";

import ChatBot from "./pages/ChatBot";
import NearbyPlaces from "./pages/NearbyPlaces";
import Reviews from "./pages/Reviews";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import axios from "axios";
import { useAuthStore } from "./store/useAuthStore";
import { useEffect } from "react";

// Set initial axios auth header if token exists in store initialization
const token = localStorage.getItem("authToken");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

function App() {
  const theme = useMemo(() => createTheme(themeSettings()), []);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const storeToken = useAuthStore((state) => state.token);

  useEffect(() => {
    if (storeToken) {
      fetchProfile();
    }
  }, [storeToken, fetchProfile]);

  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Navbar />
        <Toaster />
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
         
          <Route path="/chatbot" element={<ChatBot />} />
          <Route path="/nearby" element={<NearbyPlaces />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </ThemeProvider>
    </>
  );
}

export default App;

