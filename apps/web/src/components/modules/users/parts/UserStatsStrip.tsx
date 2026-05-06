import { 
  ShieldCheck, 
  UserCheck, 
  Users, 
  UserX, 
  Users2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { UserStats } from "@/services/modules/users.service";

interface UserStatsStripProps {
  stats: UserStats;
}

export default function UserStatsStrip({ stats }: UserStatsStripProps) {
  const items = [
    { 
      label: "System Directory", 
      value: stats.total, 
      icon: Users, 
      accent: "primary" 
    },
    { 
      label: "Active Accounts", 
      value: stats.active, 
      icon: UserCheck, 
      accent: "green" 
    },
    { 
      label: "Disabled Access", 
      value: stats.inactive, 
      icon: UserX, 
      accent: "amber" 
    },
    { 
      label: "Administrative", 
      value: stats.admins, 
      icon: ShieldCheck, 
      accent: "blue" 
    },
    { 
      label: "Staff Members", 
      value: stats.staff, 
      icon: Users2, 
      accent: "indigo" 
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => (
        <StatCard 
          key={item.label} 
          label={item.label} 
          value={item.value} 
          icon={item.icon} 
          accent={item.accent as any} 
        />
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: any;
  accent: "primary" | "green" | "amber" | "blue" | "indigo";
}) {
  const colors = {
    primary: "bg-primary/10 text-primary border-primary/20",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900",
    amber: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900",
    blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-900",
  };

  return (
    <Card className="overflow-hidden border-none shadow-sm ring-1 ring-border">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
          colors[accent]
        )}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-tight text-foreground leading-none">
            {value}
          </p>
          <p className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 truncate">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
