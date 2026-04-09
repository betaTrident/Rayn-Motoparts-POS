import { useEffect, useState } from "react";
import { toast } from "sonner";

import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PageErrorState,
  PageLoadingState,
} from "@/components/ui/page-state";
import {
  useSettingsProfile,
  useUpdateSettingsPassword,
  useUpdateSettingsProfile,
} from "@/hooks/modules/useSettings";

export default function SettingsModulePage() {
  const profileQuery = useSettingsProfile();
  const updateProfileMutation = useUpdateSettingsProfile();
  const updatePasswordMutation = useUpdateSettingsPassword();

  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    new_password_confirm: "",
  });

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }

    setProfileForm({
      first_name: profileQuery.data.first_name || "",
      last_name: profileQuery.data.last_name || "",
      phone: profileQuery.data.phone || "",
    });
  }, [profileQuery.data]);

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await updateProfileMutation.mutateAsync({
        first_name: profileForm.first_name.trim(),
        last_name: profileForm.last_name.trim(),
        phone: profileForm.phone.trim() || null,
      });
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (passwordForm.new_password !== passwordForm.new_password_confirm) {
      toast.error("New password and confirmation do not match");
      return;
    }

    try {
      await updatePasswordMutation.mutateAsync(passwordForm);
      setPasswordForm({
        old_password: "",
        new_password: "",
        new_password_confirm: "",
      });
      toast.success("Password updated successfully");
    } catch {
      toast.error("Failed to update password");
    }
  };

  if (profileQuery.isLoading) {
    return <PageLoadingState label="Loading settings..." />;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <PageErrorState
        title="Unable to load settings"
        description="Please check your connection and try again."
        onRetry={() => profileQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage account profile and security settings"
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profileQuery.data.email} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={profileQuery.data.username} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={profileForm.first_name}
                  onChange={(event) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      first_name: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={profileForm.last_name}
                  onChange={(event) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      last_name: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={profileForm.phone}
                  onChange={(event) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      phone: event.target.value,
                    }))
                  }
                  placeholder="Optional"
                />
              </div>
              <Button type="submit" disabled={updateProfileMutation.isPending}>
                Save Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="old_password">Current Password</Label>
                <Input
                  id="old_password"
                  type="password"
                  value={passwordForm.old_password}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      old_password: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_password">New Password</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      new_password: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_password_confirm">Confirm New Password</Label>
                <Input
                  id="new_password_confirm"
                  type="password"
                  value={passwordForm.new_password_confirm}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      new_password_confirm: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <Button type="submit" disabled={updatePasswordMutation.isPending}>
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
