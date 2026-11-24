"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

interface UseNavigationGuardOptions {
  hasUnsavedChanges: boolean;
  onNavigationAttempt: (destination: string) => boolean;
}

/**
 * Hook to intercept navigation and show confirmation dialog
 * when there are unsaved changes
 */
export function useNavigationGuard({
  hasUnsavedChanges,
  onNavigationAttempt,
}: UseNavigationGuardOptions) {
  const router = useRouter();
  const pathname = usePathname();

  // Intercept all link clicks on the page
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (!link) return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      // Check if it's an external link
      if (href.startsWith("http://") || href.startsWith("https://")) {
        const currentHost = window.location.host;
        const linkHost = new URL(href).host;
        if (linkHost !== currentHost) {
          // External link - let beforeunload handle it
          return;
        }
      }

      // Internal link - intercept
      e.preventDefault();
      e.stopPropagation();

      const canNavigate = onNavigationAttempt(href);
      if (canNavigate) {
        router.push(href);
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [hasUnsavedChanges, onNavigationAttempt, router]);

  // Create a wrapped router.push that checks for unsaved changes
  const guardedPush = useCallback(
    (href: string) => {
      if (hasUnsavedChanges) {
        const canNavigate = onNavigationAttempt(href);
        if (!canNavigate) return;
      }
      router.push(href);
    },
    [hasUnsavedChanges, onNavigationAttempt, router]
  );

  return { guardedPush };
}
