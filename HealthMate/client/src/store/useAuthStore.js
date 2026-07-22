import { create } from "zustand";
import axios from "axios";

export const useAuthStore = create((set, get) => ({
  token: localStorage.getItem("authToken") || null,
  user: JSON.parse(localStorage.getItem("user") || "null"),
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await axios.post("/api/v1/auth/login", { email, password });
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
      set({ token: data.token, user: data.user, loading: false });
      return { success: true };
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  register: async (username, email, password, mpin) => {
    set({ loading: true });
    try {
      const { data } = await axios.post("/api/v1/auth/register", { username, email, password, mpin });
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
      set({ token: data.token, user: data.user, loading: false });
      return { success: true };
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  resetPassword: async (email, mpin, newPassword) => {
    set({ loading: true });
    try {
      const { data } = await axios.post("/api/v1/auth/reset-password", { email, mpin, newPassword });
      set({ loading: false });
      return data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await axios.post("/api/v1/auth/logout");
    } catch (err) {
      console.error("Logout API request failed:", err);
    } finally {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      delete axios.defaults.headers.common["Authorization"];
      set({ token: null, user: null });
    }
  },

  updateProfileState: (updatedUser) => {
    localStorage.setItem("user", JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  fetchProfile: async () => {
    const token = get().token;
    if (!token) return;
    try {
      const { data } = await axios.get("/api/v1/auth/profile");
      if (data?.user) {
        get().updateProfileState(data.user);
      }
    } catch (err) {
      console.error("Fetch profile failed inside Zustand store:", err);
      // If unauthorized, clear session
      if (err.response?.status === 401) {
        get().logout();
      }
    }
  }
}));
