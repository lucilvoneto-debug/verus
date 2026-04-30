import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, id, ...props },
  ref
) {
  const inputId = id ?? props.name;
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input ref={ref} id={inputId} className={cn("input-impermeia", className)} {...props} />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
});
