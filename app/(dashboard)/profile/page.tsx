"use client";

import { useAuth } from "@/components/auth-provider";
import { useState, useEffect } from "react";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import {
  User,
  Mail,
  UserCircle,
  Edit3,
  Save,
  X,
  Volume2,
  Bell,
  ShieldCheck,
  FileText,
  Sparkles,
  ExternalLink,
  Key,
  Eye,
  EyeOff,
  LogOut,
  Code,
} from "lucide-react";
import Image from "next/image";
import { useToast } from "@/components/ui/toast";
import { Switch } from "@/components/ui/switch";
import { useSound } from "@/components/sound-provider";
import Link from "next/link";

export default function ProfilePage() {
  const { user, loginWithGoogle, logout } = useAuth();
  const { toast } = useToast();
  const { data: profile, isLoading } = useProfile();
  const updateMutation = useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [newBio, setNewBio] = useState("");
  const { soundEnabled, setSoundEnabled } = useSound();

  // Gemini AI Key states
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isKeySaved, setIsKeySaved] = useState(false);

  // Load key from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const key = localStorage.getItem("streakly:dsa:gemini_api_key") || "";
      setGeminiApiKey(key);
      setIsKeySaved(!!key);
    }
  }, []);

  const handleSaveApiKey = () => {
    localStorage.setItem("streakly:dsa:gemini_api_key", geminiApiKey.trim());
    if (geminiApiKey.trim()) {
      localStorage.setItem("streakly:dsa:ai_enabled", "true");
      setIsKeySaved(true);
    }
    toast({
      title: "API Key Configured",
      description: "Your Gemini API Key has been saved successfully.",
      variant: "success",
    });
  };

  const handleClearApiKey = () => {
    setGeminiApiKey("");
    setIsKeySaved(false);
    localStorage.removeItem("streakly:dsa:gemini_api_key");
    localStorage.setItem("streakly:dsa:ai_enabled", "false");
    toast({
      title: "API Key Removed",
      description: "Gemini API Key cleared and AI companion disabled.",
      variant: "success",
    });
  };

  const [newLeetcode, setNewLeetcode] = useState("");

  // Sync internal state when profile data loads
  useEffect(() => {
    if (profile) {
      setNewBio(profile.bio || "");
      setNewLeetcode(profile.leetcodeUsername || "");
    }
  }, [profile]);

  const handleSaveBio = async () => {
    updateMutation.mutate({ bio: newBio }, {
      onSuccess: () => {
        setIsEditing(false);
        toast({
          title: "Profile Updated",
          description: "Your bio has been saved successfully.",
          variant: "success",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to update bio. Please try again.",
          variant: "error",
        });
      }
    });
  };

  const handleToggleEmail = async (checked: boolean) => {
    updateMutation.mutate({ emailNotifications: checked }, {
      onSuccess: () => {
        toast({
          title: "Settings Updated",
          description: `Email reminders ${checked ? "enabled" : "disabled"}.`,
          variant: "success",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to update settings. Please try again.",
          variant: "error",
        });
      }
    });
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <UserCircle className="w-12 h-12 text-primary" />
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-black font-v-headings">Sign in to see your profile</h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Create an account to track your progress, build streaks, and customize your experience.
          </p>
        </div>
        <button
          onClick={loginWithGoogle}
          className="flex items-center gap-3 bg-primary text-primary-foreground px-8 h-14 rounded-2xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-8 bg-secondary/30 p-8 rounded-3xl border border-border/50">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-xl">
            {user.photoURL ? (
              <Image
                src={user.photoURL}
                alt={user.displayName || "User"}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                <UserCircle className="w-16 h-16 text-primary/40" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 flex-1">
          <div>
            <h1 className="text-4xl font-black font-v-headings tracking-tight text-foreground">
              {user.displayName || "Explorer"}
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <Mail className="w-4 h-4" />
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <User className="w-4 h-4" />
              <span className="text-xs uppercase tracking-widest font-bold">
                UID: {user.uid.slice(0, 8)}...
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-background border border-border/60 rounded-3xl p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-v-headings flex items-center gap-2">
            Bio
          </h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 hover:bg-secondary rounded-xl transition-colors text-muted-foreground hover:text-primary"
            >
              <Edit3 className="w-5 h-5" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 hover:bg-destructive/10 rounded-xl transition-colors text-muted-foreground hover:text-destructive"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={handleSaveBio}
                disabled={updateMutation.isPending}
                className="p-2 hover:bg-primary/10 rounded-xl transition-colors text-primary disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <textarea
            value={newBio}
            onChange={(e) => setNewBio(e.target.value)}
            className="w-full h-32 p-4 bg-secondary/50 rounded-2xl border border-border/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none font-v-body"
            placeholder="Tell us about yourself..."
          />
        ) : (
          <div className="min-h-[100px] p-4 bg-secondary/20 rounded-2xl border border-transparent italic text-muted-foreground font-v-body">
            {isLoading ? (
              <div className="flex space-y-2 flex-col">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            ) : (
              profile?.bio || "No bio yet. Click the edit icon to add one!"
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2 flex items-center justify-between p-6 bg-secondary/20 rounded-3xl border border-border/40">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-background rounded-2xl text-primary shadow-sm border border-border/20">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Sound Effects</h3>
              <p className="text-sm text-muted-foreground">
                Interactive audio feedback
              </p>
            </div>
          </div>
          <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
        </div>

        <div className="md:col-span-2 flex items-center justify-between p-6 bg-secondary/20 rounded-3xl border border-border/40">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-background rounded-2xl text-primary shadow-sm border border-border/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Email Reminders</h3>
              <p className="text-sm text-muted-foreground">
                Daily revision notifications
              </p>
            </div>
          </div>
          <Switch
            checked={profile?.emailNotifications ?? true}
            onCheckedChange={handleToggleEmail}
            disabled={updateMutation.isPending}
          />
        </div>

        {/* LeetCode Integration Section */}
        <div className="md:col-span-2 flex flex-col p-6 bg-secondary/20 border border-border/40 rounded-3xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-background rounded-2xl text-primary shadow-sm border border-border/20">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground flex items-center gap-1.5">
                  LeetCode Integration
                </h3>
                <p className="text-sm text-muted-foreground">
                  Auto-import solved problems into your DSA Arena
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
              Enter your public LeetCode username below. Streakly will fetch your recent solved submissions and schedule them in your revision calendar automatically.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              <input
                type="text"
                value={newLeetcode}
                onChange={(e) => setNewLeetcode(e.target.value)}
                placeholder="Enter LeetCode username"
                className="flex-1 bg-background border border-border/60 focus:border-primary focus:ring-4 ring-primary/5 rounded-2xl px-4 py-3 text-sm outline-none transition-all"
              />
              <button
                type="button"
                onClick={async () => {
                  updateMutation.mutate(
                    { leetcodeUsername: newLeetcode.trim() },
                    {
                      onSuccess: () => {
                        toast({
                          title: "LeetCode Username Saved",
                          description: "Your LeetCode integration is ready.",
                          variant: "success",
                        });
                      },
                    }
                  );
                }}
                disabled={updateMutation.isPending || newLeetcode.trim() === (profile?.leetcodeUsername || "")}
                className="bg-primary text-primary-foreground hover:bg-primary/95 font-bold text-xs uppercase tracking-widest px-6 h-12 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:scale-100"
              >
                {updateMutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>

        {/* Gemini AI Integration Section */}
        <div className="md:col-span-2 flex flex-col p-6 bg-gradient-to-br from-violet-600/5 to-indigo-600/5 border border-violet-500/10 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-violet-500/10 rounded-2xl text-violet-500 shadow-sm border border-violet-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground flex items-center gap-1.5">
                  Gemini AI Auto-Fill
                </h3>
                <p className="text-sm text-muted-foreground">
                  Power up your DSA problem solver with intelligent auto-fill
                </p>
              </div>
            </div>
            <a
              href="https://aistudio.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-black uppercase tracking-widest text-violet-500 hover:text-violet-400 transition-colors flex items-center gap-1 self-start sm:self-auto"
            >
              Get Free API Key <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="space-y-3 relative z-10">
            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
              Configure your Gemini AI API Key once to enable instant, automatic generation of platform URLs, topic tags, optimal time/space complexities, intuitions, and working code solutions when adding problems to your DSA vault. Your key is stored locally in your browser and never leaves your device.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60">
                  <Key className="h-4 w-4" />
                </div>
                <input
                  type={showKey ? "text" : "password"}
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="Enter your AI Studio API key (starts with AIzaSy...)"
                  className="w-full bg-background border border-border/60 focus:border-violet-500 focus:ring-4 ring-violet-500/5 rounded-2xl pl-11 pr-11 py-3 text-sm outline-none transition-all font-mono"
                />
                {geminiApiKey && (
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  disabled={!geminiApiKey.trim()}
                  className="flex-1 sm:flex-initial bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-widest px-6 h-12 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-violet-500/10 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                >
                  Save Key
                </button>
                {isKeySaved && (
                  <button
                    type="button"
                    onClick={handleClearApiKey}
                    className="p-3 bg-secondary hover:bg-destructive/15 text-muted-foreground hover:text-destructive border border-border/40 hover:border-destructive/20 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all"
                    title="Remove API Key"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-border/20 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-2">
          Legal
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/privacy"
            className="flex items-center justify-between p-5 bg-secondary/10 hover:bg-secondary/30 rounded-2xl border border-border/40 transition-all group"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                Privacy Policy
              </span>
            </div>
          </Link>
          <Link
            href="/terms"
            className="flex items-center justify-between p-5 bg-secondary/10 hover:bg-secondary/30 rounded-2xl border border-border/40 transition-all group"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                Terms of Service
              </span>
            </div>
          </Link>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-4 p-5 bg-destructive/5 hover:bg-destructive/10 rounded-2xl border border-destructive/20 hover:border-destructive/40 transition-all group"
        >
          <div className="p-2 bg-destructive/10 rounded-xl text-destructive group-hover:bg-destructive/20 transition-colors">
            <LogOut className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-destructive">Sign out</p>
            <p className="text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
