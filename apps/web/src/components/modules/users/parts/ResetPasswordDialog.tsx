import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import type { ManagedUser } from "@/services/modules/users.service";

interface ResetPasswordDialogProps {
  open: boolean;
  user: ManagedUser | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (password: string) => Promise<void>;
  isSaving: boolean;
}

export default function ResetPasswordDialog({
  open,
  user,
  onOpenChange,
  onSubmit,
  isSaving,
}: ResetPasswordDialogProps) {
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    if (!password) return;
    await onSubmit(password);
    setPassword("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset Account Password</DialogTitle>
          <DialogDescription>
            Set a temporary password for <span className="font-semibold text-foreground">{user?.full_name}</span>. 
            They will be prompted to change it on their next login.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="temporary-password">New Temporary Password</Label>
          <Input
            id="temporary-password"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!password || isSaving}>
            Update Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
