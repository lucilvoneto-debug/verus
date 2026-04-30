import * as React from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className={cn("table-impermeia", className)} {...props} />
    </div>
  );
}

export const Thead = (p: React.HTMLAttributes<HTMLTableSectionElement>) => <thead {...p} />;
export const Tbody = (p: React.HTMLAttributes<HTMLTableSectionElement>) => <tbody {...p} />;
export const Tr = (p: React.HTMLAttributes<HTMLTableRowElement>) => <tr {...p} />;
export const Th = (p: React.ThHTMLAttributes<HTMLTableCellElement>) => <th {...p} />;
export const Td = (p: React.TdHTMLAttributes<HTMLTableCellElement>) => <td {...p} />;
