"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthGuard } from "@/components/auth-guard";
import { useToast } from "@/components/ui/toast";
import {
  Video,
  Square,
  Pause,
  Play,
  Download,
  Trash2,
  Camera,
  CameraOff,
  CircleDot,
  CloudUpload,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getDriveAccessToken,
  uploadToDrive,
} from "@/services/google-drive.service";

type RecordingState = "idle" | "preparing" | "recording" | "paused" | "stopped";

interface SavedRecording {
  id: string;
  url: string;
  blob: Blob;
  duration: number; // seconds
  createdAt: number;
}

type UploadStatus = "idle" | "uploading" | "done" | "error";

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

export default function RecordPage() {
  const { requireAuth } = useAuthGuard();
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [state, setState] = useState<RecordingState>("idle");
  const [cameraOn, setCameraOn] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [recordings, setRecordings] = useState<SavedRecording[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Drive upload state, tracked per recording id
  const [uploadStatuses, setUploadStatuses] = useState<
    Record<string, { status: UploadStatus; progress: number; link?: string }>
  >({});

  // ─── Timer ──────────────────────────────────────────────
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // ─── Camera control ─────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      setState("preparing");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraOn(true);
      setState("idle");
    } catch (err) {
      console.error("Camera access failed:", err);
      setState("idle");
      toast({
        title: "Camera Unavailable",
        description:
          "Could not access your camera/microphone. Please check browser permissions.",
        variant: "error",
      });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }, []);

  // ─── Recording control ──────────────────────────────────
  const pickMimeType = (): string | undefined => {
    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ];
    return candidates.find((t) =>
      typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)
    );
  };

  const handleStartRecording = () => {
    requireAuth(() => {
      const stream = streamRef.current;
      if (!stream) return;

      chunksRef.current = [];
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "video/webm",
        });
        if (blob.size > 0) {
          const recording: SavedRecording = {
            id: `${Date.now()}`,
            url: URL.createObjectURL(blob),
            blob,
            duration: elapsed,
            createdAt: Date.now(),
          };
          setRecordings((prev) => [recording, ...prev]);
          setActiveId(recording.id);
          toast({
            title: "Recording Saved",
            description: `Your ${formatDuration(recording.duration)} recording is ready.`,
            variant: "success",
          });
        }
        chunksRef.current = [];
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setElapsed(0);
      startTimer();
      setState("recording");
    });
  };

  const handlePauseResume = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recorder.state === "recording") {
      recorder.pause();
      stopTimer();
      setState("paused");
    } else if (recorder.state === "paused") {
      recorder.resume();
      startTimer();
      setState("recording");
    }
  };

  const handleStopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    stopTimer();
    recorder.stop();
    mediaRecorderRef.current = null;
    setState("stopped");
    setTimeout(() => setState(cameraOn ? "idle" : "stopped"), 100);
  };

  const handleDelete = (id: string) => {
    setRecordings((prev) => {
      const target = prev.find((r) => r.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((r) => r.id !== id);
    });
    setActiveId((current) => (current === id ? null : current));
  };

  const handleDownload = (recording: SavedRecording) => {
    const ext = recording.blob.type.includes("mp4") ? "mp4" : "webm";
    const a = document.createElement("a");
    a.href = recording.url;
    a.download = `streakly-recording-${new Date(recording.createdAt)
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, "-")}.${ext}`;
    a.click();
  };

  const handleUploadToDrive = async (recording: SavedRecording) => {
    setUploadStatuses((prev) => ({
      ...prev,
      [recording.id]: { status: "uploading", progress: 0 },
    }));

    try {
      const accessToken = await getDriveAccessToken();
      const ext = recording.blob.type.includes("mp4") ? "mp4" : "webm";
      const fileName = `streakly-recording-${new Date(recording.createdAt)
        .toISOString()
        .slice(0, 19)
        .replace(/[:T]/g, "-")}.${ext}`;

      const result = await uploadToDrive(
        recording.blob,
        fileName,
        accessToken,
        (progress) =>
          setUploadStatuses((prev) => ({
            ...prev,
            [recording.id]: { status: "uploading", progress },
          }))
      );

      setUploadStatuses((prev) => ({
        ...prev,
        [recording.id]: {
          status: "done",
          progress: 100,
          link: result.webViewLink,
        },
      }));
      toast({
        title: "Uploaded to Drive",
        description: `"${result.name}" is now in your Google Drive.`,
        variant: "success",
      });
    } catch (err) {
      console.error("Drive upload failed:", err);
      setUploadStatuses((prev) => ({
        ...prev,
        [recording.id]: { status: "error", progress: 0 },
      }));
      toast({
        title: "Drive Upload Failed",
        description:
          err instanceof Error ? err.message : "Could not upload to Google Drive.",
        variant: "error",
      });
    }
  };

  // ─── Cleanup on unmount ─────────────────────────────────
  useEffect(() => {
    return () => {
      stopTimer();
      stopCamera();
      recordings.forEach((r) => URL.revokeObjectURL(r.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isRecording = state === "recording" || state === "paused";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Video className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Record</h1>
          <p className="text-sm text-muted-foreground">
            Capture video recordings with your camera &amp; microphone
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6 items-start">
        {/* ─── Camera Preview Panel ─── */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-md">
          <div className="relative aspect-video bg-black">
            <video
              ref={videoRef}
              muted
              playsInline
              className={cn(
                "w-full h-full object-cover",
                !cameraOn && "hidden"
              )}
            />
            {!cameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <CameraOff className="h-10 w-10" />
                <p className="text-sm font-medium">Camera is off</p>
              </div>
            )}
            {isRecording && (
              <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-destructive px-3 py-1 text-xs font-bold text-white shadow-lg">
                <CircleDot className="h-3.5 w-3.5 animate-pulse" />
                {state === "paused" ? "PAUSED" : "REC"} · {formatDuration(elapsed)}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-center gap-3 p-4 border-t border-border">
            {!cameraOn ? (
              <button
                onClick={startCamera}
                disabled={state === "preparing"}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Camera className="h-4 w-4" />
                {state === "preparing" ? "Starting..." : "Start Camera"}
              </button>
            ) : (
              <>
                {!isRecording ? (
                  <button
                    onClick={handleStartRecording}
                    className="flex items-center gap-2 rounded-xl bg-destructive px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
                  >
                    <CircleDot className="h-4 w-4" />
                    Start Recording
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleStopRecording}
                      className="flex items-center gap-2 rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-bold hover:opacity-90 transition-opacity"
                    >
                      <Square className="h-4 w-4" />
                      Stop
                    </button>
                    <button
                      onClick={handlePauseResume}
                      className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-5 py-2.5 text-sm font-bold hover:bg-secondary/70 transition-colors"
                    >
                      {state === "paused" ? (
                        <>
                          <Play className="h-4 w-4" /> Resume
                        </>
                      ) : (
                        <>
                          <Pause className="h-4 w-4" /> Pause
                        </>
                      )}
                    </button>
                  </>
                )}
                <button
                  onClick={stopCamera}
                  disabled={isRecording}
                  className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                >
                  <CameraOff className="h-4 w-4" />
                  Stop Camera
                </button>
              </>
            )}
          </div>
        </div>

        {/* ─── Recordings List ─── */}
        <div className="rounded-2xl border border-border bg-card shadow-md p-4">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <Video className="h-4 w-4 text-primary" />
            Your Recordings
            <span className="ml-auto text-xs font-medium text-muted-foreground">
              {recordings.length}
            </span>
          </h2>

          {recordings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No recordings yet. Start your camera and hit record!
            </p>
          ) : (
            <ul className="space-y-3 max-h-[480px] overflow-y-auto">
              {recordings.map((r) => (
                <li
                  key={r.id}
                  className={cn(
                    "rounded-xl border p-3 transition-colors cursor-pointer",
                    activeId === r.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => setActiveId(r.id)}
                >
                  <video
                    src={r.url}
                    controls
                    preload="metadata"
                    className="w-full rounded-lg aspect-video bg-black"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString()} ·{" "}
                      {formatDuration(r.duration)}
                    </span>
                    <div className="flex items-center gap-1">
                      {(() => {
                        const upload = uploadStatuses[r.id];
                        if (upload?.status === "uploading") {
                          return (
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {upload.progress}%
                            </span>
                          );
                        }
                        if (upload?.status === "done") {
                          return (
                            <a
                              href={upload.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 p-1.5 rounded-lg text-green-600 hover:bg-secondary transition-colors"
                              aria-label="Open in Google Drive"
                              title="Open in Google Drive"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </a>
                          );
                        }
                        return (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUploadToDrive(r);
                            }}
                            className={cn(
                              "p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary transition-colors",
                              upload?.status === "error" &&
                                "text-destructive hover:text-destructive"
                            )}
                            aria-label="Upload to Google Drive"
                            title={
                              upload?.status === "error"
                                ? "Upload failed — click to retry"
                                : "Upload to Google Drive"
                            }
                          >
                            <CloudUpload className="h-4 w-4" />
                          </button>
                        );
                      })()}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(r);
                        }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
                        aria-label="Download recording"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(r.id);
                        }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        aria-label="Delete recording"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
