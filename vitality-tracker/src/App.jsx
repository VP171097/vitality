import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, AreaChart, Area, ReferenceLine, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Activity, Droplets, Calendar, Save, TrendingDown, 
  Award, Zap, UtensilsCrossed, CheckCircle, PlusCircle, Flame, Target, Trash2, 
  Sparkles, MessageSquare, Loader2, Info, Heart, Settings, User, LogOut, Lock, Mail,
  Dumbbell, Timer, Move, Footprints, Smartphone
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  signOut, onAuthStateChanged, updateProfile 
} from "firebase/auth";
import { 
  getFirestore, doc, setDoc, onSnapshot 
} from "firebase/firestore";

// --- FIREBASE SETUP ---
// NOTE: In a real deployment, these would be environment variables. 
// For this artifact environment, we use the injected globals.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'vitality-web'; // Fixed ID for your app

// --- DEFAULTS ---
const APP_NAME = "Vitality";
const DEFAULT_SETTINGS = {
  name: "New User",
  startWeight: 90,
  goalWeight: 80,
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 days
  height: 175,
  age: 30,
  gender: 'male'
};

const apiKey = import.meta.env.VITE_GEMINI_API_KEY; // API Key injected at runtime

// Helper to get local date string YYYY-MM-DD
const getToday = () => new Date().toLocaleDateString('en-CA');

// --- GEMINI API HELPER ---
async function callGemini(prompt, systemInstruction = "") {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: { responseMimeType: "application/json" }
  };

  let delay = 1000;
  for (let i = 0; i < 5; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return JSON.parse(text);
    } catch (error) {
      if (i === 4) throw error;
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }
}

// --- AUTH COMPONENT ---
function AuthScreen({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-emerald-500 p-3 rounded-xl mb-4 shadow-lg shadow-emerald-500/20">
            <Activity size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">{APP_NAME}</h1>
          <p className="text-slate-400 text-center text-sm">
            Your personal AI-powered fitness journey starts here.
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-500" size={18} />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-emerald-500 focus:outline-none transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-emerald-500 focus:outline-none transition-all"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-emerald-500 focus:outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-xs">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20}/> : (isSignUp ? "Create Account" : "Sign In")}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            {isSignUp ? "Already have an account? Sign In" : "New to Vitality? Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- MAIN APP COMPONENT ---
export default function App() {
  // --- REAL USER AUTHENTICATION ---
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notification, setNotification] = useState(null);
  
  // AI States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [coachMessage, setCoachMessage] = useState(null);

  // Data States
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [logs, setLogs] = useState([]);
  const [foodLogs, setFoodLogs] = useState({});
  const [activityLogs, setActivityLogs] = useState({}); 
  const [dataLoading, setDataLoading] = useState(false);

  // Google Fit States
  const [steps, setSteps] = useState(0);
  const [googleCalories, setGoogleCalories] = useState(0);
  const [isGoogleFitConnected, setIsGoogleFitConnected] = useState(false);

  const [todayLog, setTodayLog] = useState({
    weight: '', water: 0, workout: false, noSugar: false, lowSalt: false, vacuums: false
  });
  const [newFood, setNewFood] = useState({ name: '', cals: '', protein: '' });
  const [newActivity, setNewActivity] = useState({ description: '', duration: '' });

  const quickFoods = [
    { name: "3 Boiled Eggs (1 Yolk)", cals: 155, protein: 13 },
    { name: "Jeera Water + Lemon", cals: 10, protein: 0 },
    { name: "Grilled Chicken (150g)", cals: 250, protein: 45 },
    { name: "Multigrain Roti (1)", cals: 100, protein: 3 },
    { name: "Dal (1 Bowl Thick)", cals: 140, protein: 8 },
    { name: "Almonds (10)", cals: 70, protein: 2 },
    { name: "Green Tea", cals: 2, protein: 0 },
    { name: "Clear Soup (Veg/Chicken)", cals: 60, protein: 4 },
  ];

  // --- GOOGLE FIT SCRIPT LOADER ---
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    }
  }, []);

  // --- AUTH LISTENER ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- DATA SYNC (FIRESTORE) ---
  useEffect(() => {
    if (!user) return;
    setDataLoading(true);

    const settingsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'config');
    const logsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'logs', 'history');
    const foodRef = doc(db, 'artifacts', appId, 'users', user.uid, 'food', 'history');
    const activityRef = doc(db, 'artifacts', appId, 'users', user.uid, 'activity', 'history');

    // 1. Settings
    const settingsUnsub = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      } else {
        const newDefaults = { ...DEFAULT_SETTINGS, name: user.displayName || "New User" };
        setDoc(settingsRef, newDefaults);
        setSettings(newDefaults);
      }
    });

    // 2. Logs
    const logsUnsub = onSnapshot(logsRef, (docSnap) => {
      if (docSnap.exists()) {
        setLogs(docSnap.data().data || []);
      } else {
        setDoc(logsRef, { data: [] });
        setLogs([]);
      }
    });

    // 3. Food
    const foodUnsub = onSnapshot(foodRef, (docSnap) => {
      if (docSnap.exists()) {
        setFoodLogs(docSnap.data().data || {});
      } else {
        setDoc(foodRef, { data: {} });
        setFoodLogs({});
      }
    });

    // 4. Activity
    const activityUnsub = onSnapshot(activityRef, (docSnap) => {
      if (docSnap.exists()) {
        setActivityLogs(docSnap.data().data || {});
      } else {
        setDoc(activityRef, { data: {} });
        setActivityLogs({});
      }
      setDataLoading(false);
    });

    return () => {
      settingsUnsub();
      logsUnsub();
      foodUnsub();
      activityUnsub();
    };
  }, [user]);

  // --- LOCAL STATE UPDATE FOR TODAY ---
  useEffect(() => {
    const today = getToday();
    const existing = logs.find(l => l.date === today);
    if (existing) {
      setTodayLog(existing);
    } else {
      const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;
      setTodayLog({
        weight: lastLog ? lastLog.weight : settings.startWeight,
        water: 0,
        workout: false,
        noSugar: false,
        lowSalt: false,
        vacuums: false
      });
    }
  }, [logs, settings.startWeight]);


  // --- DATA HELPERS (FIRESTORE) ---
  const saveLogsToFirestore = async (newLogs) => {
    if (!user) return;
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'logs', 'history'), { data: newLogs }, { merge: true });
  };

  const saveFoodToFirestore = async (newFoodLogs) => {
    if (!user) return;
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'food', 'history'), { data: newFoodLogs }, { merge: true });
  };
  
  const saveActivityToFirestore = async (newActivityLogs) => {
    if (!user) return;
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'activity', 'history'), { data: newActivityLogs }, { merge: true });
  };

  const saveSettingsToFirestore = async (newSettings) => {
    if (!user) return;
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'config'), newSettings, { merge: true });
  };


  // --- ACTIONS ---
  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveLog = () => {
    const today = getToday();
    const newLogs = logs.filter(l => l.date !== today);
    const weightVal = parseFloat(todayLog.weight) || (newLogs.length > 0 ? newLogs[newLogs.length-1].weight : settings.startWeight);
    const newEntry = { ...todayLog, date: today, weight: weightVal };
    const sortedLogs = [...newLogs, newEntry].sort((a, b) => new Date(a.date) - new Date(b.date));
    setLogs(sortedLogs); 
    saveLogsToFirestore(sortedLogs);
    showNotification("Daily log saved!");
  };

  const handleUpdateSettings = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newSettings = {
      ...settings,
      name: formData.get('name'),
      goalWeight: parseFloat(formData.get('goalWeight')),
      endDate: formData.get('endDate'),
      startWeight: parseFloat(formData.get('startWeight')),
      height: parseFloat(formData.get('height')),
      age: parseFloat(formData.get('age')),
    };
    setSettings(newSettings);
    saveSettingsToFirestore(newSettings);
    showNotification("Settings updated!");
    setActiveTab('dashboard');
  };

  const addFood = (item) => {
    const today = getToday();
    const currentFoods = foodLogs[today] || [];
    let foodToAdd = item;
    if (!item) {
      if (!newFood.name || !newFood.cals) return;
      foodToAdd = { 
        id: Date.now(), 
        name: newFood.name, 
        cals: parseInt(newFood.cals), 
        protein: parseInt(newFood.protein) || 0 
      };
      setNewFood({ name: '', cals: '', protein: '' });
    } else {
      foodToAdd = { ...item, id: Date.now() };
    }
    const newFoodLogs = { ...foodLogs, [today]: [...currentFoods, foodToAdd] };
    setFoodLogs(newFoodLogs);
    saveFoodToFirestore(newFoodLogs);
    showNotification(`Added ${foodToAdd.name}`);
  };

  const removeFood = (id) => {
    const today = getToday();
    const currentFoods = foodLogs[today] || [];
    const newFoodLogs = { ...foodLogs, [today]: currentFoods.filter(f => f.id !== id) };
    setFoodLogs(newFoodLogs);
    saveFoodToFirestore(newFoodLogs);
  };
  
  const addActivity = (item) => {
    const today = getToday();
    const currentActivities = activityLogs[today] || [];
    const newActivityLogs = { ...activityLogs, [today]: [...currentActivities, { ...item, id: Date.now() }] };
    setActivityLogs(newActivityLogs);
    saveActivityToFirestore(newActivityLogs);
    showNotification(`Logged ${item.name}`);
  };
  
  const removeActivity = (id) => {
    const today = getToday();
    const currentActivities = activityLogs[today] || [];
    const newActivityLogs = { ...activityLogs, [today]: currentActivities.filter(a => a.id !== id) };
    setActivityLogs(newActivityLogs);
    saveActivityToFirestore(newActivityLogs);
  };

  // --- GOOGLE FIT INTEGRATION HANDLERS ---
  const handleGoogleConnect = () => {
    if (typeof google === 'undefined') {
      showNotification("Google API not loaded yet. Wait a moment.");
      return;
    }
    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.YOUR_GOOGLE_CLIENT_ID, // Replace with valid client ID in production
        scope: 'https://www.googleapis.com/auth/fitness.activity.read',
        callback: (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            setIsGoogleFitConnected(true);
            fetchFitData(tokenResponse.access_token);
          }
        },
      });
      // Mock for testing
      console.log("Simulating Google Fit Connection...");
      setIsGoogleFitConnected(true);
      const mockSteps = Math.floor(Math.random() * 5000) + 3000;
      setSteps(mockSteps);
      showNotification("Connected to Google Fit (Simulated)");
    } catch (e) {
      console.warn("Google Auth Error:", e);
      setIsGoogleFitConnected(true);
      setSteps(4500);
      showNotification("Simulated Google Fit Connection");
    }
  };

  const fetchFitData = async (accessToken) => {
    // Logic for fetching real data
    const end = new Date().getTime();
    const start = new Date().setHours(0,0,0,0);
    try {
      const response = await fetch("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate", {
        method: "POST",
        headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          "aggregateBy": [{ "dataTypeName": "com.google.step_count.delta", "dataSourceId": "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps" }],
          "bucketByTime": { "durationMillis": 86400000 },
          "startTimeMillis": start,
          "endTimeMillis": end
        })
      });
      const data = await response.json();
      console.log("Google Fit Data:", data);
    } catch (e) { console.error("Error fetching Google Fit data", e); }
  };

  const handleSignOut = async () => {
     try {
       await signOut(auth);
       setLogs([]);
       setFoodLogs({});
       setActivityLogs({});
     } catch (e) {
       console.error("Sign out error", e);
     }
  };

  // --- CALCULATIONS ---
  const currentWeight = logs.length > 0 ? logs[logs.length - 1].weight : settings.startWeight;
  const calculateDynamicCalories = (weight) => {
    const bmr = (10 * weight) + (6.25 * settings.height) - (5 * settings.age) + 5;
    const tdee = bmr * 1.3; 
    let goal = Math.round(tdee - 750);
    return Math.max(1500, goal);
  };
  const dailyCalorieGoal = calculateDynamicCalories(currentWeight);

  const totalLost = (settings.startWeight - currentWeight).toFixed(1);
  const daysRemaining = Math.max(0, Math.ceil((new Date(settings.endDate) - new Date()) / (1000 * 60 * 60 * 24)));
  
  const todayFoods = foodLogs[getToday()] || [];
  const todayActivities = activityLogs[getToday()] || [];
  
  const todayCalories = todayFoods.reduce((sum, f) => sum + f.cals, 0);
  const todayProtein = todayFoods.reduce((sum, f) => sum + f.protein, 0);
  const todayBurned = todayActivities.reduce((sum, a) => sum + a.calories, 0);

  // --- GEMINI FUNCTIONS ---
  const handleAiFoodAdd = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    try {
      const prompt = `User description: "${aiInput}". Estimate calories and protein.`;
      const systemPrompt = `You are a nutritionist. Parse the food description into a JSON object with keys: "name" (short string), "cals" (integer), "protein" (integer grams). Estimate portion sizes if not specified. Example: {"name": "Chicken Sandwich", "cals": 450, "protein": 30}. Return ONLY JSON.`;
      const result = await callGemini(prompt, systemPrompt);
      if (result && result.name) {
        addFood(result);
        setAiInput('');
      } else {
        showNotification("Could not identify food. Try again.");
      }
    } catch (error) {
      console.error(error);
      showNotification("AI Error. Check connection.");
    } finally {
      setAiLoading(false);
    }
  };
  
  const handleAiActivityAdd = async () => {
    if (!newActivity.description || !newActivity.duration) return;
    setAiLoading(true);
    try {
      const prompt = `User weighing ${currentWeight}kg performed: "${newActivity.description}" for ${newActivity.duration} minutes. Estimate calories burned.`;
      const systemPrompt = `You are a sports scientist. Return a JSON object with keys: "name" (standardized activity name string), "calories" (integer estimated burned). Return ONLY JSON.`;
      const result = await callGemini(prompt, systemPrompt);
      if (result && result.name) {
        addActivity(result);
        setNewActivity({ description: '', duration: '' });
      } else {
        showNotification("Could not calculate activity. Try again.");
      }
    } catch (error) {
       console.error(error);
       showNotification("AI Error. Check connection.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiCoach = async () => {
    setAiLoading(true);
    setCoachMessage(null);
    try {
      const today = getToday();
      const recentLogs = logs.slice(-7);
      const stats = {
        currentWeight,
        daysLeft: daysRemaining,
        totalLost,
        recentHabits: recentLogs.map(l => ({ date: l.date, noSugar: l.noSugar, lowSalt: l.lowSalt })),
        todayCals: todayCalories,
        todayBurned: todayBurned,
        targetCals: dailyCalorieGoal,
        steps: steps
      };
      const prompt = `User Stats: ${JSON.stringify(stats)}. User Goal: Lose weight by ${settings.endDate} (Target ${settings.goalWeight}kg). Current Dynamic Calorie Goal: ${dailyCalorieGoal}`;
      const systemPrompt = `You are Coach Gemini. Analyze JSON data. Provide JSON object with one field "message" containing short, punchy advice (max 2 sentences).`;
      const result = await callGemini(prompt, systemPrompt);
      setCoachMessage(result.message);
    } catch (error) {
      console.error(error);
      showNotification("Coach is offline currently.");
    } finally {
      setAiLoading(false);
    }
  };

  const chartData = useMemo(() => {
    const data = [];
    let currDate = new Date(settings.startDate);
    const lastDate = new Date(settings.endDate);
    if (currDate > lastDate) return [];
    while (currDate <= lastDate) {
      const dateStr = currDate.toLocaleDateString('en-CA');
      const log = logs.find(l => l.date === dateStr);
      const foods = foodLogs[dateStr] || [];
      const activities = activityLogs[dateStr] || [];
      const cals = foods.reduce((sum, f) => sum + f.cals, 0);
      const burned = activities.reduce((sum, a) => sum + a.calories, 0);
      const totalDays = Math.max(1, (lastDate - new Date(settings.startDate)) / (1000 * 60 * 60 * 24));
      const daysPassed = (currDate - new Date(settings.startDate)) / (1000 * 60 * 60 * 24);
      const idealWeight = settings.startWeight - ((settings.startWeight - settings.goalWeight) * (daysPassed / totalDays));
      data.push({
        date: dateStr,
        actualWeight: log ? log.weight : null,
        idealWeight: parseFloat(idealWeight.toFixed(1)),
        calories: cals,
        burned: burned,
        habitScore: log ? ((log.workout?25:0) + (log.noSugar?25:0) + (log.lowSalt?25:0) + (log.vacuums?25:0)) : 0
      });
      currDate.setDate(currDate.getDate() + 1);
    }
    return data;
  }, [logs, foodLogs, activityLogs, settings]);

  const calorieData = [
    { name: 'Consumed', value: todayCalories, color: '#10b981' },
    { name: 'Remaining', value: Math.max(0, dailyCalorieGoal - todayCalories), color: '#1e293b' }
  ];

  // --- RENDER CONTROL ---
  if (authLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin mr-2"/> Loading Vitality...</div>;
  if (!user) return <AuthScreen />;
  if (dataLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin mr-2"/> Syncing Data...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-32 md:pb-0 flex flex-col">
      {/* HEADER */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-20 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-lg text-white shadow-emerald-500/20 shadow-lg">
              <Activity size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg md:text-xl text-white leading-tight tracking-tight">{APP_NAME}</h1>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-emerald-400 font-medium">GOAL: {settings.goalWeight}KG</span>
                <span className="text-slate-600">|</span>
                <span className="text-blue-400 font-medium">{daysRemaining} DAYS LEFT</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
               <div className="text-xs text-slate-400 font-medium tracking-wider">CURRENT</div>
               <div className="font-bold text-xl text-white">{currentWeight}<span className="text-sm font-normal text-slate-500 ml-1">kg</span></div>
             </div>
             <button onClick={handleSignOut} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
               <LogOut size={20} />
             </button>
          </div>
        </div>
      </header>

      {/* NOTIFICATION */}
      {notification && (
        <div className="fixed top-24 right-4 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl animate-bounce z-50 flex items-center gap-2 font-medium">
          <CheckCircle size={18} /> {notification}
        </div>
      )}

      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 flex-grow w-full">
        {/* TAB NAV */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-sm overflow-x-auto">
          {['dashboard', 'tracker', 'food', 'activity', 'analytics', 'settings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[80px] py-2.5 px-4 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider transition-all ${
                activeTab === tab ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab === 'settings' ? <Settings size={16} className="mx-auto" /> : tab}
            </button>
          ))}
        </div>

        {/* --- DASHBOARD VIEW --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="bg-gradient-to-br from-indigo-900/50 to-slate-900 p-5 rounded-xl border border-indigo-500/30 relative overflow-hidden">
               <div className="flex items-start gap-4">
                  <div className="bg-indigo-500 p-2 rounded-lg text-white mt-1 shadow-lg shadow-indigo-500/20"><Sparkles size={24} /></div>
                  <div className="flex-1">
                    <h2 className="text-indigo-300 font-bold text-sm uppercase tracking-wider mb-1">Coach Gemini Insight</h2>
                    {coachMessage ? <p className="text-white font-medium leading-relaxed animate-in fade-in">{coachMessage}</p> 
                    : <p className="text-slate-400 text-sm">Need a quick status check? Tap the button to get AI analysis.</p>}
                    <button onClick={handleAiCoach} disabled={aiLoading} className="mt-3 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
                      {aiLoading ? <Loader2 className="animate-spin" size={14}/> : <MessageSquare size={14}/>} {aiLoading ? "ANALYZING..." : "ASK COACH"}
                    </button>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Total Loss</p>
                <h3 className="text-3xl font-bold text-white mt-1">{totalLost}<span className="text-sm text-emerald-500 ml-1">kg</span></h3>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Calories In</p>
                <h3 className={`text-3xl font-bold mt-1 ${todayCalories > dailyCalorieGoal ? 'text-red-500' : 'text-blue-500'}`}>{todayCalories}</h3>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                 <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Calories Out</p>
                 <h3 className="text-3xl font-bold text-orange-500 mt-1">{todayBurned}</h3>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Daily Goal</p>
                <h3 className="text-3xl font-bold text-emerald-500 mt-1 flex items-baseline gap-1">{dailyCalorieGoal}<span className="text-xs font-normal text-slate-500">kcal</span></h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-slate-900 p-5 rounded-xl border border-slate-800 h-80 shadow-sm">
                <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Activity size={16} className="text-emerald-500"/> Weight Trajectory</h2>
                <ResponsiveContainer width="100%" height="90%">
                  <AreaChart data={chartData}>
                    <defs><linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis domain={['auto', 'auto']} hide />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="idealWeight" stroke="#475569" strokeDasharray="5 5" dot={false} strokeWidth={2}/>
                    <Area type="monotone" dataKey="actualWeight" stroke="#10b981" fillOpacity={1} fill="url(#colorWeight)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 h-80 flex flex-col items-center justify-center relative shadow-sm">
                <h2 className="absolute top-5 left-5 text-sm font-bold text-white flex items-center gap-2"><Flame size={16} className="text-orange-500"/> Daily Fuel</h2>
                <div className="w-48 h-48 relative">
                   <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={calorieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">{calorieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie></PieChart></ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl font-bold text-white">{todayCalories}</span><span className="text-xs text-slate-500 uppercase font-bold">of {dailyCalorieGoal} kcal</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TRACKER VIEW --- */}
        {activeTab === 'tracker' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-8 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                 <h2 className="text-xl font-bold text-white flex items-center gap-2"><Calendar size={20} className="text-emerald-500"/> {getToday()}</h2>
                 <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full font-medium">Daily Log</span>
              </div>
              <div className="space-y-2">
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider">Morning Weight</label>
                <div className="flex items-center gap-4">
                  <input type="number" value={todayLog.weight} onChange={(e) => setTodayLog({...todayLog, weight: e.target.value})} className="bg-slate-800 text-white text-4xl font-bold p-4 rounded-xl w-40 border border-slate-700 focus:border-emerald-500 outline-none transition-all placeholder-slate-700" step="0.1" placeholder="00.0" />
                  <span className="text-slate-500 font-medium">kg</span>
                </div>
              </div>
              <div className="space-y-4 bg-slate-800/30 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between items-end">
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2"><Droplets size={14} className="text-blue-500"/> Water Intake</label>
                  <span className="text-2xl font-bold text-blue-400">{todayLog.water} <span className="text-sm text-slate-500">/ 3.5 L</span></span>
                </div>
                <input type="range" min="0" max="4" step="0.5" value={todayLog.water} onChange={(e) => setTodayLog({...todayLog, water: parseFloat(e.target.value)})} className="w-full h-4 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[{id: 'workout', label: 'Workout', sub: 'Hit daily goal', icon: Activity}, {id: 'noSugar', label: 'Zero Sugar', sub: 'No sweets/soda', icon: UtensilsCrossed}, {id: 'lowSalt', label: 'Low Salt', sub: 'No pickles/chips', icon: Droplets}, {id: 'vacuums', label: 'Vacuums', sub: 'Core exercise', icon: Zap}].map(h => (
                  <label key={h.id} className={`group flex items-center p-4 rounded-xl border cursor-pointer transition-all ${todayLog[h.id] ? 'bg-emerald-900/20 border-emerald-500/50' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}>
                    <input type="checkbox" checked={todayLog[h.id]} onChange={(e) => setTodayLog({...todayLog, [h.id]: e.target.checked})} className="hidden" />
                    <div className={`p-3 rounded-full mr-4 transition-all ${todayLog[h.id] ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600'}`}><h.icon size={20} /></div>
                    <div><span className={`block font-bold transition-colors ${todayLog[h.id] ? 'text-white' : 'text-slate-300'}`}>{h.label}</span><span className="text-xs text-slate-500 font-medium">{h.sub}</span></div>
                    {todayLog[h.id] && <CheckCircle className="ml-auto text-emerald-500 animate-in zoom-in" size={20} />}
                  </label>
                ))}
              </div>
              <button onClick={handleSaveLog} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-emerald-900/20 active:scale-[0.99] transition-all"><Save size={20} /> SAVE DAILY LOG</button>
            </div>
          </div>
        )}

        {/* --- FOOD LOGGING VIEW --- */}
        {activeTab === 'food' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
                  <span className="text-xs text-slate-500 font-bold uppercase flex items-center justify-center gap-1">Calories Left <Info size={12} className="text-slate-600"/></span>
                  <div className={`text-2xl font-bold ${dailyCalorieGoal - todayCalories < 0 ? 'text-red-500' : 'text-white'}`}>{dailyCalorieGoal - todayCalories}</div>
               </div>
               <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
                  <span className="text-xs text-slate-500 font-bold uppercase">Protein</span>
                  <div className="text-2xl font-bold text-amber-500">{todayProtein}g</div>
               </div>
            </div>
            <div className="bg-indigo-900/20 p-5 rounded-xl border border-indigo-500/30">
               <h3 className="text-xs text-indigo-400 font-bold uppercase mb-2 flex items-center gap-2"><Sparkles size={14}/> AI Magic Food Logger</h3>
               <div className="flex gap-2">
                  <input placeholder="e.g. 2 eggs and a slice of toast" className="flex-1 bg-slate-900 rounded-lg px-3 py-3 text-sm text-white border border-slate-700 focus:border-indigo-500 outline-none placeholder-slate-600" value={aiInput} onChange={(e) => setAiInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAiFoodAdd()} />
                  <button onClick={handleAiFoodAdd} disabled={aiLoading} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50">{aiLoading ? <Loader2 className="animate-spin" size={18} /> : "ADD"}</button>
               </div>
            </div>
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
               <h3 className="text-xs text-slate-400 font-bold uppercase mb-4 flex items-center gap-2"><Zap size={14} className="text-yellow-500"/> Shortcuts</h3>
               <div className="flex flex-wrap gap-2">
                  {quickFoods.map((f, i) => (<button key={i} onClick={() => addFood(f)} className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium py-2 px-3 rounded-lg border border-slate-700 transition-all active:scale-95 flex items-center gap-2">{f.name} <span className="text-emerald-500 text-[10px]">{f.cals}</span></button>))}
               </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs text-slate-500 font-bold uppercase pl-2">Consumed Today</h3>
              {todayFoods.length === 0 ? <div className="text-center py-8 text-slate-600 text-sm">No food logged yet today.</div> : todayFoods.map((f) => (
                <div key={f.id} className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex justify-between items-center animate-in fade-in">
                   <div><div className="text-sm font-bold text-white">{f.name}</div><div className="text-xs text-slate-500">{f.cals} kcal • {f.protein}g protein</div></div>
                   <button onClick={() => removeFood(f.id)} className="text-slate-600 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* --- ACTIVITY VIEW --- */}
        {activeTab === 'activity' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
             
             {/* GOOGLE FIT SYNC CARD */}
             <div className={`p-6 rounded-xl border flex justify-between items-center shadow-sm transition-all ${isGoogleFitConnected ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-slate-900 border-slate-800'}`}>
                <div>
                   <p className="text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                     <Smartphone size={14}/> Google Fit
                   </p>
                   {isGoogleFitConnected ? (
                     <div className="flex items-baseline gap-2">
                        <h2 className="text-4xl font-bold text-white">{steps.toLocaleString()}</h2>
                        <span className="text-sm text-slate-400 font-medium">steps today</span>
                     </div>
                   ) : (
                     <div>
                       <h2 className="text-lg font-bold text-white">Sync Activity</h2>
                       <p className="text-xs text-slate-500">Track real steps & calories.</p>
                     </div>
                   )}
                </div>
                <button 
                  onClick={handleGoogleConnect}
                  disabled={isGoogleFitConnected}
                  className={`p-3 rounded-full flex items-center justify-center transition-all ${isGoogleFitConnected ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-indigo-400 hover:bg-slate-700'}`}
                >
                   {isGoogleFitConnected ? <CheckCircle size={24} /> : <Footprints size={24} />}
                </button>
             </div>

             {/* Total Burned Card */}
             <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex justify-between items-center shadow-sm">
                <div>
                   <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Burned (Est)</p>
                   <h2 className="text-4xl font-bold text-orange-500">{todayBurned + Math.round(steps * 0.04)}<span className="text-sm text-slate-500 ml-2 font-medium">kcal</span></h2>
                   <p className="text-[10px] text-slate-600 mt-1">Activities + Steps</p>
                </div>
                <div className="bg-orange-500/10 p-3 rounded-full">
                   <Flame size={32} className="text-orange-500" />
                </div>
             </div>

             {/* Activity Input */}
             <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
               <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                 <Dumbbell size={20} className="text-emerald-500"/> Manual Log
               </h3>
               <div className="space-y-4">
                 <div>
                   <label className="block text-slate-400 text-xs font-bold uppercase mb-1">Activity Name</label>
                   <div className="relative">
                     <Move className="absolute left-3 top-3 text-slate-500" size={18} />
                     <input 
                       placeholder="e.g. Running, Cycling, Yoga" 
                       className="w-full bg-slate-950 rounded-lg py-3 pl-10 pr-4 text-white border border-slate-700 focus:border-emerald-500 outline-none"
                       value={newActivity.description}
                       onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                     />
                   </div>
                 </div>
                 <div>
                   <label className="block text-slate-400 text-xs font-bold uppercase mb-1">Duration (Minutes)</label>
                   <div className="relative">
                     <Timer className="absolute left-3 top-3 text-slate-500" size={18} />
                     <input 
                       type="number"
                       placeholder="30" 
                       className="w-full bg-slate-950 rounded-lg py-3 pl-10 pr-4 text-white border border-slate-700 focus:border-emerald-500 outline-none"
                       value={newActivity.duration}
                       onChange={(e) => setNewActivity({...newActivity, duration: e.target.value})}
                     />
                   </div>
                 </div>
                 <button 
                    onClick={handleAiActivityAdd} 
                    disabled={aiLoading || !newActivity.description || !newActivity.duration}
                    className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    {aiLoading ? <Loader2 className="animate-spin" size={20}/> : <PlusCircle size={20}/>}
                    {aiLoading ? "Calculating..." : "Calculate & Add Activity"}
                 </button>
                 <p className="text-xs text-center text-slate-500">
                    <Sparkles size={12} className="inline mr-1 text-indigo-400"/>
                    AI will calculate calories based on your current weight ({currentWeight}kg).
                 </p>
               </div>
             </div>

             {/* Activity List */}
             <div className="space-y-2">
               <h3 className="text-xs text-slate-500 font-bold uppercase pl-2">Today's Activities</h3>
               {todayActivities.length === 0 ? (
                 <div className="text-center py-10 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed text-slate-500 text-sm">
                    No manual activities logged.
                 </div>
               ) : (
                 todayActivities.map((a) => (
                   <div key={a.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center animate-in fade-in">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-800 p-2 rounded-lg">
                          <Activity size={20} className="text-orange-400"/>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{a.name}</div>
                          <div className="text-xs text-slate-500 font-medium">~{a.calories} kcal burned</div>
                        </div>
                      </div>
                      <button onClick={() => removeActivity(a.id)} className="text-slate-600 hover:text-red-500 p-2 transition-colors">
                        <Trash2 size={16}/>
                      </button>
                   </div>
                 ))
               )}
             </div>
          </div>
        )}

        {/* --- ANALYTICS VIEW --- */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
             <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 h-80">
              <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2"><TrendingDown size={16} className="text-emerald-500"/> Full Weight History</h3>
              <ResponsiveContainer width="100%" height="90%"><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#334155" /><XAxis dataKey="date" stroke="#94a3b8" tickFormatter={d => d.slice(5)} fontSize={12}/><YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="#94a3b8" fontSize={12} width={30}/><Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} /><ReferenceLine y={settings.goalWeight} stroke="gold" strokeDasharray="3 3" /><Line type="monotone" dataKey="actualWeight" stroke="#10b981" strokeWidth={3} dot={{r:4}} /><Line type="monotone" dataKey="idealWeight" stroke="#64748b" strokeDasharray="5 5" dot={false} /></LineChart></ResponsiveContainer>
            </div>
            
            {/* Calories Burned History */}
             <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 h-64">
              <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2"><Flame size={16} className="text-orange-500"/> Activity & Burn History</h3>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={chartData.filter(d => d.burned > 0 || d.actualWeight !== null)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" tickFormatter={d => d.slice(8)} fontSize={12}/>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                  <Bar dataKey="burned" name="Calories Burned" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 h-64">
              <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2"><UtensilsCrossed size={16} className="text-emerald-500"/> Calorie Intake History</h3>
              <ResponsiveContainer width="100%" height="90%"><BarChart data={chartData.filter(d => d.actualWeight !== null)}><CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} /><XAxis dataKey="date" stroke="#94a3b8" tickFormatter={d => d.slice(8)} fontSize={12}/><Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} /><ReferenceLine y={dailyCalorieGoal} stroke="orange" strokeDasharray="3 3"/><Bar dataKey="calories" fill="#10b981" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
            </div>
            <button onClick={() => { if(confirm("Clear local cache?")) window.location.reload(); }} className="w-full py-3 text-slate-500 hover:text-white text-sm font-medium border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors">Refresh App</button>
          </div>
        )}

        {/* --- SETTINGS VIEW --- */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Settings size={20} className="text-emerald-500" /> Challenge Settings</h2>
              <form onSubmit={handleUpdateSettings} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xs text-slate-500 font-bold uppercase border-b border-slate-800 pb-2">Profile</h3>
                  <div><label className="block text-slate-400 text-xs font-bold uppercase mb-1">Your Name</label><input name="name" defaultValue={settings.name} className="w-full bg-slate-800 text-white rounded-lg p-3 border border-slate-700 focus:border-emerald-500 outline-none" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-slate-400 text-xs font-bold uppercase mb-1">Height (cm)</label><input name="height" type="number" defaultValue={settings.height} className="w-full bg-slate-800 text-white rounded-lg p-3 border border-slate-700 focus:border-emerald-500 outline-none" /></div>
                    <div><label className="block text-slate-400 text-xs font-bold uppercase mb-1">Age</label><input name="age" type="number" defaultValue={settings.age} className="w-full bg-slate-800 text-white rounded-lg p-3 border border-slate-700 focus:border-emerald-500 outline-none" /></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xs text-slate-500 font-bold uppercase border-b border-slate-800 pb-2">Targets</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-slate-400 text-xs font-bold uppercase mb-1">Start Weight (Kg)</label><input name="startWeight" type="number" step="0.1" defaultValue={settings.startWeight} className="w-full bg-slate-800 text-white rounded-lg p-3 border border-slate-700 focus:border-emerald-500 outline-none" /></div>
                    <div><label className="block text-emerald-400 text-xs font-bold uppercase mb-1">Goal Weight (Kg)</label><input name="goalWeight" type="number" step="0.1" defaultValue={settings.goalWeight} className="w-full bg-slate-800 text-white rounded-lg p-3 border border-emerald-500/50 focus:border-emerald-500 outline-none font-bold" /></div>
                  </div>
                  <div><label className="block text-blue-400 text-xs font-bold uppercase mb-1">Deadline Date</label><input name="endDate" type="date" defaultValue={settings.endDate} className="w-full bg-slate-800 text-white rounded-lg p-3 border border-blue-500/50 focus:border-blue-500 outline-none" /></div>
                </div>
                <div className="pt-4"><button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-[0.99] transition-all"><Save size={20} /> UPDATE SETTINGS</button></div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8 px-4 mt-auto">
         <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2"><Heart className="text-emerald-500" size={20}/> About {APP_NAME}</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-sm">The all-in-one AI fitness companion. Track meals, log workouts, and get intelligent coaching insights.</p>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2"><Smartphone className="text-emerald-500" size={20}/> Contact {APP_NAME}</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-sm">+91-9990091677</p>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2"><Mail className="text-emerald-500" size={20}/> Mail {APP_NAME}</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-sm">pandey.vivek7011@gmail.com</p>
              </div>
              <div className="flex flex-col md:items-end text-slate-500 text-sm"><p className="mb-1">© 2025 {APP_NAME} Project</p><p>Built by Vivek Pandey</p></div>
            </div>
         </div>
      </footer>

      {/* MOBILE NAV */}
      <nav className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 md:hidden flex justify-around p-3 z-30 pb-safe shadow-lg">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center transition-colors ${activeTab === 'dashboard' ? 'text-emerald-500' : 'text-slate-500'}`}><Activity size={20} /><span className="text-[10px] mt-1 font-medium">Dash</span></button>
        <button onClick={() => setActiveTab('tracker')} className={`flex flex-col items-center transition-colors ${activeTab === 'tracker' ? 'text-emerald-500' : 'text-slate-500'}`}><Calendar size={20} /><span className="text-[10px] mt-1 font-medium">Log</span></button>
        <button onClick={() => setActiveTab('food')} className={`flex flex-col items-center transition-colors ${activeTab === 'food' ? 'text-emerald-500' : 'text-slate-500'}`}><UtensilsCrossed size={20} /><span className="text-[10px] mt-1 font-medium">Food</span></button>
        <button onClick={() => setActiveTab('activity')} className={`flex flex-col items-center transition-colors ${activeTab === 'activity' ? 'text-emerald-500' : 'text-slate-500'}`}><Dumbbell size={20} /><span className="text-[10px] mt-1 font-medium">Move</span></button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center transition-colors ${activeTab === 'settings' ? 'text-emerald-500' : 'text-slate-500'}`}><Settings size={20} /><span className="text-[10px] mt-1 font-medium">Config</span></button>
      </nav>
    </div>
  );
}