"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function PortalSessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider basePath="/api/portal/auth" refetchOnWindowFocus={false}>
      {children}
    </NextAuthSessionProvider>
  );
}
