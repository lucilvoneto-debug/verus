import { cn } from "@/lib/utils";

type Tone = "blue" | "green" | "yellow" | "red" | "neutral";

const toneClass: Record<Tone, string> = {
  blue: "badge-blue",
  green: "badge-green",
  yellow: "badge-yellow",
  red: "badge-red",
  neutral: "badge-neutral",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return <span className={cn(toneClass[tone], className)}>{children}</span>;
}
