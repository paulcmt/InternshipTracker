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
  ENTRY_POINT_TYPE_LABELS,
  ENTRY_POINT_STATUS_LABELS,
} from "@/lib/utils/enums";
import type { EntryPointType, EntryPointStatus } from "@prisma/client";

interface EntryPointsFiltersProps {
  search: string;
  status?: string;
  type?: string;
  companyId?: string;
}

interface CompaniesForFilter {
  id: string;
  name: string;
}

export function EntryPointsFilters({
  search,
  status,
  type,
  companyId,
  companies = [],
}: EntryPointsFiltersProps & { companies?: CompaniesForFilter[] }) {
  const { setParam, clearFilters, applySearch, searchRef } =
    useFilterParams("/entry-points");

  const hasFilters = search || status || type || companyId;

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
              placeholder="Personne ou entreprise..."
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
        <div className="space-y-2">
          <Label>Type</Label>
          <Select
            value={type || "all"}
            onValueChange={(v) => setParam("type", v === "all" ? undefined : v)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              {(Object.keys(ENTRY_POINT_TYPE_LABELS) as EntryPointType[]).map(
                (t) => (
                  <SelectItem key={t} value={t}>
                    {ENTRY_POINT_TYPE_LABELS[t]}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
        {companies.length > 0 && (
          <div className="space-y-2">
            <Label>Entreprise</Label>
            <Select
              value={companyId || "all"}
              onValueChange={(v) => setParam("companyId", v === "all" ? undefined : v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Toutes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
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
