"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Trash2 } from "lucide-react";
import { deleteApplication } from "@/app/applications/actions";

interface ApplicationDeleteButtonProps {
  applicationId: string;
  variant?: "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function ApplicationDeleteButton({
  applicationId,
  variant = "outline",
  size = "sm",
  className,
}: ApplicationDeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteApplication(applicationId);
      setOpen(false);
    } catch (e) {
      if (
        e &&
        typeof e === "object" &&
        "digest" in e &&
        typeof (e as { digest?: string }).digest === "string" &&
        (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")
      ) {
        setOpen(false);
        throw e;
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        <Trash2 className="size-4" />
        Supprimer
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Supprimer la candidature"
        description="Cette action est irréversible. Les entretiens liés seront également supprimés."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="destructive"
        onConfirm={handleConfirm}
        confirmDisabled={isDeleting}
      />
    </>
  );
}
