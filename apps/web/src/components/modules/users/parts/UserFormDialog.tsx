import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ManagedUser,
  UserCreateInput,
  UserUpdateInput,
} from "@/services/modules/users.service";

const emptyUserForm: UserCreateInput = {
  email: "",
  username: "",
  first_name: "",
  last_name: "",
  phone: "",
  role: "staff",
  password: "",
  is_active: true,
};

interface UserFormDialogProps {
  mode: "create" | "edit";
  open: boolean;
  currentUser: ManagedUser | null;
  canManageAdmins: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: UserCreateInput | UserUpdateInput) => Promise<void>;
  isSaving: boolean;
}

export default function UserFormDialog({
  mode,
  open,
  currentUser,
  canManageAdmins,
  onOpenChange,
  onSubmit,
  isSaving,
}: UserFormDialogProps) {
  const [form, setForm] = useState<UserCreateInput>({
    ...emptyUserForm,
    ...(currentUser
      ? {
          email: currentUser.email,
          username: currentUser.username,
          first_name: currentUser.first_name,
          last_name: currentUser.last_name,
          phone: currentUser.phone ?? "",
          role: currentUser.role === "admin" ? "admin" : "staff",
          password: "",
          is_active: currentUser.is_active,
        }
      : {}),
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === "create") {
      await onSubmit({
        ...form,
        phone: form.phone?.trim() || null,
      });
      return;
    }

    await onSubmit({
      username: form.username.trim(),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone: form.phone?.trim() || null,
      role: form.role,
      is_active: form.is_active,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create New User" : "Edit User Account"}</DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Register a new staff member or administrator." 
              : "Update account details and access level."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4 grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                placeholder="John"
                value={form.first_name}
                onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                placeholder="Doe"
                value={form.last_name}
                onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                disabled={mode === "edit"}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="johndoe"
                value={form.username}
                onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+1 234 567 890"
                value={form.phone ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Access Level</Label>
              <Select
                value={form.role}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, role: value as "admin" | "staff" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff Member</SelectItem>
                  {canManageAdmins && <SelectItem value="admin">Administrator</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            {mode === "create" && (
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="password">Temporary Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  The user will be required to change this password upon their first login.
                </p>
              </div>
            )}
            {mode === "edit" && (
              <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 px-4 py-3 sm:col-span-2">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active" className="text-sm font-semibold cursor-pointer">
                    Account Status
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Enable or disable system access for this user
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={form.is_active}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, is_active: checked }))
                  }
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="mr-2 size-4" />
              {mode === "create" ? "Create Account" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
