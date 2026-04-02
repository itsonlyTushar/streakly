"use client";

import { useAuth } from "@/components/auth-provider";
import { useEffect, useState, use } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Save,
  ArrowLeft,
  Book,
  Pencil,
  ChevronRight,
  HelpCircle,
  Layout,
  Maximize2,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RichEditor } from "@/components/rich-editor";
import { CanvasDraw } from "@/components/notebook/canvas-draw";
import { cn } from "@/lib/utils";

export default function NotebookDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const [note, setNote] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [drawing, setDrawing] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [layoutMode, setLayoutMode] = useState<"split" | "text" | "canvas">("split");

  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !id) return;

    const fetchNote = async () => {
      const docRef = doc(db, "notebooks", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setNote(data);
        setTitle(data.title || "Untitled Note");
        setContent(data.content || "");
        setDrawing(data.drawing || "");
      }
    };

    fetchNote();
  }, [user, id]);

  const handleSave = async (forceTitle?: string, forceContent?: string, forceDrawing?: string) => {
    if (!user || !id) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "notebooks", id), {
        title: forceTitle ?? title,
        content: forceContent ?? content,
        drawing: forceDrawing ?? drawing,
        updatedAt: serverTimestamp(),
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error("Error saving note:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !note) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground animate-pulse font-bold text-2xl flex items-center gap-1">
          <Book className="h-8 w-8" />
          Loading Note...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-h-screen -m-4 md:-m-12 overflow-hidden bg-background">
      {/* Dynamic Navigation Bar */}
      <nav className="h-20 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-between px-6 md:px-10 z-20">
        <div className="flex items-center gap-6">
          <Link
            href="/notebook"
            className="p-3 rounded-2xl hover:bg-secondary transition-colors text-muted-foreground hover:text-primary active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="h-10 w-px bg-border/50 hidden md:block" />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => handleSave()}
            className="bg-transparent border-none focus:ring-0 text-2xl font-black tracking-tighter outline-none min-w-[200px] md:min-w-[400px]"
            placeholder="Name your session..."
          />
        </div>

        <div className="flex items-center gap-4">
           {/* Auto-save Indicator */}
           <div className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
             {isSaving ? (
               <div className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                 Syncing...
               </div>
             ) : lastSaved ? (
               <div className="flex items-center gap-2">
                 <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                 Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </div>
             ) : (
               "Unsaved Changes"
             )}
           </div>

           <div className="h-8 w-px bg-border/50 hidden md:block" />

           {/* View Modes */}
           <div className="bg-secondary/50 p-1 rounded-xl flex items-center gap-1 border border-border/10">
              <button
                onClick={() => setLayoutMode("text")}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  layoutMode === "text" ? "bg-white dark:bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-primary"
                )}
                title="Text Mode"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setLayoutMode("split")}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  layoutMode === "split" ? "bg-white dark:bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-primary"
                )}
                title="Split View"
              >
                <Layout className="h-4 w-4" />
              </button>
              <button
                onClick={() => setLayoutMode("canvas")}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  layoutMode === "canvas" ? "bg-white dark:bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-primary"
                )}
                title="Canvas Mode"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
           </div>

           <button
              onClick={() => handleSave()}
              disabled={isSaving}
              className="bg-primary text-primary-foreground h-12 px-6 rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
           >
              <Save className="h-4 w-4" />
              {isSaving ? "..." : "Save"}
           </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 bg-secondary/5 h-full relative">
        {/* Help Tip - Floating Bottom Left */}
        <div className="absolute bottom-8 left-8 z-30 p-4 bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-border/50 flex items-center gap-3 group/tip cursor-help">
           <div className="bg-primary/20 text-primary p-2 rounded-lg group-hover/tip:scale-110 transition-transform">
             <HelpCircle className="h-4 w-4" />
           </div>
           <div className="text-[10px] font-bold text-muted-foreground/60 leading-none">
             SAVED AUTOMATICALLY<br/>
             <span className="text-[9px] font-medium opacity-40">WHEN YOU FINISH DRAWING</span>
           </div>
        </div>

        {/* Text Area */}
        <div className={cn(
          "h-full overflow-y-auto p-4 md:p-8 flex flex-col gap-6 transition-all duration-500 origin-left border-r border-border/50",
          layoutMode === "canvas" ? "hidden" : "block",
          layoutMode === "text" ? "lg:col-span-2 max-w-4xl mx-auto w-full" : "lg:col-span-1"
        )}>
          <div className="p-4 bg-card rounded-3xl border border-border/50 flex-1 min-h-0 flex flex-col">
            <div className="flex items-center gap-2 mb-4 text-[10px] font-black uppercase tracking-widest text-primary">
              <Pencil className="h-3 w-3" />
              Structured Notes
            </div>
            <RichEditor
              content={content}
              onChange={(newContent) => {
                setContent(newContent);
              }}
              className="flex-1 border-none bg-transparent min-h-0 p-0"
              wrapperClassName="flex-1"
              placeholder="Start writing organized code notes or structured logic here..."
            />
          </div>
        </div>

        {/* Canvas Area */}
        <div className={cn(
          "h-full overflow-hidden p-4 md:p-8 flex flex-col gap-6 transition-all duration-500 origin-right",
          layoutMode === "text" ? "hidden" : "block",
          layoutMode === "canvas" ? "lg:col-span-2" : "lg:col-span-1"
        )}>
          <div className="p-4 bg-zinc-100 dark:bg-zinc-950 rounded-[2.5rem] border-4 border-zinc-200 dark:border-zinc-800 flex-1 min-h-0 flex flex-col shadow-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4 px-2">
               <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 translate-y-1">
                 <Layout className="h-3 w-3" />
                 Dry Run Surface
               </div>
               <div className="text-[9px] font-black text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  DRAW TO ANALYZE LOGIC
               </div>
            </div>
            <CanvasDraw
              initialData={drawing}
              onSave={(newDrawing) => {
                setDrawing(newDrawing);
                // Auto-save when drawing stops
                handleSave(undefined, undefined, newDrawing);
              }}
              className="flex-1 min-h-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
