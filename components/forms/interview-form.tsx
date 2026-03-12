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
  INTERVIEW_TYPE_LABELS,
  INTERVIEW_STATUS_LABELS,
} from "@/lib/utils/enums";
import type { InterviewType, InterviewStatus } from "@prisma/client";
import type { Interview } from "@prisma/client";
import type { Company } from "@prisma/client";
import { createInterview, updateInterview } from "@/app/interviews/actions";

type ApplicationOption = {
  id: string;
  label: string;
  companyId: string;
};

type InterviewFormProps = {
  interview?: Interview & {
    company: Company;
    application: { roleTitle: string };
  };
  companies: { id: string; name: string }[];
  applications: ApplicationOption[];
  preselectedCompanyId?: string;
  redirectTo?: string;
};

const textareaClass =
  "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function InterviewForm({
  interview,
  companies,
  applications,
  preselectedCompanyId,
  redirectTo,
}: InterviewFormProps) {
  const router = useRouter();
  const isEdit = !!interview;

  const [state, formAction] = useActionState(
    isEdit ? updateInterview : createInterview,
    null
  );

  const errors = (state as {
    error?: Record<string, string[] | undefined>;
  })?.error;

  const defaultCompanyId =
    preselectedCompanyId ?? interview?.companyId ?? companies[0]?.id;
  const isCompanyLocked = !!preselectedCompanyId || !!interview;
  const filteredApplications = isCompanyLocked
    ? applications.filter((a) => a.companyId === defaultCompanyId)
    : applications;

  return (
    <form action={formAction} className="space-y-6">
      {isEdit && <input type="hidden" name="id" value={interview.id} />}
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="applicationId">Candidature *</Label>
        <Select
          name="applicationId"
          defaultValue={interview?.applicationId ?? ""}
          required
          disabled={filteredApplications.length === 0}
        >
          <SelectTrigger id="applicationId">
            <SelectValue placeholder="Sélectionner une candidature" />
          </SelectTrigger>
          <SelectContent>
            {filteredApplications.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filteredApplications.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Aucune candidature pour cette entreprise.
          </p>
        )}
        {errors?.applicationId && (
          <p className="text-sm text-destructive">
            {errors.applicationId[0]}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="interviewType">Type d&apos;entretien *</Label>
          <Select
            name="interviewType"
            defaultValue={interview?.interviewType}
            required
          >
            <SelectTrigger id="interviewType">
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(INTERVIEW_TYPE_LABELS) as InterviewType[]).map(
                (t) => (
                  <SelectItem key={t} value={t}>
                    {INTERVIEW_TYPE_LABELS[t]}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Statut *</Label>
          <Select name="status" defaultValue={interview?.status} required>
            <SelectTrigger id="status">
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(INTERVIEW_STATUS_LABELS) as InterviewStatus[]).map(
                (s) => (
                  <SelectItem key={s} value={s}>
                    {INTERVIEW_STATUS_LABELS[s]}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="interviewerName">Nom de l&apos;intervieweur</Label>
          <Input
            id="interviewerName"
            name="interviewerName"
            defaultValue={interview?.interviewerName ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="scheduledAt">Date et heure prévues</Label>
          <Input
            id="scheduledAt"
            name="scheduledAt"
            type="datetime-local"
            defaultValue={
              interview?.scheduledAt
                ? (() => {
                    const d = new Date(interview.scheduledAt);
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
                  })()
                : ""
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback">Feedback</Label>
        <textarea
          id="feedback"
          name="feedback"
          rows={3}
          className={textareaClass}
          placeholder="Résumé du feedback reçu..."
          defaultValue={interview?.feedback ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="strengths">Points forts</Label>
        <textarea
          id="strengths"
          name="strengths"
          rows={2}
          className={textareaClass}
          placeholder="Points positifs identifiés..."
          defaultValue={interview?.strengths ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="improvements">Points à améliorer</Label>
        <textarea
          id="improvements"
          name="improvements"
          rows={2}
          className={textareaClass}
          placeholder="Axes d'amélioration..."
          defaultValue={interview?.improvements ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nextStep">Prochaine étape</Label>
        <textarea
          id="nextStep"
          name="nextStep"
          rows={2}
          className={textareaClass}
          placeholder="Suite du process..."
          defaultValue={interview?.nextStep ?? ""}
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
