import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { TextField, Button } from "@mui/material";
import { useAuthStore } from "../store/useAuthStore";

const Register = () => {
  const navigate = useNavigate();
  const registerAction = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mpin, setMpin] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mpin.length !== 4) {
      toast.error("M-PIN must be exactly 4 digits");
      return;
    }
    try {
      await registerAction(username, email, password, mpin);
      toast.success("User Registered and Logged In Successfully");
      navigate("/");
    } catch (err) {
      console.error("Registration error in console:", err.response?.data?.error || err.message);
      toast.error(err.response?.data?.error || "Registration failed. Please check your inputs.");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-6 shadow-[0_25px_70px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-8">
          <div className="mb-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#fd5b5b]">Create account</p>
            <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Sign Up</h1>
          </div>

          <TextField
            fullWidth
            className="!mt-6"
            label="Username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            fullWidth
            className="!mt-4"
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            fullWidth
            className="!mt-4"
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            fullWidth
            className="!mt-4"
            label="4-Digit M-PIN (for password reset)"
            type="text"
            required
            inputProps={{ maxLength: 4, pattern: "[0-9]*" }}
            value={mpin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              setMpin(val);
            }}
          />

          <Button
            type="submit"
            fullWidth
            disabled={loading}
            className="!mt-8 !rounded-full !bg-[#fd5b5b] !py-3 !text-lg !font-bold !text-white hover:!bg-[#e04a4a] !normal-case"
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </Button>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-[#fd5b5b] hover:underline">Login</Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Register;
