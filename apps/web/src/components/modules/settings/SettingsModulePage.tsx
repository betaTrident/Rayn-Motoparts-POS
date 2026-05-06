import { useEffect, useState } from "react";
import { Lock, UserCircle } from "lucide-react";
import { toast } from "sonner";

import PageHeader from "@/components/layout/PageHeader";
import {
  PageErrorState,
  PageLoadingState,
} from "@/components/ui/page-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useSettingsProfile,
  useUpdateSettingsPassword,
  useUpdateSettingsProfile,
} from "@/hooks/modules/useSettings";

import ProfileSettings from "./parts/ProfileSettings";
import SecuritySettings from "./parts/SecuritySettings";

export default function SettingsModulePage() {
  const profileQuery = useSettingsProfile();
  const updateProfileMutation = useUpdateSettingsProfile();
  const updatePasswordMutation = useUpdateSettingsPassword();

  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");

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
    if (!profileQuery.data) return;

    setProfileForm({
      first_name: profileQuery.data.first_name || "",
      last_name: profileQuery.data.last_name || "",
      phone: profileQuery.data.phone || "",
    });
  }, [profileQuery.data]);

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await updateProfileMutation.mutateAsync({
        first_name: profileForm.first_name.trim(),
        last_name: profileForm.last_name.trim(),
        phone: profileForm.phone.trim() || null,
      });
      toast.success("Profile information updated.");
    } catch {
      toast.error("Unable to save profile changes.");
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (passwordForm.new_password !== passwordForm.new_password_confirm) {
      toast.error("Password confirmation does not match.");
      return;
    }

    try {
      await updatePasswordMutation.mutateAsync(passwordForm);
      setPasswordForm({
        old_password: "",
        new_password: "",
        new_password_confirm: "",
      });
      toast.success("Security credentials updated.");
    } catch {
      toast.error("Failed to update password. Please check your current password.");
    }
  };

  if (profileQuery.isLoading) {
    return <PageLoadingState label="Retrieving account settings..." />;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <PageErrorState
        title="Settings Unavailable"
        description="We encountered an error while loading your account preferences."
        onRetry={() => profileQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Personal Settings"
        description="Manage your professional profile, authentication methods, and notification preferences"
      />

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as any)}
        className="space-y-6"
      >
        <div className="flex items-center justify-between border-b pb-1">
          <TabsList variant="line" className="gap-8">
            <TabsTrigger value="profile" className="gap-2.5 pb-3">
              <UserCircle className="size-4" />
              <span>Personal Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2.5 pb-3">
              <Lock className="size-4" />
              <span>Security & Access</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <TabsContent value="profile" className="m-0 focus-visible:ring-0">
            <ProfileSettings
              data={profileQuery.data}
              form={profileForm}
              onChange={(updates) => setProfileForm((prev) => ({ ...prev, ...updates }))}
              onSubmit={handleProfileSubmit}
              isSaving={updateProfileMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="security" className="m-0 focus-visible:ring-0">
            <SecuritySettings
              form={passwordForm}
              onChange={(updates) => setPasswordForm((prev) => ({ ...prev, ...updates }))}
              onSubmit={handlePasswordSubmit}
              isSaving={updatePasswordMutation.isPending}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
