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
  ROLE_FAMILY_LABELS,
  APPLICATION_TYPE_LABELS,
  APPLICATION_STATUS_LABELS,
} from "@/lib/utils/enums";
import type {
  RoleFamily,
  ApplicationType,
  ApplicationStatus,
} from "@prisma/client";

interface ApplicationsFiltersProps {
  search: string;
  status?: string;
  roleFamily?: string;
  applicationType?: string;
  companyId?: string;
}

interface CompaniesForFilter {
  id: string;
  name: string;
}

export function ApplicationsFilters({
  search,
  status,
  roleFamily,
  applicationType,
  companyId,
  companies = [],
}: ApplicationsFiltersProps & { companies?: CompaniesForFilter[] }) {
  const { setParam, clearFilters, applySearch, searchRef } =
    useFilterParams("/applications");

  const hasFilters =
    search || status || roleFamily || applicationType || companyId;

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
              placeholder="Entreprise ou titre du poste..."
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
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
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
          <Label>Famille de rôle</Label>
          <Select
            value={roleFamily || "all"}
            onValueChange={(v) => setParam("roleFamily", v === "all" ? undefined : v)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {(Object.keys(ROLE_FAMILY_LABELS) as RoleFamily[]).map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_FAMILY_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <Select
            value={applicationType || "all"}
            onValueChange={(v) =>
              setParam("applicationType", v === "all" ? undefined : v)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
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
