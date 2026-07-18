import React from "react";
import { useNavigate } from "react-router-dom";
import ChatIcon from "@mui/icons-material/Chat";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import RateReviewIcon from "@mui/icons-material/RateReview";
import AirIcon from "@mui/icons-material/Air";

const features = [
  {
    icon: <RestaurantIcon className="text-[#fd5b5b]" fontSize="large" />,
    title: "Diet & Calorie Plans",
    desc: "Personalized meal plans with calorie tracking and food suitability checks.",
  },
  {
    icon: <FitnessCenterIcon className="text-[#fd5b5b]" fontSize="large" />,
    title: "Exercise Plans",
    desc: "Custom workouts based on your body, goals, and health conditions.",
  },
  {
    icon: <AirIcon className="text-[#fd5b5b]" fontSize="large" />,
    title: "Environment-Aware Tips",
    desc: "Health advice based on your location, climate, and air quality.",
  },
  {
    icon: <LocalHospitalIcon className="text-[#fd5b5b]" fontSize="large" />,
    title: "Nearby Medical Help",
    desc: "Find pharmacies, clinics, and hospitals with Google ratings.",
  },
  {
    icon: <RateReviewIcon className="text-[#fd5b5b]" fontSize="large" />,
    title: "Community Reviews",
    desc: "Read and share real experiences from other HealthMate users.",
  },
];

const quickStats = [
  { label: "AI care", value: "24/7" },
  { label: "Places found", value: "Nearby" },
  { label: "Experience", value: "Smart" },
];

const Homepage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-white">
      <section className="relative overflow-hidden px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(253,91,91,0.25),_transparent_35%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#fd5b5b]/30 bg-[#fd5b5b]/10 px-4 py-1.5 text-sm font-medium text-[#fd5b5b]">
                <ChatIcon fontSize="small" /> AI-Powered Health Assistant
              </div>

              <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
                Your personal
                <span className="block text-[#fd5b5b]">health companion</span>
              </h1>

              <p className="mt-6 text-base leading-8 text-slate-300 sm:text-lg">
                From medical guidance and diet suggestions to nearby clinics and trusted reviews,
                HealthMate makes healthy living feel easier, calmer, and more personal.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => navigate("/chatbot")}
                  className="rounded-full bg-[#fd5b5b] px-8 py-3 font-semibold text-white shadow-[0_0_30px_rgba(253,91,91,0.25)] transition-all hover:bg-[#e04a4a]"
                >
                  Start Health Chat
                </button>
                <button
                  onClick={() => navigate("/nearby")}
                  className="rounded-full border border-white/15 bg-white/5 px-8 py-3 font-semibold text-white transition-all hover:bg-white/10"
                >
                  Find Nearby Clinics
                </button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {quickStats.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                    <p className="text-xl font-semibold text-white">{item.value}</p>
                    <p className="text-sm text-slate-400">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6 md:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fd5b5b]/20 text-[#fd5b5b]">
                  <LocalHospitalIcon fontSize="large" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">HealthMate essentials</p>
                  <p className="text-sm text-slate-400">Designed to feel helpful in every moment.</p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  "Personalized medical guidance with a calm, modern interface",
                  "Quick access to nearby hospitals, clinics, and pharmacies",
                  "Trusted community reviews that support smarter choices",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#fd5b5b]">What HealthMate offers</p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Everything you need for everyday wellness</h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-[24px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-[#fd5b5b]/40"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fd5b5b]/10">{f.icon}</div>
                <h3 className="mb-2 text-lg font-semibold text-white">{f.title}</h3>
                <p className="text-sm leading-7 text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[32px] border border-[#fd5b5b]/20 bg-gradient-to-br from-[#fd5b5b]/15 via-slate-900/70 to-slate-950/80 p-8 md:p-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#fd5b5b]">Ready to explore?</p>
              <h3 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Start with a quick health conversation or find nearby support instantly.</h3>
            </div>
            <button
              onClick={() => navigate("/chatbot")}
              className="rounded-full border border-[#fd5b5b]/30 bg-[#fd5b5b] px-6 py-3 font-semibold text-white transition hover:bg-[#e04a4a]"
            >
              Open AI Assistant
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Homepage;
