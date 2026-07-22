import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { TextField, Button, Grid, MenuItem } from "@mui/material";
import {
  Person as PersonIcon,
  HealthAndSafety as HealthAndSafetyIcon,
  Save as SaveIcon
} from "@mui/icons-material";
import { useAuthStore } from "../store/useAuthStore";

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const user = useAuthStore((state) => state.user);
  const updateProfileState = useAuthStore((state) => state.updateProfileState);
  const storeToken = useAuthStore((state) => state.token);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);

  const [profile, setProfile] = useState({
    age: "",
    gender: "",
    weight: "",
    height: "",
    vegpreference: "",
    healthGoal: "",
    healthProblem: "",
    allergy: "",
    locality: "",
  });

  useEffect(() => {
    if (!storeToken) {
      navigate("/login");
      return;
    }
    if (!user) {
      fetchProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [storeToken, user, fetchProfile, navigate]);

  useEffect(() => {
    if (user?.profile) {
      setProfile({
        age: user.profile.age || "",
        gender: user.profile.gender || "",
        weight: user.profile.weight || "",
        height: user.profile.height || "",
        vegpreference: user.profile.vegpreference || "",
        healthGoal: user.profile.healthGoal || "",
        healthProblem: user.profile.healthProblem || "",
        allergy: user.profile.allergy || "",
        locality: user.profile.locality || "",
      });
    }
  }, [user]);

  const handleChange = (field) => (e) => {
    setProfile((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await axios.put("/api/v1/auth/profile", profile);
      if (data?.user) {
        updateProfileState(data.user);
        toast.success("Profile saved successfully!");
      }
    } catch (err) {
      console.error("Failed to save profile in console:", err);
      toast.error(err.response?.data?.error || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 rounded-[24px] border border-white/10 bg-slate-900/70 px-8 py-8 backdrop-blur-xl">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#fd5b5b] border-t-transparent" />
          <p className="text-slate-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 text-white md:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center gap-4 rounded-[28px] border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#fd5b5b]/30 bg-[#fd5b5b]/10">
            <PersonIcon sx={{ fontSize: 36, color: "#fd5b5b" }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white md:text-3xl">{user?.username}</h1>
            <p className="text-sm text-slate-400">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="glass-card p-6 md:p-8">
            <div className="mb-6 flex items-center gap-2">
              <HealthAndSafetyIcon className="text-[#fd5b5b]" />
              <h2 className="text-lg font-semibold text-white md:text-xl">Personal health profile</h2>
            </div>
            <p className="mb-6 text-sm leading-7 text-slate-400">
              Fill in your details below so HealthMate AI can tailor diet plans, exercise recommendations, and environmental alerts to your body.
            </p>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Age"
                  placeholder="e.g. 25"
                  value={profile.age}
                  onChange={handleChange("age")}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Gender"
                  value={profile.gender}
                  onChange={handleChange("gender")}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Weight (kg)"
                  placeholder="e.g. 70"
                  value={profile.weight}
                  onChange={handleChange("weight")}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Height (cm)"
                  placeholder="e.g. 175"
                  value={profile.height}
                  onChange={handleChange("height")}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Diet Preference"
                  value={profile.vegpreference}
                  onChange={handleChange("vegpreference")}
                >
                  <MenuItem value="Veg">Vegetarian</MenuItem>
                  <MenuItem value="Non-Veg">Non-Vegetarian</MenuItem>
                  <MenuItem value="Vegan">Vegan</MenuItem>
                  <MenuItem value="Keto">Keto</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Locality / City"
                  placeholder="e.g. Mumbai, India"
                  value={profile.locality}
                  onChange={handleChange("locality")}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Primary Health Goal"
                  placeholder="e.g. Weight loss, muscle gain, cardio health"
                  value={profile.healthGoal}
                  onChange={handleChange("healthGoal")}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Active Health Conditions"
                  placeholder="e.g. Diabetes, Hypertension, Asthma"
                  value={profile.healthProblem}
                  onChange={handleChange("healthProblem")}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Allergies"
                  placeholder="e.g. Peanuts, Dairy, Gluten (comma separated)"
                  value={profile.allergy}
                  onChange={handleChange("allergy")}
                />
              </Grid>
            </Grid>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              startIcon={<SaveIcon />}
              className="!rounded-full !bg-[#fd5b5b] !px-8 !py-3 !font-semibold !text-white hover:!bg-[#e04a4a] !normal-case"
            >
              {saving ? "Saving changes..." : "Save profile"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
