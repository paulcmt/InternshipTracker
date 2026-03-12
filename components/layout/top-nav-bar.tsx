"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  FileText,
  Users,
  ListTodo,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/actions", label: "Actions", icon: ListTodo },
  { href: "/companies", label: "Entreprises", icon: Building2 },
  { href: "/entry-points", label: "Points d'entrée", icon: DoorOpen },
  { href: "/applications", label: "Candidatures", icon: FileText },
  { href: "/interviews", label: "Entretiens", icon: Users },
] as const;

const navContainerClasses = cn(
  "flex w-fit max-w-[calc(100vw-2rem)] items-center gap-1 rounded-2xl px-3 py-2",
  "border border-white/20 dark:border-white/10",
  "bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl",
  "shadow-lg shadow-black/5 dark:shadow-black/20"
);

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  showLabel = true,
  className,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
        showLabel ? "min-w-0" : "px-2",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        className
      )}
      aria-current={isActive ? "page" : undefined}
      aria-label={showLabel ? undefined : label}
      title={showLabel ? undefined : label}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {showLabel && <span className="whitespace-nowrap">{label}</span>}
    </Link>
  );
}

export function TopNavBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      role="navigation"
      aria-label="Navigation principale"
      className="fixed top-5 left-1/2 z-50 -translate-x-1/2"
    >
      {/* Desktop lg+: full nav with icon + label */}
      <div
        className={cn(
          navContainerClasses,
          "hidden lg:flex overflow-x-auto"
        )}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            isActive={isActive(item.href)}
            showLabel
          />
        ))}
      </div>

      {/* Tablet md: icon-only nav */}
      <div
        className={cn(
          navContainerClasses,
          "hidden md:flex lg:hidden overflow-x-auto"
        )}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            isActive={isActive(item.href)}
            showLabel={false}
          />
        ))}
      </div>

      {/* Mobile sm and below: compact bar with menu */}
      <div className={cn(navContainerClasses, "flex md:hidden gap-2")}>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 rounded-xl h-9 px-3 gap-2 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              aria-label="Ouvrir le menu de navigation"
              aria-expanded={mobileOpen}
            >
              <Menu className="size-5" aria-hidden />
              <span className="text-sm font-medium max-w-24 truncate">
                {navItems.find((i) => isActive(i.href))?.label ?? "Menu"}
              </span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="top"
            showCloseButton
            className="rounded-b-2xl border-t border-x border-white/20 dark:border-white/10 bg-white/95 dark:bg-zinc-900/95 pt-16"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Menu de navigation</SheetTitle>
            </SheetHeader>
            <nav
              className="flex flex-col gap-1 pb-4"
              aria-label="Pages de l'application"
            >
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <item.icon className="size-5 shrink-0" aria-hidden />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
