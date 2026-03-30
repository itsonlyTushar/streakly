import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
    </div>
  );
}
