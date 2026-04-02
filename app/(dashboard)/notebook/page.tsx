"use client";

import { useAuth } from "@/components/auth-provider";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Book,
} from "lucide-react";
import { CanvasDraw } from "@/components/notebook/canvas-draw";

export default function ExcalidrawInspiredWhiteboard() {
  const { user, loading: authLoading } = useAuth();
  const [drawing, setDrawing] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchNote = async () => {
      const docRef = doc(db, "notebooks", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDrawing(data.drawing || "");
      }
      setIsLoaded(true);
    };

    fetchNote();
  }, [user]);

  const handleSave = async (forceDrawing?: string) => {
    if (!user) return;
    try {
      await setDoc(doc(db, "notebooks", user.uid), {
        userId: user.uid,
        drawing: forceDrawing ?? drawing,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      console.error("Error saving whiteboard:", error);
    }
  };

  if (authLoading || !isLoaded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
        <div className="animate-spin text-primary">
          <Book className="h-10 w-10" />
        </div>
      </div>
    );
  }

  // Edge-to-edge whiteboard: No padding, No border, No rounded corners.
  return (
    <div className="fixed inset-0 lg:left-20 z-[40] bg-background overflow-hidden">
      <CanvasDraw
        initialData={drawing}
        onSave={(newDrawing) => {
          setDrawing(newDrawing);
          handleSave(newDrawing);
        }}
        className="h-full w-full"
      />
    </div>
  );
}
