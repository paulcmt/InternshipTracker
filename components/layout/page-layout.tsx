import { cn } from "@/lib/utils";

/**
 * Wrapper for page content. Provides top padding so the fixed floating navbar
 * never overlaps content. Replaces the former SidebarInset usage.
 */
export function PageLayout({
  className,
  children,
  ...props
}: React.ComponentProps<"main">) {
  return (
    <main
      className={cn(
        "relative flex min-h-svh w-full flex-1 flex-col bg-background pt-24",
        className
      )}
      {...props}
    >
      {children}
    </main>
  );
}
