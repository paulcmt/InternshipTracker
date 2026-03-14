"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildLinkedInCompanySearchUrl } from "@/lib/utils/linkedin";
import { ExternalLink, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COMPANY_STATUS_LABELS } from "@/lib/utils/enums";
import type { CompanyStatus } from "@prisma/client";
import type { Company } from "@prisma/client";
import { createCompany, updateCompany } from "@/app/companies/actions";

type CompanyFormProps = {
  company?: Company;
};

export function CompanyForm({ company }: CompanyFormProps) {
  const router = useRouter();
  const isEdit = !!company;
  const [companyName, setCompanyName] = useState(company?.name ?? "");
  const linkedinInputRef = useRef<HTMLInputElement>(null);
  const [hasLinkedInUrl, setHasLinkedInUrl] = useState(!!company?.linkedinUrl);
  const [linkedinMessage, setLinkedinMessage] = useState<string | null>(null);

  const [state, formAction] = useActionState(
    isEdit ? updateCompany : createCompany,
    null
  );

  const errors = (state as { error?: Record<string, string[] | undefined> })?.error;

  const handleFindLinkedIn = () => {
    const name = companyName.trim();
    if (!name) {
      setLinkedinMessage("Veuillez entrer le nom de l'entreprise d'abord.");
      return;
    }
    const searchUrl = buildLinkedInCompanySearchUrl(name);
    window.open(searchUrl, "_blank", "noopener,noreferrer");
    setLinkedinMessage(
      "Recherche LinkedIn ouverte. Copiez-collez ensuite le bon lien de l'entreprise ici."
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

  return (
    <form action={formAction} className="space-y-4">
      {isEdit && <input type="hidden" name="id" value={company.id} />}

      {/* Header: [Nom bloc] [Trouver btn] [LinkedIn bloc + Ouvrir] */}
      <div className="grid grid-cols-1 items-end gap-x-4 gap-y-3 sm:grid-cols-[1fr_auto_1fr] md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.5fr)]">
        <div className={fieldClass}>
          <Label htmlFor="name" className={labelClass}>
            Nom de l&apos;entreprise *
          </Label>
          <Input
            id="name"
            name="name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            aria-invalid={!!errors?.name}
            className="h-8 text-sm"
          />
          {errors?.name && (
            <p className="text-xs text-destructive">{errors.name[0]}</p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleFindLinkedIn}
          disabled={!companyName.trim()}
          aria-label="Trouver le LinkedIn de l'entreprise"
          className="h-8 shrink-0 whitespace-nowrap text-xs"
        >
          <Search className="size-3.5" />
          Trouver le LinkedIn de l&apos;entreprise
        </Button>
        <div className={fieldClass}>
          <Label htmlFor="linkedinUrl" className={labelClass}>
            URL LinkedIn
          </Label>
          <div className="flex items-center gap-1.5">
            <Input
              ref={linkedinInputRef}
              id="linkedinUrl"
              name="linkedinUrl"
              type="url"
              placeholder="https://linkedin.com/company/..."
              defaultValue={company?.linkedinUrl ?? ""}
              onInput={(e) =>
                setHasLinkedInUrl(!!(e.target as HTMLInputElement).value?.trim())
              }
              aria-invalid={!!errors?.linkedinUrl}
              className="h-8 min-w-0 flex-1 text-sm"
            />
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
            <p className="text-xs text-destructive">{errors.linkedinUrl[0]}</p>
          )}
        </div>
      </div>

      {/* Row 2: Country, City, Size */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={fieldClass}>
          <Label htmlFor="country" className={labelClass}>
            Pays *
          </Label>
          <Input
            id="country"
            name="country"
            defaultValue={company?.country}
            required
            aria-invalid={!!errors?.country}
            className="h-8 text-sm"
          />
          {errors?.country && (
            <p className="text-xs text-destructive">{errors.country[0]}</p>
          )}
        </div>
        <div className={fieldClass}>
          <Label htmlFor="city" className={labelClass}>
            Ville
          </Label>
          <Input
            id="city"
            name="city"
            defaultValue={company?.city ?? ""}
            className="h-8 text-sm"
          />
        </div>
        <div className={fieldClass}>
          <Label htmlFor="sizeEstimate" className={labelClass}>
            Taille
          </Label>
          <Input
            id="sizeEstimate"
            name="sizeEstimate"
            placeholder="ex: 10-50"
            defaultValue={company?.sizeEstimate ?? ""}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Row 3: Personal interest, Status */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={fieldClass}>
          <Label htmlFor="personalInterest" className={labelClass}>
            Intérêt (1-10) *
          </Label>
          <Input
            id="personalInterest"
            name="personalInterest"
            type="number"
            min={1}
            max={10}
            defaultValue={company?.personalInterest ?? 5}
            required
            aria-invalid={!!errors?.personalInterest}
            className="h-8 text-sm"
          />
          {errors?.personalInterest && (
            <p className="text-xs text-destructive">
              {errors.personalInterest[0]}
            </p>
          )}
        </div>
        <div className={fieldClass}>
          <Label htmlFor="status" className={labelClass}>
            Statut *
          </Label>
          <Select name="status" defaultValue={company?.status} required>
            <SelectTrigger id="status" size="sm" className="w-full">
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(COMPANY_STATUS_LABELS) as CompanyStatus[]).map(
                (s) => (
                  <SelectItem key={s} value={s}>
                    {COMPANY_STATUS_LABELS[s]}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 4: Careers URL */}
      <div className={fieldClass}>
        <Label htmlFor="careersUrl" className={labelClass}>
          URL carrières
        </Label>
        <Input
          id="careersUrl"
          name="careersUrl"
          type="url"
          placeholder="https://..."
          defaultValue={company?.careersUrl ?? ""}
          aria-invalid={!!errors?.careersUrl}
          className="h-8 text-sm max-w-md"
        />
        {errors?.careersUrl && (
          <p className="text-xs text-destructive">{errors.careersUrl[0]}</p>
        )}
      </div>

      {/* Row 5: Notes, full width */}
      <div className={fieldClass}>
        <Label htmlFor="notes" className={labelClass}>
          Notes
        </Label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          defaultValue={company?.notes ?? ""}
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
