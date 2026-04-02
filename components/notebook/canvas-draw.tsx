"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, Pencil, RotateCcw, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface CanvasDrawProps {
  initialData?: string;
  onSave?: (data: string) => void;
  className?: string;
}

const eraserCursorLight = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23000000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.9-9.9c1-1 2.5-1 3.4 0l4.3 4.3c1 1 1 2.5 0 3.4l-9.9 9.9c-1 1-2.5 1-3.4 0Z'/%3E%3Cpath d='M22 21H7'/%3E%3Cpath d='m11 5 8 8'/%3E%3C/svg%3E") 12 12, auto`;
const eraserCursorDark = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.9-9.9c1-1 2.5-1 3.4 0l4.3 4.3c1 1 1 2.5 0 3.4l-9.9 9.9c-1 1-2.5 1-3.4 0Z'/%3E%3Cpath d='M22 21H7'/%3E%3Cpath d='m11 5 8 8'/%3E%3C/svg%3E") 12 12, auto`;

export function CanvasDraw({ initialData, onSave, className }: CanvasDrawProps) {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(theme === "dark" ? "#ffffff" : "#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState<"pencil" | "eraser">("pencil");

  useEffect(() => {
    if (color === "#ffffff" || color === "#000000") {
      setColor(theme === "dark" ? "#ffffff" : "#000000");
    }
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = containerRef.current;
      if (!container) return;
      const tempImage = canvas.toDataURL();
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = tempImage;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    if (initialData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = initialData;
    }

    return () => window.removeEventListener("resize", resizeCanvas);
  }, [initialData]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const x = ("touches" in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ("touches" in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getPos(e);
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      if (onSave) onSave(canvasRef.current?.toDataURL() || "");
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const { x, y } = getPos(e);

    ctx.lineWidth = tool === "eraser" ? 55 : brushSize;
    ctx.strokeStyle = tool === "eraser" ? (theme === "dark" ? "#09090b" : "#ffffff") : color;
    ctx.globalCompositeOperation = tool === "eraser" ? 'destination-out' : 'source-over';

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (onSave) onSave("");
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div 
      className={cn("flex flex-col h-full w-full relative", className)}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
    >
      {/* Floating Toolbar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-background/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-border shadow-2xl transition-all">
        <div className="flex items-center gap-1.5 px-2 border-r border-border mr-1">
          <button
            onClick={() => setTool("pencil")}
            className={cn(
              "p-2 rounded-xl transition-all",
              tool === "pencil" ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground"
            )}
            title="Pencil"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setTool("eraser")}
            className={cn(
              "p-2 rounded-xl transition-all",
              tool === "eraser" ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground"
            )}
            title="Eraser"
          >
            <Eraser className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
            {[theme === "dark" ? "#ffffff" : "#000000", "#3b82f6", "#ef4444", "#22c55e"].map((c) => (
              <button
                key={c}
                onClick={() => {
                    setColor(c);
                    if (tool === "eraser") setTool("pencil");
                }}
                className={cn(
                  "w-7 h-7 rounded-full border-2 transition-all hover:scale-110 shadow-sm",
                  color === c ? "border-primary scale-110" : "border-transparent"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
        </div>

        <div className="w-[1px] h-6 bg-border mx-2" />

        <div className="flex items-center gap-1">
          <button
            onClick={() => { if(confirm('Clear the entire board?')) clearCanvas(); }}
            className="p-2 hover:bg-destructive/10 text-destructive rounded-xl transition-all font-black uppercase text-[10px] flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={downloadImage}
            className="p-2 hover:bg-secondary text-muted-foreground rounded-xl transition-all"
            title="Export"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Drawing Surface */}
      <div 
        ref={containerRef}
        className={cn(
            "flex-1 overflow-hidden h-full relative transition-colors duration-700",
            theme === "dark" ? "bg-zinc-950" : "bg-white",
            tool === "eraser" ? "" : "cursor-crosshair"
        )}
        style={tool === "eraser" ? { cursor: theme === "dark" ? eraserCursorDark : eraserCursorLight } : {}}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          className="touch-none block h-full w-full outline-none"
        />
        
        <div className="absolute bottom-6 right-6 text-[10px] text-zinc-500/10 pointer-events-none font-black uppercase tracking-[0.5em] select-none">
           Infinite Slate
        </div>
      </div>
    </div>
  );
}
