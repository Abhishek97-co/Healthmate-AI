import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { TextField, Button } from "@mui/material";
import { useAuthStore } from "../store/useAuthStore";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isResetMode, setIsResetMode] = useState(false);
  const [mpin, setMpin] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const login = useAuthStore((state) => state.login);
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const loading = useAuthStore((state) => state.loading);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success("Login Successful");
      navigate("/dashboard");
    } catch (err) {
      console.error("Login failure in console:", err.response?.data?.error || err.message);
      toast.error(err.response?.data?.error || "Login failed. Please check your credentials.");
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (mpin.length !== 4) {
      toast.error("M-PIN must be exactly 4 digits");
      return;
    }
    try {
      await resetPassword(email, mpin, newPassword);
      toast.success("Password reset successful! You can now log in.");
      setIsResetMode(false);
      setPassword("");
      setMpin("");
      setNewPassword("");
    } catch (err) {
      console.error("Reset password failure in console:", err.response?.data?.error || err.message);
      toast.error(err.response?.data?.error || "Failed to reset password. Check your M-PIN.");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <form onSubmit={isResetMode ? handleResetSubmit : handleSubmit} className="w-full max-w-md">
        <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-6 shadow-[0_25px_70px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-8">
          
          {isResetMode ? (
            <>
              <div className="mb-6 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#fd5b5b]">Forgot Password</p>
                <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Reset Password</h1>
              </div>

              <TextField
                fullWidth
                className="!mt-6"
                label="Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                fullWidth
                className="!mt-4"
                label="4-Digit M-PIN"
                type="text"
                required
                inputProps={{ maxLength: 4, pattern: "[0-9]*" }}
                value={mpin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setMpin(val);
                }}
              />
              <TextField
                fullWidth
                className="!mt-4"
                label="New Password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <Button
                type="submit"
                fullWidth
                disabled={loading}
                className="!mt-8 !rounded-full !bg-[#fd5b5b] !py-3 !text-lg !font-bold !text-white hover:!bg-[#e04a4a] !normal-case"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </Button>

              <p className="mt-6 text-center text-sm text-slate-400">
                Remember your password?{" "}
                <button
                  type="button"
                  onClick={() => setIsResetMode(false)}
                  className="font-semibold text-[#fd5b5b] hover:underline"
                >
                  Sign In
                </button>
              </p>
            </>
          ) : (
            <>
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

              <div className="mt-3 text-right">
                <button
                  type="button"
                  onClick={() => setIsResetMode(true)}
                  className="text-xs font-semibold text-[#fd5b5b] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <Button
                type="submit"
                fullWidth
                disabled={loading}
                className="!mt-6 !rounded-full !bg-[#fd5b5b] !py-3 !text-lg !font-bold !text-white hover:!bg-[#e04a4a] !normal-case"
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>

              <p className="mt-6 text-center text-sm text-slate-400">
                Don&apos;t have an account?{" "}
                <Link to="/register" className="font-semibold text-[#fd5b5b] hover:underline">Register</Link>
              </p>
            </>
          )}

        </div>
      </form>
    </div>
  );
};

export default Login;
