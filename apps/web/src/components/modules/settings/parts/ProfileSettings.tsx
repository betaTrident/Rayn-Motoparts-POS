import { Save, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileSettingsProps {
  data: {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    username: string;
  };
  form: {
    first_name: string;
    last_name: string;
    phone: string;
  };
  onChange: (updates: Partial<{ first_name: string; last_name: string; phone: string }>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSaving: boolean;
}

export default function ProfileSettings({ data, form, onChange, onSubmit, isSaving }: ProfileSettingsProps) {
  return (
    <Card className="border-none shadow-sm ring-1 ring-border">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 px-6 py-4">
        <div className="space-y-0.5">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="size-4 text-primary" />
            Account Identity
          </CardTitle>
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
            Manage your personal profile and contact information
          </p>
        </div>
        <Button size="sm" className="h-8" onClick={onSubmit} disabled={isSaving}>
          <Save className="mr-2 size-3.5" />
          Save Changes
        </Button>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={onSubmit} className="grid gap-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* System Info (Read-Only) */}
            <div className="space-y-4 rounded-xl bg-muted/30 p-5 ring-1 ring-border/50">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                System Credentials
              </h3>
              <div className="grid gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs">Registered Email</Label>
                  <Input id="email" value={data.email} disabled className="bg-background/50 h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-xs">System Username</Label>
                  <Input id="username" value={data.username} disabled className="bg-background/50 h-9 text-xs" />
                </div>
              </div>
            </div>

            {/* Editable Info */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                Personal Details
              </h3>
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="first_name" className="text-xs">First Name</Label>
                    <Input
                      id="first_name"
                      placeholder="Enter first name"
                      value={form.first_name}
                      onChange={(e) => onChange({ first_name: e.target.value })}
                      required
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="last_name" className="text-xs">Last Name</Label>
                    <Input
                      id="last_name"
                      placeholder="Enter last name"
                      value={form.last_name}
                      onChange={(e) => onChange({ last_name: e.target.value })}
                      required
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs">Contact Number</Label>
                  <Input
                    id="phone"
                    placeholder="+63 XXX XXX XXXX"
                    value={form.phone}
                    onChange={(e) => onChange({ phone: e.target.value })}
                    className="h-9 text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground">Used for account verification and system notifications</p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
