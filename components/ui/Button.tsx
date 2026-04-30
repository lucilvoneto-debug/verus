import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "danger";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClass: Record<Variant, string> = {
  primary: "btn-primary",
  outline: "btn-outline",
  ghost: "btn-ghost",
  danger:
    "inline-flex items-center justify-center gap-2 bg-danger hover:bg-red-600 text-white font-medium px-4 py-2 rounded-lg transition-colors",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", ...props },
  ref
) {
  return <button ref={ref} className={cn(variantClass[variant], className)} {...props} />;
});
