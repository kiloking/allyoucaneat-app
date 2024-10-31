import AdminPanelLayout from "../admin-panel/admin-panel-layout";
import { ContentLayout } from "../admin-panel/content-layout";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminPanelLayout>{children}</AdminPanelLayout>;
}
