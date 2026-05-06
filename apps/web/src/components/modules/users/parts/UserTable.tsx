import { Eye, KeyRound, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ManagedUser, UserListQuery } from "@/services/modules/users.service";
import type { UserRole } from "@/types/auth.types";

interface UserTableProps {
  data: ManagedUser[];
  query: UserListQuery;
  isLoading: boolean;
  canManageAdmins: boolean;
  onQueryChange: (query: UserListQuery) => void;
  onEdit: (user: ManagedUser) => void;
  onResetPassword: (user: ManagedUser) => void;
  onToggleActive: (user: ManagedUser) => void;
}

function roleLabel(role: UserRole | null) {
  if (role === "superadmin") return "Superadmin";
  if (role === "admin") return "Admin";
  return "Staff";
}

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function UserTable({
  data,
  query,
  isLoading,
  canManageAdmins,
  onQueryChange,
  onEdit,
  onResetPassword,
  onToggleActive,
}: UserTableProps) {
  const hasFilters = query.q || query.role !== "all" || query.active !== "all";

  const clearFilters = () => {
    onQueryChange({ ...query, q: "", role: "all", active: "all", page: 1 });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or username..."
            className="pl-9"
            value={query.q ?? ""}
            onChange={(e) => onQueryChange({ ...query, q: e.target.value, page: 1 })}
          />
        </div>
        <Select
          value={query.role ?? "all"}
          onValueChange={(value) =>
            onQueryChange({ ...query, role: value as UserListQuery["role"], page: 1 })
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {canManageAdmins && <SelectItem value="admin">Administrators</SelectItem>}
            <SelectItem value="staff">Staff Members</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={query.active ?? "all"}
          onValueChange={(value) =>
            onQueryChange({ ...query, active: value as UserListQuery["active"], page: 1 })
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 px-3">
            <X className="mr-2 size-4" />
            Clear
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[30%] px-6">User Profile</TableHead>
              <TableHead className="px-6">System Role</TableHead>
              <TableHead className="px-6">Account Status</TableHead>
              <TableHead className="px-6">Last Activity</TableHead>
              <TableHead className="px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : data.length > 0 ? (
              data.map((user) => (
                <TableRow key={user.id} className="group transition-colors">
                  <TableCell className="px-6">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{user.full_name}</span>
                      <span className="text-[11px] text-muted-foreground tabular-nums">@{user.username} • {user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6">
                    <Badge variant="outline" className="font-medium">
                      {roleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6">
                    <Badge 
                      variant={user.is_active ? "secondary" : "destructive"} 
                      className={user.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50" : ""}
                    >
                      {user.is_active ? "Active" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 text-xs text-muted-foreground tabular-nums">
                    {formatDate(user.last_login_at)}
                  </TableCell>
                  <TableCell className="px-6">
                    <div className="flex justify-start gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="size-8"
                        title="Edit User"
                        onClick={() => onEdit(user)}
                      >
                        <Eye className="size-3.5" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="size-8"
                        title="Reset Password"
                        onClick={() => onResetPassword(user)}
                      >
                        <KeyRound className="size-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`h-8 text-[11px] font-medium ${
                          user.is_active ? "text-rose-600 hover:text-rose-700 hover:bg-rose-50" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        }`}
                        onClick={() => onToggleActive(user)}
                      >
                        {user.is_active ? "Deactivate" : "Reactivate"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">No users found</p>
                    <Button variant="link" size="sm" onClick={clearFilters}>
                      Clear all filters
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
