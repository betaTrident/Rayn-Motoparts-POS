import { 
  ChevronDown, 
  Database, 
  History, 
  LayoutGrid, 
  Monitor, 
  Package, 
  Save, 
  Settings, 
  ShieldCheck, 
  Tag, 
  Users, 
  Users2
} from "lucide-react";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { PermissionGroup, PermissionKey, UserRoleData } from "@/types/auth.types";

interface RolePermissionsMatrixProps {
  roles: UserRoleData[];
  permissionGroups: Record<string, PermissionGroup[]>;
  roleDrafts: Record<number, PermissionKey[]>;
  isSaving: boolean;
  onToggle: (roleId: number, key: PermissionKey, checked: boolean) => void;
  onSave: (roleId: number) => Promise<void>;
}

const MODULE_ICONS: Record<string, any> = {
  inventory: Package,
  catalog: Tag,
  pos: Monitor,
  users: Users,
  customers: Users2,
  transactions: History,
  reports: LayoutGrid,
  settings: Settings,
  "system_audit": Database,
};

export default function RolePermissionsMatrix({
  roles,
  permissionGroups,
  roleDrafts,
  isSaving,
  onToggle,
  onSave,
}: RolePermissionsMatrixProps) {
  const filteredRoles = roles.filter((role) => role.name !== "superadmin");

  if (filteredRoles.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center h-40 text-muted-foreground">
          <ShieldCheck className="size-8 mb-2 opacity-20" />
          <p className="text-sm">No manageable roles found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={filteredRoles.map(r => r.id.toString())} className="space-y-4">
        {filteredRoles.map((role) => (
          <AccordionItem 
            key={role.id} 
            value={role.id.toString()} 
            className="border-none shadow-sm ring-1 ring-border rounded-xl bg-card overflow-hidden"
          >
            <div className="flex flex-row items-center justify-between bg-muted/30 px-6 py-4 border-b">
              <AccordionTrigger className="flex-1 hover:no-underline py-0">
                <div className="flex items-center gap-4 text-left">
                  <div className="bg-primary/10 text-primary p-2 rounded-lg">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-lg font-bold capitalize leading-none">
                      {role.name} Access Control
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                      {role.user_count} assigned {role.user_count === 1 ? "user" : "users"}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <div className="flex items-center gap-3 pl-4 border-l ml-4">
                <Button 
                  size="sm" 
                  className="h-8 px-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSave(role.id);
                  }}
                  disabled={isSaving}
                >
                  <Save className="mr-2 size-3.5" />
                  Save Changes
                </Button>
              </div>
            </div>
            
            <AccordionContent className="p-0">
              <div className="p-6 space-y-10">
                {Object.entries(permissionGroups).map(([module, permissions]) => {
                  const Icon = MODULE_ICONS[module.toLowerCase()] || LayoutGrid;
                  return (
                    <div key={module} className="space-y-5">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2.5">
                          <div className="bg-muted p-1.5 rounded-md">
                            <Icon className="size-3.5 text-muted-foreground" />
                          </div>
                          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/70">
                            {module.replace("_", " ")} Module
                          </h4>
                        </div>
                        <div className="h-px flex-1 bg-gradient-to-r from-border/80 to-transparent" />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                        {permissions.map((permission) => {
                          const isChecked = (roleDrafts[role.id] ?? []).includes(permission.key);
                          return (
                            <div
                              key={`${role.id}-${permission.key}`}
                              className={cn(
                                "group flex flex-row items-center justify-between gap-4 rounded-xl border p-4 transition-all",
                                isChecked 
                                  ? "bg-primary/[0.02] border-primary/20 ring-1 ring-primary/5 shadow-sm" 
                                  : "bg-background border-border/50 hover:border-border hover:bg-muted/30"
                              )}
                            >
                              <div className="min-w-0 space-y-1">
                                <span className={cn(
                                  "block text-[13px] font-semibold leading-tight",
                                  isChecked ? "text-foreground" : "text-foreground/80"
                                )}>
                                  {permission.action}
                                </span>
                                <span className="block text-[11px] leading-relaxed text-muted-foreground/70 group-hover:text-muted-foreground/90 transition-colors truncate">
                                  {permission.description || permission.key}
                                </span>
                              </div>
                              <Switch
                                checked={isChecked}
                                onCheckedChange={(checked) =>
                                  onToggle(role.id, permission.key, checked)
                                }
                                className="data-[state=checked]:bg-primary"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
