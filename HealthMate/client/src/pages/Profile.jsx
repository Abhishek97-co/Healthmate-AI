import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { TextField, Button, Grid, MenuItem } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import SaveIcon from "@mui/icons-material/Save";

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

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
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data } = await axios.get("/api/v1/auth/profile");
        if (data?.user) {
          setUser(data.user);
          if (data.user.profile) {
            setProfile({
              age: data.user.profile.age || "",
              gender: data.user.profile.gender || "",
              weight: data.user.profile.weight || "",
              height: data.user.profile.height || "",
              vegpreference: data.user.profile.vegpreference || "",
              healthGoal: data.user.profile.healthGoal || "",
              healthProblem: data.user.profile.healthProblem || "",
              allergy: data.user.profile.allergy || "",
              locality: data.user.profile.locality || "",
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile in console:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (field) => (e) => {
    setProfile((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await axios.put("/api/v1/auth/profile", profile);
      if (data?.user) {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        toast.success("Profile saved successfully!");
      }
    } catch (err) {
      console.error("Failed to save profile in console:", err);
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
                  sx={{ "& .MuiInputBase-root": { bgcolor: "#f4e9e7", borderRadius: "10px", color: "black" } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Gender"
                  value={profile.gender}
                  onChange={handleChange("gender")}
                  sx={{ "& .MuiInputBase-root": { bgcolor: "#f4e9e7", borderRadius: "10px", color: "black" } }}
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
                  sx={{ "& .MuiInputBase-root": { bgcolor: "#f4e9e7", borderRadius: "10px", color: "black" } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Height (cm)"
                  placeholder="e.g. 175"
                  value={profile.height}
                  onChange={handleChange("height")}
                  sx={{ "& .MuiInputBase-root": { bgcolor: "#f4e9e7", borderRadius: "10px", color: "black" } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Diet Preference"
                  value={profile.vegpreference}
                  onChange={handleChange("vegpreference")}
                  sx={{ "& .MuiInputBase-root": { bgcolor: "#f4e9e7", borderRadius: "10px", color: "black" } }}
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
                  sx={{ "& .MuiInputBase-root": { bgcolor: "#f4e9e7", borderRadius: "10px", color: "black" } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Primary Health Goal"
                  placeholder="e.g. Weight loss, muscle gain, cardio health"
                  value={profile.healthGoal}
                  onChange={handleChange("healthGoal")}
                  sx={{ "& .MuiInputBase-root": { bgcolor: "#f4e9e7", borderRadius: "10px", color: "black" } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Active Health Conditions"
                  placeholder="e.g. Diabetes, Hypertension, Asthma"
                  value={profile.healthProblem}
                  onChange={handleChange("healthProblem")}
                  sx={{ "& .MuiInputBase-root": { bgcolor: "#f4e9e7", borderRadius: "10px", color: "black" } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Allergies"
                  placeholder="e.g. Peanuts, Dairy, Gluten (comma separated)"
                  value={profile.allergy}
                  onChange={handleChange("allergy")}
                  sx={{ "& .MuiInputBase-root": { bgcolor: "#f4e9e7", borderRadius: "10px", color: "black" } }}
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
