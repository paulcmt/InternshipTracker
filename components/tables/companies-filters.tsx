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
import { COMPANY_STATUS_LABELS } from "@/lib/utils/enums";
import type { CompanyStatus } from "@prisma/client";

interface CompaniesFiltersProps {
  search: string;
  status?: string;
  personalInterest?: number;
}

export function CompaniesFilters({
  search,
  status,
  personalInterest,
}: CompaniesFiltersProps) {
  const { setParam, clearFilters, applySearch, searchRef } =
    useFilterParams("/companies");

  const hasFilters =
    search ||
    status ||
    (personalInterest != null && !isNaN(personalInterest));

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px] space-y-2">
          <Label htmlFor="search">Recherche</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              id="search"
              placeholder="Nom de l'entreprise..."
              defaultValue={search}
              className="pl-9"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applySearch())}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Statut</Label>
          <Select
            value={status || "all"}
            onValueChange={(v) => setParam("status", v === "all" ? undefined : v)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
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
        <div className="space-y-2">
          <Label>Intérêt</Label>
          <Select
            value={
              personalInterest != null && !isNaN(personalInterest)
                ? String(personalInterest)
                : "all"
            }
            onValueChange={(v) =>
              setParam("personalInterest", v === "all" ? undefined : v)
            }
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
          >
            <X className="size-4" />
            Réinitialiser
          </Button>
        )}
      </div>
    </div>
  );
}
