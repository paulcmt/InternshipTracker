"use client";

import { useFilterParams } from "@/hooks/use-filter-params";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import {
  ACTION_STATUS_LABELS,
  ACTION_PRIORITY_LABELS,
} from "@/lib/utils/enums";
import type { ActionStatus, ActionPriority } from "@prisma/client";

const DUE_DATE_STATE_OPTIONS = [
  { value: "all", label: "Toutes" },
  { value: "overdue", label: "En retard" },
  { value: "today", label: "Aujourd'hui" },
  { value: "upcoming", label: "Prochaines 7 jours" },
  { value: "none", label: "Sans date" },
];

const LINKED_TYPE_OPTIONS = [
  { value: "all", label: "Tous" },
  { value: "company", label: "Entreprise" },
  { value: "entryPoint", label: "Point d'entrée" },
  { value: "application", label: "Candidature" },
  { value: "interview", label: "Entretien" },
];

interface ActionsFiltersProps {
  search: string;
  status?: string;
  priority?: string;
  linkedType?: string;
  dueDateState?: string;
}

export function ActionsFilters({
  search,
  status,
  priority,
  linkedType,
  dueDateState,
}: ActionsFiltersProps) {
  const { setParam, clearFilters, applySearch, searchRef } =
    useFilterParams("/actions");

  const hasFilters =
    search || status || priority || linkedType || dueDateState;

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[200px] flex-1 space-y-2">
          <Label htmlFor="search">Recherche</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              id="search"
              placeholder="Titre..."
              defaultValue={search}
              className="pl-9"
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), applySearch())
              }
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Statut</Label>
          <Select
            value={status || "all"}
            onValueChange={(v) => setParam("status", v === "all" ? undefined : v)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
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
          <Label>Priorité</Label>
          <Select
            value={priority || "all"}
            onValueChange={(v) =>
              setParam("priority", v === "all" ? undefined : v)
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
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
        <div className="space-y-2">
          <Label>Entité liée</Label>
          <Select
            value={linkedType || "all"}
            onValueChange={(v) =>
              setParam("linkedType", v === "all" ? undefined : v)
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              {LINKED_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Échéance</Label>
          <Select
            value={dueDateState || "all"}
            onValueChange={(v) =>
              setParam("dueDateState", v === "all" ? undefined : v)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              {DUE_DATE_STATE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" size="sm" onClick={applySearch}>
          <Search className="size-4" />
          Filtrer
        </Button>
        {hasFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
            <X className="size-4" />
            Réinitialiser
          </Button>
        )}
      </div>
    </div>
  );
}
