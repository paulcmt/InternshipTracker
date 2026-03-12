"use client";

import { TableHead } from "@/components/ui/table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableTableHeadProps {
  columnKey: string;
  label: string;
  currentSort: string;
  currentOrder: "asc" | "desc";
  onSort: (columnKey: string) => void;
  className?: string;
}

export function SortableTableHead({
  columnKey,
  label,
  currentSort,
  currentOrder,
  onSort,
  className,
}: SortableTableHeadProps) {
  const isActive = currentSort === columnKey;

  const handleClick = () => onSort(columnKey);

  const Icon = isActive
    ? currentOrder === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <TableHead
      className={cn(
        "cursor-pointer select-none hover:bg-muted/50 whitespace-nowrap",
        className
      )}
      onClick={handleClick}
    >
      <span className="flex items-center gap-1.5">
        {label}
        <Icon
          className="size-3.5 text-muted-foreground shrink-0"
          aria-hidden
        />
      </span>
    </TableHead>
  );
}
