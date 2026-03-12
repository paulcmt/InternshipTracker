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
  COMPANY_STATUS_LABELS,
  COMPANY_TYPES,
  COMPANY_TYPE_LABELS,
} from "@/lib/utils/enums";
import type { CompanyStatus } from "@prisma/client";
import type { Company } from "@prisma/client";
import { createCompany, updateCompany } from "@/app/companies/actions";

type CompanyFormProps = {
  company?: Company;
};

export function CompanyForm({ company }: CompanyFormProps) {
  const router = useRouter();
  const isEdit = !!company;

  const [state, formAction] = useActionState(
    isEdit ? updateCompany : createCompany,
    null
  );

  const errors = (state as { error?: Record<string, string[] | undefined> })?.error;

  return (
    <form action={formAction} className="space-y-6">
      {isEdit && <input type="hidden" name="id" value={company.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nom *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={company?.name}
            required
            aria-invalid={!!errors?.name}
          />
          {errors?.name && (
            <p className="text-sm text-destructive">{errors.name[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyType">Type d&apos;entreprise *</Label>
          <Select name="companyType" defaultValue={company?.companyType} required>
            <SelectTrigger id="companyType">
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {COMPANY_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.companyType && (
            <p className="text-sm text-destructive">{errors.companyType[0]}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="country">Pays *</Label>
          <Input
            id="country"
            name="country"
            defaultValue={company?.country}
            required
            aria-invalid={!!errors?.country}
          />
          {errors?.country && (
            <p className="text-sm text-destructive">{errors.country[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Ville</Label>
          <Input id="city" name="city" defaultValue={company?.city ?? ""} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sizeEstimate">Taille (estimation)</Label>
          <Input
            id="sizeEstimate"
            name="sizeEstimate"
            placeholder="ex: 10-50, 200-500"
            defaultValue={company?.sizeEstimate ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetRoles">Rôles cibles *</Label>
        <Input
          id="targetRoles"
          name="targetRoles"
          placeholder="ex: ML Engineer, Data Scientist"
          defaultValue={company?.targetRoles}
          required
          aria-invalid={!!errors?.targetRoles}
        />
        {errors?.targetRoles && (
          <p className="text-sm text-destructive">{errors.targetRoles[0]}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="personalInterest">Intérêt personnel (1-10) *</Label>
          <Input
            id="personalInterest"
            name="personalInterest"
            type="number"
            min={1}
            max={10}
            defaultValue={company?.personalInterest ?? 5}
            required
            aria-invalid={!!errors?.personalInterest}
          />
          {errors?.personalInterest && (
            <p className="text-sm text-destructive">
              {errors.personalInterest[0]}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="deadline">
            Date limite {!isEdit ? "*" : ""}
          </Label>
          <Input
            id="deadline"
            name="deadline"
            type="date"
            required={!isEdit}
            defaultValue={
              company?.deadline
                ? new Date(company.deadline).toISOString().slice(0, 10)
                : ""
            }
            aria-invalid={!!errors?.deadline}
          />
          {errors?.deadline && (
            <p className="text-sm text-destructive">{errors.deadline[0]}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Statut *</Label>
        <Select name="status" defaultValue={company?.status} required>
          <SelectTrigger id="status">
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="careersUrl">URL carrières</Label>
          <Input
            id="careersUrl"
            name="careersUrl"
            type="url"
            placeholder="https://..."
            defaultValue={company?.careersUrl ?? ""}
            aria-invalid={!!errors?.careersUrl}
          />
          {errors?.careersUrl && (
            <p className="text-sm text-destructive">{errors.careersUrl[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="linkedinUrl">URL LinkedIn</Label>
          <Input
            id="linkedinUrl"
            name="linkedinUrl"
            type="url"
            placeholder="https://..."
            defaultValue={company?.linkedinUrl ?? ""}
            aria-invalid={!!errors?.linkedinUrl}
          />
          {errors?.linkedinUrl && (
            <p className="text-sm text-destructive">{errors.linkedinUrl[0]}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          defaultValue={company?.notes ?? ""}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit">
          {isEdit ? "Enregistrer" : "Créer"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
