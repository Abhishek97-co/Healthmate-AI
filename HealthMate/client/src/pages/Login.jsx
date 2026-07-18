import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { TextField, Button } from "@mui/material";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post("/api/v1/auth/login", { email, password });
      toast.success("Login Successful");
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
      navigate("/dashboard");
    } catch (err) {
      console.error("Login failure in console:", err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-6 shadow-[0_25px_70px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-8">
          <div className="mb-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#fd5b5b]">Welcome back</p>
            <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Sign In</h1>
          </div>

          <TextField
            fullWidth
            className="!mt-6"
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ "& .MuiInputBase-root": { bgcolor: "#f4e9e7", borderRadius: "12px", color: "black" } }}
          />
          <TextField
            fullWidth
            className="!mt-4"
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ "& .MuiInputBase-root": { bgcolor: "#f4e9e7", borderRadius: "12px", color: "black" } }}
          />

          <Button
            type="submit"
            fullWidth
            className="!mt-8 !rounded-full !bg-[#fd5b5b] !py-3 !text-lg !font-bold !text-white hover:!bg-[#e04a4a] !normal-case"
          >
            Sign In
          </Button>

          <p className="mt-6 text-center text-sm text-slate-400">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-semibold text-[#fd5b5b] hover:underline">Register</Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Login;
