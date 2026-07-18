import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

const Navbar = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const loggedIn = !!localStorage.getItem("authToken");

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
      await axios.post("/api/v1/auth/logout");
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      delete axios.defaults.headers.common["Authorization"];
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Logout failure in console:", error);
    }
  };

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-full text-sm md:text-base font-medium transition-all ${
      isActive
        ? "text-[#fd5b5b] bg-white/10 shadow-[0_0_0_1px_rgba(253,91,91,0.25)]"
        : "text-slate-200 hover:text-white hover:bg-white/5"
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 md:h-20">
        <NavLink to="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
          <img
            src="/heart-attack.png"
            alt="HealthMate"
            className="h-8 shrink-0 drop-shadow-[0_0_12px_rgba(253,91,91,0.4)] sm:h-10"
          />
          <span className="truncate text-xl font-bold text-white sm:text-2xl md:text-3xl">HealthMate</span>
        </NavLink>

        <div className="hidden items-center gap-1 md:flex">
          {currentNavLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
          {loggedIn ? (
            <button
              onClick={handleLogout}
              className="ml-2 rounded-full bg-[#fd5b5b] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#e04a4a]"
            >
              Logout
            </button>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>Sign In</NavLink>
              <NavLink
                to="/register"
                className="ml-2 rounded-full bg-[#fd5b5b] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#e04a4a]"
              >
                Sign Up
              </NavLink>
            </>
          )}
        </div>

        <button
          className="rounded-full border border-white/10 p-2 text-white md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {menuOpen && (
        <div className="space-y-2 border-t border-white/10 bg-slate-950/95 px-4 py-4 md:hidden">
          {currentNavLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass} onClick={() => setMenuOpen(false)}>
              {link.label}
            </NavLink>
          ))}
          {loggedIn ? (
            <button
              onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}
              className="w-full rounded-full border border-[#fd5b5b]/40 px-3 py-2 text-left font-medium text-[#fd5b5b]"
            >
              Logout
            </button>
          ) : (
            <>
              <NavLink to="/login" className={linkClass} onClick={() => setMenuOpen(false)}>
                Sign In
              </NavLink>
              <NavLink
                to="/register"
                className="block rounded-full bg-[#fd5b5b] px-3 py-2 text-center font-semibold text-white"
                onClick={() => setMenuOpen(false)}
              >
                Sign Up
              </NavLink>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
