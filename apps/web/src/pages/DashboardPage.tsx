import DashboardModulePage from "@/components/modules/dashboard/DashboardModulePage";
import { usePermissions } from "@/hooks/usePermissions";

export default function DashboardPage() {
  const { highestRole } = usePermissions();
  return <DashboardModulePage variant={highestRole === "staff" ? "staff" : "admin"} />;
}
