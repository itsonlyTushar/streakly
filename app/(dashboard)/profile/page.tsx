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
} from "lucide-react";
import Image from "next/image";
import { useToast } from "@/components/ui/toast";
import { Switch } from "@/components/ui/switch";
import { useSound } from "@/components/sound-provider";
import Link from "next/link";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: profile, isLoading } = useProfile();
  const updateMutation = useUpdateProfile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [newBio, setNewBio] = useState("");
  const { soundEnabled, setSoundEnabled } = useSound();

  // Sync internal state when profile data loads
  useEffect(() => {
    if (profile?.bio) {
      setNewBio(profile.bio);
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

  if (!user) return null;

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
              <div className="animate-pulse flex space-y-2 flex-col">
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
      </div>

      <div className="pt-8 border-t border-border/20">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6 px-2">
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
      </div>
    </div>
  );
}
