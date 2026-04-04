import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <span className={cn("font-v-headings tracking-tighter", className)}>
      Streakly
    </span>
  );
}
