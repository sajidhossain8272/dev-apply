import { SaaSLayout } from "@/components/layout/SaaSLayout";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SaaSLayout>{children}</SaaSLayout>;
}
