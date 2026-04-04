"use client";

import { useNotebook, useSaveNotebook } from "@/hooks/use-notebook";
import { Book } from "lucide-react";
import { CanvasDraw } from "@/components/notebook/canvas-draw";

export default function ExcalidrawInspiredWhiteboard() {
  const { data: notebook, isLoading } = useNotebook();
  const saveMutation = useSaveNotebook();

  if (isLoading) {
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
        initialData={notebook?.drawing || ""}
        onSave={(newDrawing) => {
          saveMutation.mutate(newDrawing);
        }}
        className="h-full w-full"
      />
    </div>
  );
}
