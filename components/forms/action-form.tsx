"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACTION_STATUS_LABELS,
  ACTION_PRIORITY_LABELS,
} from "@/lib/utils/enums";
import type { ActionStatus, ActionPriority } from "@prisma/client";
import type { Action } from "@prisma/client";
import { createAction, updateAction } from "@/app/actions/actions";

type ActionFormProps = {
  action?: Action & {
    company?: { id: string; name: string } | null;
    entryPoint?: { id: string; companyId: string } | null;
    application?: { id: string; companyId: string } | null;
    interview?: { id: string; companyId: string } | null;
  };
  companies?: { id: string; name: string }[];
  preselectedCompanyId?: string;
  preselectedEntryPointId?: string;
  preselectedApplicationId?: string;
  preselectedInterviewId?: string;
  redirectTo?: string;
};

export function ActionForm({
  action,
  companies = [],
  preselectedCompanyId,
  preselectedEntryPointId,
  preselectedApplicationId,
  preselectedInterviewId,
  redirectTo,
}: ActionFormProps) {
  const router = useRouter();
  const isEdit = !!action;

  const [state, formAction] = useActionState(
    isEdit ? updateAction : createAction,
    null
  );

  const errors = (state as {
    error?: Record<string, string[] | undefined>;
  })?.error;

  const defaultCompanyId =
    preselectedCompanyId ??
    action?.companyId ??
    action?.entryPoint?.companyId ??
    action?.application?.companyId ??
    action?.interview?.companyId ??
    companies[0]?.id;

  const isCompanyLocked =
    !!preselectedCompanyId ||
    !!action?.companyId ||
    !!action?.entryPoint?.companyId ||
    !!action?.application?.companyId ||
    !!action?.interview?.companyId;

  const [companyId, setCompanyId] = useState<string>(
    defaultCompanyId ?? "none"
  );

  return (
    <form action={formAction} className="space-y-6">
      {isEdit && <input type="hidden" name="id" value={action.id} />}
      {redirectTo && (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Titre *</Label>
        <Input
          id="title"
          name="title"
          placeholder="ex: Contacter le recruteur"
          defaultValue={action?.title}
          required
          aria-invalid={!!errors?.title}
        />
        {errors?.title && (
          <p className="text-sm text-destructive">{errors.title[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={2}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Détails optionnels"
          defaultValue={action?.description ?? ""}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="status">Statut *</Label>
          <Select
            name="status"
            defaultValue={action?.status ?? "TODO"}
            required
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ACTION_STATUS_LABELS) as ActionStatus[]).map(
                (s) => (
                  <SelectItem key={s} value={s}>
                    {ACTION_STATUS_LABELS[s]}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Priorité *</Label>
          <Select
            name="priority"
            defaultValue={action?.priority ?? "MEDIUM"}
            required
          >
            <SelectTrigger id="priority">
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ACTION_PRIORITY_LABELS) as ActionPriority[]).map(
                (p) => (
                  <SelectItem key={p} value={p}>
                    {ACTION_PRIORITY_LABELS[p]}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dueDate">Date d&apos;échéance</Label>
        <Input
          id="dueDate"
          name="dueDate"
          type="date"
          defaultValue={
            action?.dueDate
              ? new Date(action.dueDate).toISOString().slice(0, 10)
              : ""
          }
        />
      </div>

      {companies.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="companyId">Entreprise liée</Label>
          {isCompanyLocked ? (
            <>
              <input
                type="hidden"
                name="companyId"
                value={defaultCompanyId ?? ""}
              />
              <p className="rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
                {companies.find((c) => c.id === defaultCompanyId)?.name ??
                  "Entreprise"}
              </p>
            </>
          ) : (
            <>
              <input
                type="hidden"
                name="companyId"
                value={companyId === "none" ? "" : companyId}
              />
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger id="companyId">
                  <SelectValue placeholder="Aucune" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit">{isEdit ? "Enregistrer" : "Créer"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
