"use client";

import { useActionState, useRef, useState } from "react";
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
import { buildLinkedInPeopleSearchUrl } from "@/lib/utils/linkedin";
import { ExternalLink, Search } from "lucide-react";
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

  const defaultCompanyId =
    preselectedCompanyId ?? entryPoint?.companyId ?? companies[0]?.id;
  const [companyId, setCompanyId] = useState(defaultCompanyId);
  const personNameRef = useRef<HTMLInputElement>(null);
  const linkedinInputRef = useRef<HTMLInputElement>(null);
  const [hasLinkedInUrl, setHasLinkedInUrl] = useState(
    !!entryPoint?.linkedinUrl
  );
  const [linkedinMessage, setLinkedinMessage] = useState<string | null>(null);

  const [state, formAction] = useActionState(
    isEdit ? updateEntryPoint : createEntryPoint,
    null
  );

  const errors = (state as {
    error?: Record<string, string[] | undefined>;
  })?.error;

  const effectiveCompanyId = preselectedCompanyId ?? companyId;
  const companyName =
    companies.find((c) => c.id === effectiveCompanyId)?.name?.trim() ?? "";

  const handleFindOnLinkedIn = () => {
    const personName = personNameRef.current?.value?.trim() ?? "";
    const query = personName
      ? `${personName} ${companyName}`.trim()
      : companyName;
    if (!query) {
      setLinkedinMessage("Indiquez au moins l'entreprise ou le nom de la personne.");
      return;
    }
    const url = buildLinkedInPeopleSearchUrl(query);
    window.open(url, "_blank", "noopener,noreferrer");
    setLinkedinMessage(
      "Recherche LinkedIn ouverte. Copiez-collez le bon profil ici si besoin."
    );
  };

  const handleOpenLinkedIn = () => {
    const url = linkedinInputRef.current?.value?.trim();
    if (url && /^https?:\/\//.test(url)) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const fieldClass = "space-y-1 min-w-0";
  const labelClass = "text-xs font-medium leading-none";
  const canSearchLinkedIn = !!companyName;

  return (
    <form action={formAction} className="space-y-4">
      {isEdit && <input type="hidden" name="id" value={entryPoint.id} />}
      {redirectTo && (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      )}

      {/* Row 1: Entreprise, Type, URL LinkedIn + Trouver / Ouvrir */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:gap-4">
        <div className={`${fieldClass} lg:col-span-2`}>
          <Label htmlFor="companyId" className={labelClass}>
            Entreprise *
          </Label>
          {preselectedCompanyId ? (
            <>
              <input
                type="hidden"
                name="companyId"
                value={preselectedCompanyId}
              />
              <p className="flex h-8 items-center rounded-md border border-input bg-muted/50 px-3 text-sm">
                {companies.find((c) => c.id === preselectedCompanyId)?.name ??
                  "Entreprise"}
              </p>
            </>
          ) : (
            <>
              <input type="hidden" name="companyId" value={companyId} />
              <Select
                value={companyId}
                onValueChange={setCompanyId}
                required
              >
                <SelectTrigger id="companyId" size="sm" className="w-full">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors?.companyId && (
                <p className="text-xs text-destructive">
                  {errors.companyId[0]}
                </p>
              )}
            </>
          )}
        </div>
        <div className={`${fieldClass} lg:col-span-2`}>
          <Label htmlFor="type" className={labelClass}>
            Type *
          </Label>
          <Select name="type" defaultValue={entryPoint?.type} required>
            <SelectTrigger id="type" size="sm" className="w-full">
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
            <p className="text-xs text-destructive">{errors.type[0]}</p>
          )}
        </div>
        <div className={`${fieldClass} sm:col-span-2 lg:col-span-8`}>
          <Label htmlFor="linkedinUrl" className={labelClass}>
            URL LinkedIn
          </Label>
          <div className="flex items-center gap-1.5">
            <Input
              ref={linkedinInputRef}
              id="linkedinUrl"
              name="linkedinUrl"
              type="url"
              placeholder="https://linkedin.com/in/..."
              defaultValue={entryPoint?.linkedinUrl ?? ""}
              onInput={(e) =>
                setHasLinkedInUrl(
                  !!(e.target as HTMLInputElement).value?.trim()
                )
              }
              aria-invalid={!!errors?.linkedinUrl}
              className="h-8 min-w-0 flex-1 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFindOnLinkedIn}
              disabled={!canSearchLinkedIn}
              aria-label="Trouver sur LinkedIn"
              className="h-8 shrink-0 text-xs"
            >
              <Search className="size-3.5" />
              Trouver sur LinkedIn
            </Button>
            {hasLinkedInUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleOpenLinkedIn}
                title="Ouvrir LinkedIn"
                aria-label="Ouvrir le lien LinkedIn"
                className="h-8 w-8 shrink-0 p-0"
              >
                <ExternalLink className="size-3.5" />
              </Button>
            )}
          </div>
          {linkedinMessage && (
            <p className="text-xs text-muted-foreground">{linkedinMessage}</p>
          )}
          {errors?.linkedinUrl && (
            <p className="text-xs text-destructive">
              {errors.linkedinUrl[0]}
            </p>
          )}
        </div>
      </div>

      {/* Row 2: Nom, Rôle, Canal, Statut */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        <div className={fieldClass}>
          <Label htmlFor="personName" className={labelClass}>
            Nom de la personne
          </Label>
          <Input
            ref={personNameRef}
            id="personName"
            name="personName"
            defaultValue={entryPoint?.personName ?? ""}
            aria-invalid={!!errors?.personName}
            className="h-8 text-sm"
          />
          {errors?.personName && (
            <p className="text-xs text-destructive">
              {errors.personName[0]}
            </p>
          )}
        </div>
        <div className={fieldClass}>
          <Label htmlFor="personRole" className={labelClass}>
            Rôle
          </Label>
          <Input
            id="personRole"
            name="personRole"
            defaultValue={entryPoint?.personRole ?? ""}
            className="h-8 text-sm"
          />
        </div>
        <div className={fieldClass}>
          <Label htmlFor="channel" className={labelClass}>
            Canal
          </Label>
          <Input
            id="channel"
            name="channel"
            placeholder="ex: LinkedIn, Email"
            defaultValue={entryPoint?.channel ?? ""}
            className="h-8 text-sm"
          />
        </div>
        <div className={fieldClass}>
          <Label htmlFor="status" className={labelClass}>
            Statut *
          </Label>
          <Select name="status" defaultValue={entryPoint?.status} required>
            <SelectTrigger id="status" size="sm" className="w-full">
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
      </div>

      {/* Notes: full width */}
      <div className={fieldClass}>
        <Label htmlFor="notes" className={labelClass}>
          Notes
        </Label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          className="flex w-full max-w-2xl rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          defaultValue={entryPoint?.notes ?? ""}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm">
          {isEdit ? "Enregistrer" : "Créer"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
