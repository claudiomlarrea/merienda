"use client";

import { CommunityProvider } from "@/context/community-places";
import { SavedProvider } from "@/context/saved-places";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SavedProvider>
        <CommunityProvider>{children}</CommunityProvider>
      </SavedProvider>
    </TooltipProvider>
  );
}
