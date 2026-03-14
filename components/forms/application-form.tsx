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
  APPLICATION_TYPE_LABELS,
  APPLICATION_STATUS_LABELS,
} from "@/lib/utils/enums";
import type { ApplicationType, ApplicationStatus } from "@prisma/client";
import type { Application } from "@prisma/client";
import type { Company } from "@prisma/client";
import { createApplication, updateApplication } from "@/app/applications/actions";

type EntryPointOption = {
  id: string;
  label: string;
  companyId: string;
};

type ApplicationFormProps = {
  application?: Application & { company: Company; entryPoint?: { type: string } | null };
  companies: { id: string; name: string }[];
  entryPoints: EntryPointOption[];
  preselectedCompanyId?: string;
  redirectTo?: string;
};

export function ApplicationForm({
  application,
  companies,
  entryPoints,
  preselectedCompanyId,
  redirectTo,
}: ApplicationFormProps) {
  const router = useRouter();
  const isEdit = !!application;

  const [state, formAction] = useActionState(
    isEdit ? updateApplication : createApplication,
    null
  );

  const errors = (state as {
    error?: Record<string, string[] | undefined>;
  })?.error;

  const defaultCompanyId =
    preselectedCompanyId ?? application?.companyId ?? companies[0]?.id;
  const isCompanyLocked = !!preselectedCompanyId || !!application;
  const filteredEntryPoints = isCompanyLocked
    ? entryPoints.filter((ep) => ep.companyId === defaultCompanyId)
    : entryPoints;

  const [entryPointId, setEntryPointId] = useState<string>(
    application?.entryPointId ?? "none"
  );

  return (
    <form action={formAction} className="space-y-6">
      {isEdit && <input type="hidden" name="id" value={application.id} />}
      {redirectTo && (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      )}
      <div className="space-y-2">
        <Label htmlFor="companyId">Entreprise *</Label>
        {isCompanyLocked ? (
          <>
            <input type="hidden" name="companyId" value={defaultCompanyId} />
            <p className="rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
              {companies.find((c) => c.id === defaultCompanyId)?.name ??
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
        <Label htmlFor="entryPointId">Point d&apos;entrée</Label>
        <input
          type="hidden"
          name="entryPointId"
          value={entryPointId === "none" ? "" : entryPointId}
        />
        <Select
          value={entryPointId}
          onValueChange={setEntryPointId}
        >
          <SelectTrigger id="entryPointId">
            <SelectValue placeholder="Aucun (optionnel)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucun</SelectItem>
            {filteredEntryPoints.map((ep) => (
              <SelectItem key={ep.id} value={ep.id}>
                {ep.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors?.entryPointId && (
          <p className="text-sm text-destructive">
            {errors.entryPointId[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="roleTitle">Titre du poste *</Label>
        <Input
          id="roleTitle"
          name="roleTitle"
          placeholder="ex: ML Engineer Intern"
          defaultValue={application?.roleTitle}
          required
          aria-invalid={!!errors?.roleTitle}
        />
        {errors?.roleTitle && (
          <p className="text-sm text-destructive">{errors.roleTitle[0]}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="applicationType">Type de candidature *</Label>
          <Select
            name="applicationType"
            defaultValue={application?.applicationType}
            required
          >
            <SelectTrigger id="applicationType">
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(APPLICATION_TYPE_LABELS) as ApplicationType[]).map(
                (t) => (
                  <SelectItem key={t} value={t}>
                    {APPLICATION_TYPE_LABELS[t]}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Lieu</Label>
          <Input
            id="location"
            name="location"
            placeholder="ex: Paris, Remote"
            defaultValue={application?.location ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="offerUrl">URL de l&apos;offre</Label>
        <Input
          id="offerUrl"
          name="offerUrl"
          type="url"
          placeholder="https://..."
          defaultValue={application?.offerUrl ?? ""}
          aria-invalid={!!errors?.offerUrl}
        />
        {errors?.offerUrl && (
          <p className="text-sm text-destructive">{errors.offerUrl[0]}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="status">Statut *</Label>
          <Select name="status" defaultValue={application?.status} required>
            <SelectTrigger id="status">
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(APPLICATION_STATUS_LABELS) as ApplicationStatus[]).map(
                (s) => (
                  <SelectItem key={s} value={s}>
                    {APPLICATION_STATUS_LABELS[s]}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="appliedAt">Date d&apos;envoi</Label>
          <Input
            id="appliedAt"
            name="appliedAt"
            type="date"
            defaultValue={
              application?.appliedAt
                ? new Date(application.appliedAt).toISOString().slice(0, 10)
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
          defaultValue={application?.notes ?? ""}
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
