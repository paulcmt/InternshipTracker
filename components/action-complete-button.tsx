"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { completeAction } from "@/app/actions/actions";

interface ActionCompleteButtonProps {
  actionId: string;
  /** Only show for open actions; hide for DONE/CANCELED */
  disabled?: boolean;
  variant?: "default" | "compact";
  className?: string;
}

export function ActionCompleteButton({
  actionId,
  disabled = false,
  variant = "default",
  className,
}: ActionCompleteButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleComplete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || isPending) return;
    setIsPending(true);
    try {
      await completeAction(actionId);
      router.refresh();
    } finally {
      setIsPending(false);
    }
  };

  if (disabled) return null;

  const isBusy = isPending;

  return (
    <Button
      type="button"
      variant="ghost"
      size={variant === "compact" ? "icon" : "sm"}
      className={`shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 ${className ?? ""}`}
      onClick={handleComplete}
      disabled={isBusy}
      title="Terminer"
      aria-label="Marquer comme terminée"
    >
      <Check className="size-4" aria-hidden />
    </Button>
  );
}
