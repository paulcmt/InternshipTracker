"use client";

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
  ENTRY_POINT_TYPE_LABELS,
  ENTRY_POINT_STATUS_LABELS,
} from "@/lib/utils/enums";
import type { EntryPointType, EntryPointStatus } from "@prisma/client";
import type { EntryPoint } from "@prisma/client";
import type { Company } from "@prisma/client";
import { createEntryPoint, updateEntryPoint } from "@/app/entry-points/actions";

type EntryPointFormProps = {
  entryPoint?: EntryPoint & { company: Company };
  companies: { id: string; name: string }[];
  preselectedCompanyId?: string;
  redirectTo?: string;
};

export function EntryPointForm({
  entryPoint,
  companies,
  preselectedCompanyId,
  redirectTo,
}: EntryPointFormProps) {
  const router = useRouter();
  const isEdit = !!entryPoint;

  const [state, formAction] = useActionState(
    isEdit ? updateEntryPoint : createEntryPoint,
    null
  );

  const errors = (state as {
    error?: Record<string, string[] | undefined>;
  })?.error;

  const defaultCompanyId =
    preselectedCompanyId ?? entryPoint?.companyId ?? companies[0]?.id;

  return (
    <form action={formAction} className="space-y-6">
      {isEdit && <input type="hidden" name="id" value={entryPoint.id} />}
      {redirectTo && (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      )}
      <div className="space-y-2">
        <Label htmlFor="companyId">Entreprise *</Label>
        {preselectedCompanyId ? (
          <>
            <input type="hidden" name="companyId" value={preselectedCompanyId} />
            <p className="rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
              {companies.find((c) => c.id === preselectedCompanyId)?.name ??
                "Entreprise"}
            </p>
          </>
        ) : (
          <Select name="companyId" defaultValue={defaultCompanyId} required>
            <SelectTrigger id="companyId">
              <SelectValue placeholder="Sélectionner une entreprise" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {errors?.companyId && (
          <p className="text-sm text-destructive">{errors.companyId[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Type *</Label>
        <Select name="type" defaultValue={entryPoint?.type} required>
          <SelectTrigger id="type">
            <SelectValue placeholder="Sélectionner" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(ENTRY_POINT_TYPE_LABELS) as EntryPointType[]).map(
              (t) => (
                <SelectItem key={t} value={t}>
                  {ENTRY_POINT_TYPE_LABELS[t]}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        {errors?.type && (
          <p className="text-sm text-destructive">{errors.type[0]}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="personName">Nom de la personne</Label>
          <Input
            id="personName"
            name="personName"
            defaultValue={entryPoint?.personName ?? ""}
            aria-invalid={!!errors?.personName}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="personRole">Rôle</Label>
          <Input
            id="personRole"
            name="personRole"
            defaultValue={entryPoint?.personRole ?? ""}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={entryPoint?.email ?? ""}
            placeholder="email@exemple.com"
            aria-invalid={!!errors?.email}
          />
          {errors?.email && (
            <p className="text-sm text-destructive">{errors.email[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="channel">Canal</Label>
          <Input
            id="channel"
            name="channel"
            placeholder="ex: LinkedIn, Email"
            defaultValue={entryPoint?.channel ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="linkedinUrl">URL LinkedIn</Label>
        <Input
          id="linkedinUrl"
          name="linkedinUrl"
          type="url"
          placeholder="https://linkedin.com/in/..."
          defaultValue={entryPoint?.linkedinUrl ?? ""}
          aria-invalid={!!errors?.linkedinUrl}
        />
        {errors?.linkedinUrl && (
          <p className="text-sm text-destructive">{errors.linkedinUrl[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Statut *</Label>
        <Select name="status" defaultValue={entryPoint?.status} required>
          <SelectTrigger id="status">
            <SelectValue placeholder="Sélectionner" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(ENTRY_POINT_STATUS_LABELS) as EntryPointStatus[]).map(
              (s) => (
                <SelectItem key={s} value={s}>
                  {ENTRY_POINT_STATUS_LABELS[s]}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nextAction">Prochaine action</Label>
          <Input
            id="nextAction"
            name="nextAction"
            placeholder="ex: Relancer, Envoyer CV"
            defaultValue={entryPoint?.nextAction ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nextActionDate">Date prochaine action</Label>
          <Input
            id="nextActionDate"
            name="nextActionDate"
            type="date"
            defaultValue={
              entryPoint?.nextActionDate
                ? new Date(entryPoint.nextActionDate)
                    .toISOString()
                    .slice(0, 10)
                : ""
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          defaultValue={entryPoint?.notes ?? ""}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit">{isEdit ? "Enregistrer" : "Créer"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
