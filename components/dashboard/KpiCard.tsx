import { cn } from "@/lib/utils";
import type { KpiTone } from "@/types";

const toneBorder: Record<KpiTone, string> = {
  blue: "border-t-brand",
  green: "border-t-success",
  yellow: "border-t-warning",
  red: "border-t-danger",
  neutral: "border-t-gray-300",
};

export function KpiCard({
  label,
  value,
  hint,
  tone = "blue",
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: KpiTone;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className={cn("kpi", toneBorder[tone])}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
          <div className="font-display text-2xl font-bold text-brand-dark mt-1">{value}</div>
          {hint && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
        </div>
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-brand-light text-brand flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
}
