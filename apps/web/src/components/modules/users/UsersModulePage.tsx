import { useMemo, useState } from "react";
import { Plus, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";

import PageHeader from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageErrorState, PageLoadingState } from "@/components/ui/page-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import {
  useCreateUser,
  useResetUserPassword,
  useUpdateRolePermissions,
  useUpdateUser,
  useUserPermissions,
  useUserRoles,
  useUsers,
} from "@/hooks/modules/useUsers";
import type {
  ManagedUser,
  UserCreateInput,
  UserListQuery,
  UserUpdateInput,
} from "@/services/modules/users.service";
import type { PermissionKey } from "@/types/auth.types";

import UserStatsStrip from "./parts/UserStatsStrip";
import UserTable from "./parts/UserTable";
import UserFormDialog from "./parts/UserFormDialog";
import ResetPasswordDialog from "./parts/ResetPasswordDialog";
import RolePermissionsMatrix from "./parts/RolePermissionsMatrix";

export default function UsersModulePage() {
  const { user, roles: authRoles } = useAuth();
  const isSuperadmin = authRoles.includes("superadmin");
  const canManageAdmins = isSuperadmin;

  const [activeTab, setActiveTab] = useState<"users" | "roles">("users");
  const [query, setQuery] = useState<UserListQuery>({
    q: "",
    role: "all",
    active: "all",
    page: 1,
    pageSize: 50, // Increased for a smoother table experience
  });

  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [matrixDraft, setMatrixDraft] = useState<
    Record<number, PermissionKey[]>
  >({});

  // Queries & Mutations
  const usersQuery = useUsers(query);
  const rolesQuery = useUserRoles();
  const permissionsQuery = useUserPermissions();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const resetPasswordMutation = useResetUserPassword();
  const updateRolePermissionsMutation = useUpdateRolePermissions();

  // Memos
  const rolesData = useMemo(
    () => rolesQuery.data?.results ?? [],
    [rolesQuery.data?.results],
  );
  const permissionGroups = useMemo(
    () => permissionsQuery.data?.grouped ?? {},
    [permissionsQuery.data?.grouped],
  );

  const roleDrafts = useMemo(() => {
    const drafts = { ...matrixDraft };
    for (const role of rolesData) {
      if (!drafts[role.id]) {
        drafts[role.id] = role.permissions;
      }
    }
    return drafts;
  }, [matrixDraft, rolesData]);

  // Handlers
  const openCreateDialog = () => {
    setDialogMode("create");
    setSelectedUser(null);
    setUserDialogOpen(true);
  };

  const openEditDialog = (managedUser: ManagedUser) => {
    setDialogMode("edit");
    setSelectedUser(managedUser);
    setUserDialogOpen(true);
  };

  const handleUserSubmit = async (
    payload: UserCreateInput | UserUpdateInput,
  ) => {
    try {
      if (dialogMode === "create") {
        await createMutation.mutateAsync(payload as UserCreateInput);
        toast.success("New staff account created.");
      } else if (selectedUser) {
        await updateMutation.mutateAsync({
          id: selectedUser.id,
          payload: payload as UserUpdateInput,
        });
        toast.success("User details updated.");
      }
      setUserDialogOpen(false);
    } catch (error) {
      toast.error("Unable to save user profile.");
    }
  };

  const handleToggleActive = async (managedUser: ManagedUser) => {
    if (managedUser.id === user?.id) {
      toast.error("Security policy: You cannot deactivate your own account.");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: managedUser.id,
        payload: { is_active: !managedUser.is_active },
      });
      toast.success(
        managedUser.is_active
          ? "User account deactivated."
          : "User account reactivated.",
      );
    } catch {
      toast.error("Failed to update account status.");
    }
  };

  const handleResetPassword = async (password: string) => {
    if (!selectedUser) return;
    try {
      await resetPasswordMutation.mutateAsync({
        id: selectedUser.id,
        password: password,
      });
      setPasswordDialogOpen(false);
      toast.success(`Password reset for ${selectedUser.username}.`);
    } catch {
      toast.error("Unable to reset password.");
    }
  };

  const handlePermissionToggle = (
    roleId: number,
    key: PermissionKey,
    checked: boolean,
  ) => {
    setMatrixDraft((prev) => {
      const current = roleDrafts[roleId] ?? [];
      return {
        ...prev,
        [roleId]: checked
          ? Array.from(new Set([...current, key]))
          : current.filter((item) => item !== key),
      };
    });
  };

  const saveRolePermissions = async (roleId: number) => {
    try {
      await updateRolePermissionsMutation.mutateAsync({
        roleId,
        permissions: roleDrafts[roleId] ?? [],
      });
      toast.success("Security matrix updated.");
    } catch {
      toast.error("Failed to save role permissions.");
    }
  };

  if (usersQuery.isLoading && !usersQuery.data) {
    return <PageLoadingState label="Synchronizing user directory..." />;
  }

  if (usersQuery.isError) {
    return (
      <PageErrorState
        title="Directory Sync Error"
        description="We couldn't connect to the user management service."
        onRetry={() => usersQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage staff profiles, regulate system access, and feature access"
        actions={
          <Button onClick={openCreateDialog} className="shadow-sm">
            <Plus className="mr-2 size-4" />
            Add Team Member
          </Button>
        }
      />

      <UserStatsStrip stats={usersQuery.data!.stats} />

      <Card className="overflow-hidden border-none shadow-sm ring-1 ring-border">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="gap-0"
        >
          <div className="border-b bg-muted/20 px-6 pt-4">
            <TabsList variant="line" className="flex w-fit gap-8">
              <TabsTrigger value="users" className="gap-2.5 pb-3">
                <Users className="size-4" />
                <span>Staff Directory</span>
                <Badge
                  variant="secondary"
                  className="rounded-full px-1.5 py-0 text-[10px] font-bold"
                >
                  {usersQuery.data?.pagination.totalCount ?? 0}
                </Badge>
              </TabsTrigger>
              {isSuperadmin && (
                <TabsTrigger value="roles" className="gap-2.5 pb-3">
                  <ShieldCheck className="size-4" />
                  <span>Role Access Matrix</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent
              value="users"
              className="m-0 mt-0 focus-visible:ring-0"
            >
              <UserTable
                data={usersQuery.data?.results ?? []}
                query={query}
                isLoading={usersQuery.isFetching}
                canManageAdmins={canManageAdmins}
                onQueryChange={setQuery}
                onEdit={openEditDialog}
                onResetPassword={(u) => {
                  setSelectedUser(u);
                  setPasswordDialogOpen(true);
                }}
                onToggleActive={handleToggleActive}
              />
            </TabsContent>

            {isSuperadmin && (
              <TabsContent
                value="roles"
                className="m-0 mt-0 focus-visible:ring-0"
              >
                <RolePermissionsMatrix
                  roles={rolesData}
                  permissionGroups={permissionGroups}
                  roleDrafts={roleDrafts}
                  isSaving={updateRolePermissionsMutation.isPending}
                  onToggle={handlePermissionToggle}
                  onSave={saveRolePermissions}
                />
              </TabsContent>
            )}
          </div>
        </Tabs>
      </Card>

      {userDialogOpen && (
        <UserFormDialog
          mode={dialogMode}
          open={userDialogOpen}
          currentUser={selectedUser}
          canManageAdmins={canManageAdmins}
          onOpenChange={setUserDialogOpen}
          onSubmit={handleUserSubmit}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {passwordDialogOpen && (
        <ResetPasswordDialog
          open={passwordDialogOpen}
          user={selectedUser}
          onOpenChange={setPasswordDialogOpen}
          onSubmit={handleResetPassword}
          isSaving={resetPasswordMutation.isPending}
        />
      )}
    </div>
  );
}
