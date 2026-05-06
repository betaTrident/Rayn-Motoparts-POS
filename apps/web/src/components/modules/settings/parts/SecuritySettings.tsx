import { Lock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SecuritySettingsProps {
  form: {
    old_password: string;
    new_password: string;
    new_password_confirm: string;
  };
  onChange: (updates: Partial<{ old_password: string; new_password: string; new_password_confirm: string }>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSaving: boolean;
}

export default function SecuritySettings({ form, onChange, onSubmit, isSaving }: SecuritySettingsProps) {
  return (
    <Card className="border-none shadow-sm ring-1 ring-border">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 px-6 py-4">
        <div className="space-y-0.5">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="size-4 text-primary" />
            Security & Access
          </CardTitle>
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
            Update your authentication credentials and account protection
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl bg-amber-50/50 p-5 border border-amber-100/50">
              <div className="flex items-center gap-2 text-amber-800">
                <ShieldAlert className="size-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Security Best Practices</h4>
              </div>
              <ul className="mt-3 space-y-2 text-[11px] text-amber-700/80 leading-relaxed list-disc list-inside">
                <li>Use at least 12 characters</li>
                <li>Mix uppercase, lowercase, and symbols</li>
                <li>Avoid using personal information</li>
                <li>Never reuse passwords from other sites</li>
              </ul>
            </div>
            <p className="text-[11px] text-muted-foreground px-1">
              Changing your password will invalidate all other active sessions for this account.
            </p>
          </div>

          <form onSubmit={onSubmit} className="lg:col-span-3 space-y-5 max-w-md">
            <div className="space-y-1.5">
              <Label htmlFor="old_password">Current Password</Label>
              <Input
                id="old_password"
                type="password"
                placeholder="••••••••"
                value={form.old_password}
                onChange={(e) => onChange({ old_password: e.target.value })}
                required
              />
            </div>
            
            <div className="h-px bg-border/50 my-2" />

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new_password">New Password</Label>
                <Input
                  id="new_password"
                  type="password"
                  placeholder="Create new password"
                  value={form.new_password}
                  onChange={(e) => onChange({ new_password: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new_password_confirm">Confirm New Password</Label>
                <Input
                  id="new_password_confirm"
                  type="password"
                  placeholder="Verify new password"
                  value={form.new_password_confirm}
                  onChange={(e) => onChange({ new_password_confirm: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full" disabled={isSaving}>
                Update Account Password
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
