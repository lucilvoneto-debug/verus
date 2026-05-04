import { PortalSessionProvider } from "@/components/portal/PortalSessionProvider";

export const dynamic = "force-dynamic";

export default function PortalRootLayout({ children }: { children: React.ReactNode }) {
  return <PortalSessionProvider>{children}</PortalSessionProvider>;
}
