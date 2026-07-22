import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Menu as MenuIcon, Close as CloseIcon } from "@mui/icons-material";
import { useAuthStore } from "../store/useAuthStore";

const Navbar = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const loggedIn = !!token;

  const currentNavLinks = [
    { to: "/", label: "Home" },
    { to: "/chatbot", label: "AI Chat" },
    { to: "/nearby", label: "Nearby" },
    { to: "/reviews", label: "Reviews" },
  ];

  if (loggedIn) {
    currentNavLinks.push(
      { to: "/dashboard", label: "Dashboard" },
      { to: "/profile", label: "Profile" }
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Logout failure in console:", error);
    }
  };

  const desktopLinkClass = ({ isActive }) =>
    `px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
      isActive
        ? "text-white bg-[#fd5b5b] shadow-[0_8px_20px_rgba(253,91,91,0.3)] scale-105"
        : "text-slate-300 hover:text-white hover:bg-white/5"
    }`;

  const mobileLinkClass = ({ isActive }) =>
    `block w-full px-4 py-3 rounded-2xl text-base font-semibold transition-all duration-200 ${
      isActive
        ? "text-white bg-[#fd5b5b] shadow-[0_4px_12px_rgba(253,91,91,0.25)]"
        : "text-slate-300 hover:text-white hover:bg-white/5"
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl transition-all duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 md:h-20">
        <NavLink to="/" className="flex items-center gap-2 group">
          <img
            src="/heart-attack.png"
            alt="HealthMate"
            className="h-8 shrink-0 transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_12px_rgba(253,91,91,0.4)] sm:h-10"
          />
          <span className="text-xl font-bold tracking-tight text-white sm:text-2xl md:text-3xl bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text">
            HealthMate
          </span>
        </NavLink>

        {/* Desktop Links */}
        <div className="hidden items-center gap-2 md:flex">
          {currentNavLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={desktopLinkClass}>
              {link.label}
            </NavLink>
          ))}
          {loggedIn ? (
            <button
              onClick={handleLogout}
              className="ml-3 rounded-full bg-gradient-to-r from-red-500 to-[#fd5b5b] px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:brightness-110 transition-all active:scale-95 cursor-pointer"
            >
              Logout
            </button>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <NavLink to="/login" className="px-4 py-2 font-semibold text-slate-300 hover:text-white transition">
                Sign In
              </NavLink>
              <NavLink
                to="/register"
                className="rounded-full bg-gradient-to-r from-red-500 to-[#fd5b5b] px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:brightness-110 transition-all active:scale-95"
              >
                Sign Up
              </NavLink>
            </div>
          )}
        </div>

        {/* Mobile Toggle Menu */}
        <button
          className="rounded-full border border-white/10 p-2 text-white hover:bg-white/5 transition md:hidden cursor-pointer"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile Drawer Dropdown */}
      {menuOpen && (
        <div className="absolute top-16 left-0 right-0 border-b border-white/5 bg-slate-950/95 px-4 py-5 space-y-3 md:hidden shadow-2xl backdrop-blur-xl">
          {currentNavLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={mobileLinkClass} onClick={() => setMenuOpen(false)}>
              {link.label}
            </NavLink>
          ))}
          <div className="border-t border-white/5 pt-3">
            {loggedIn ? (
              <button
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="w-full rounded-2xl bg-gradient-to-r from-red-500 to-[#fd5b5b] py-3 text-center font-bold text-white shadow-lg cursor-pointer"
              >
                Logout
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <NavLink
                  to="/login"
                  className="block w-full py-3 text-center font-semibold text-slate-300 hover:text-white rounded-2xl hover:bg-white/5 transition"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign In
                </NavLink>
                <NavLink
                  to="/register"
                  className="block w-full rounded-2xl bg-gradient-to-r from-red-500 to-[#fd5b5b] py-3 text-center font-bold text-white shadow-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign Up
                </NavLink>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
