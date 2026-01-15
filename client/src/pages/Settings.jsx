import { motion } from "framer-motion";
import { User, Bell, Shield, CreditCard, Palette, HelpCircle, Eye, EyeOff, Trash2, ArrowRight, TrendingUp } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useUploadAvatar, useDeleteAvatar, useUpdateUsername, useChangePassword } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { getMySubscription } from "../services/billing.service";

const settingsSections = [
  { id: "profile", labelKey: "settings.sections.profile", icon: User },
  { id: "notifications", labelKey: "settings.sections.notifications", icon: Bell },
  { id: "security", labelKey: "settings.sections.security", icon: Shield },
  { id: "billing", labelKey: "settings.sections.billing", icon: CreditCard },
  { id: "appearance", labelKey: "settings.sections.appearance", icon: Palette },
  { id: "help", labelKey: "settings.sections.help", icon: HelpCircle },
];

export default function Settings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("profile");
  const { user, isGuest, loading, refreshUser } = useAuth();
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  // Billing state
  const [subscription, setSubscription] = useState(null);
  const [loadingBilling, setLoadingBilling] = useState(false);

  // Profile form state
  const [username, setUsername] = useState("");

  // Password change state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword1, setNewPassword1] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword1, setShowNewPassword1] = useState(false);
  const [showNewPassword2, setShowNewPassword2] = useState(false);

  const fileInputRef = useRef(null);
  const { toast } = useToast();

  // React Query mutations
  const uploadAvatarMutation = useUploadAvatar();
  const deleteAvatarMutation = useDeleteAvatar();
  const updateUsernameMutation = useUpdateUsername();
  const changePasswordMutation = useChangePassword();

  // Redirect guests away from settings
  if (!loading && isGuest) {
    return <Navigate to="/dashboard" replace />;
  }

  // Load user profile data
  useEffect(() => {
    if (user && !isGuest) {
      setUsername(user.username || "");
      const loginMethod = localStorage.getItem('loginMethod');
      setIsGoogleUser(loginMethod === 'google');
    }
  }, [user, isGuest]);

  // Load billing data when billing section is active
  useEffect(() => {
    if (activeSection === 'billing' && user && !isGuest) {
      fetchBillingData();
    }
  }, [activeSection, user, isGuest]);

  const fetchBillingData = async () => {
    try {
      setLoadingBilling(true);
      const data = await getMySubscription();
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoadingBilling(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: t("common.error"),
        description: t("validation.invalidImage"),
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t("common.error"),
        description: t("validation.fileTooLarge"),
        variant: "destructive",
      });
      return;
    }

    try {
      await uploadAvatarMutation.mutateAsync(file);
      toast({
        title: t("common.success"),
        description: t("toast.avatarUpdated"),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error.response?.data?.detail || error.message || t("toast.failedToUpload"),
        variant: "destructive",
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm(t("validation.deleteAvatarConfirm"))) {
      return;
    }

    try {
      await deleteAvatarMutation.mutateAsync();
      toast({
        title: t("common.success"),
        description: t("toast.avatarDeleted"),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error.response?.data?.detail || error.message || t("toast.failedToDelete"),
        variant: "destructive",
      });
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      toast({
        title: t("common.error"),
        description: t("validation.usernameRequired"),
        variant: "destructive",
      });
      return;
    }

    const hasUsernameChanged = username !== user?.username;
    const hasPasswordChange = oldPassword && newPassword1 && newPassword2;

    if (!hasUsernameChanged && !hasPasswordChange) {
      toast({
        title: t("common.info"),
        description: t("validation.noChanges"),
      });
      return;
    }

    try {
      // Update username if changed
      if (hasUsernameChanged) {
        await updateUsernameMutation.mutateAsync(username);
      }

      // Change password if provided
      if (hasPasswordChange) {
        if (newPassword1 !== newPassword2) {
          toast({
            title: t("common.error"),
            description: t("validation.passwordsDontMatch"),
            variant: "destructive",
          });
          return;
        }

        if (newPassword1.length < 8) {
          toast({
            title: t("common.error"),
            description: t("validation.passwordMinLength"),
            variant: "destructive",
          });
          return;
        }

        await changePasswordMutation.mutateAsync({
          oldPassword,
          newPassword1,
          newPassword2,
        });
        setOldPassword("");
        setNewPassword1("");
        setNewPassword2("");
      }

      toast({
        title: t("common.success"),
        description: t("toast.profileUpdated"),
      });
    } catch (error) {
      // Parse Django validation errors
      const errorData = error.response?.data;
      let errorMessage = t("toast.failedToUpdate");

      if (errorData) {
        // Check for field-specific errors (Django returns errors as objects)
        if (typeof errorData === 'object' && !errorData.detail) {
          const errors = [];
          for (const [field, messages] of Object.entries(errorData)) {
            if (Array.isArray(messages)) {
              errors.push(...messages);
            } else if (typeof messages === 'string') {
              errors.push(messages);
            }
          }
          errorMessage = errors.join(' ') || errorMessage;
        } else {
          errorMessage = errorData.detail || errorData.message || errorMessage;
        }
      }

      toast({
        title: t("common.error"),
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">{t("common.loading")}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user || isGuest) {
    return <Navigate to="/dashboard" replace />;
  }

  const getInitials = () => {
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  // Filter settings sections - hide Security for Google users
  const filteredSections = isGoogleUser
    ? settingsSections.filter(section => section.id !== "security")
    : settingsSections;

  // Theme management state
  const [themeMode, setThemeMode] = useState(() => {
    // Load theme preference from user-specific localStorage key
    if (user?.id) {
      const userThemeKey = `theme_user_${user.id}`;
      const saved = localStorage.getItem(userThemeKey);
      // If saved theme is custom, default to light instead
      if (saved === "custom" || saved === "custom-editing") {
        return "light";
      }
      return saved || "light";
    }
    return "light";
  });

  // handlers: Theme Selection
  const handleThemeChange = (mode) => {
    // Update local state
    setThemeMode(mode);

    // Persist to user-specific localStorage key
    if (user?.id) {
      const userThemeKey = `theme_user_${user.id}`;
      localStorage.setItem(userThemeKey, mode);

      // Dispatch custom event to notify DashboardLayout
      window.dispatchEvent(new Event("themeChange"));
    }
  };

  // export logic: Export settings to alert
  const handleExport = () => {
    const exportData = {
      mode_type: themeMode
    };
    alert(JSON.stringify(exportData, null, 2));
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-serif text-3xl text-foreground mb-2">{t('settings.title')}</h1>
          <p className="text-muted-foreground">
            {t('settings.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {filteredSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                        activeSection === section.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <section.icon className="h-4 w-4" />
                      {t(section.labelKey)}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </motion.div>

          {/* Content */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-3 space-y-6">
            {activeSection === "profile" && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>{t('settings.profile.title')}</CardTitle>
                    <CardDescription>
                      {t('settings.profile.subtitle')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-6">
                      {user?.avatar_url ? (
                        <div className="relative">
                          <img
                            src={user.avatar_url}
                            alt="Profile"
                            className="h-20 w-20 rounded-xl object-cover"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={handleDeleteAvatar}
                            disabled={deleteAvatarMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-serif text-2xl">
                          {getInitials()}
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          id="avatar-upload"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadAvatarMutation.isPending}
                        >
                          {uploadAvatarMutation.isPending ? t("settings.profile.uploading") : t("settings.profile.changeAvatar")}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          {t("settings.profile.avatarHint")}
                        </p>
                      </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSaveProfile}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            {t("settings.profile.username")}
                          </label>
                          <Input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder={t("settings.profile.usernamePlaceholder")}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            {t("settings.profile.userId")}
                          </label>
                          <Input value={user.id || ""} disabled />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            {t("settings.profile.emailAddress")}
                          </label>
                          <Input type="email" value={user.email || ""} disabled />
                        </div>
                      </div>

                      {/* Change Password Section - Only show if not Google user */}
                      {!isGoogleUser && (
                        <div className="mt-6 pt-6 border-t border-border">
                          <h3 className="text-lg font-medium text-foreground mb-4">{t("settings.profile.changePassword")}</h3>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-foreground mb-2 block">
                                {t("settings.profile.currentPassword")}
                              </label>
                              <div className="relative">
                                <Input
                                  type={showOldPassword ? "text" : "password"}
                                  value={oldPassword}
                                  onChange={(e) => setOldPassword(e.target.value)}
                                  placeholder={t("settings.profile.currentPasswordPlaceholder")}
                                  className="pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowOldPassword(!showOldPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                  {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium text-foreground mb-2 block">
                                {t("settings.profile.newPassword")}
                              </label>
                              <div className="relative">
                                <Input
                                  type={showNewPassword1 ? "text" : "password"}
                                  value={newPassword1}
                                  onChange={(e) => setNewPassword1(e.target.value)}
                                  placeholder={t("settings.profile.newPasswordPlaceholder")}
                                  className="pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowNewPassword1(!showNewPassword1)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                  {showNewPassword1 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium text-foreground mb-2 block">
                                {t("settings.profile.confirmNewPassword")}
                              </label>
                              <div className="relative">
                                <Input
                                  type={showNewPassword2 ? "text" : "password"}
                                  value={newPassword2}
                                  onChange={(e) => setNewPassword2(e.target.value)}
                                  placeholder={t("settings.profile.confirmNewPasswordPlaceholder")}
                                  className="pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowNewPassword2(!showNewPassword2)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                  {showNewPassword2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end mt-6">
                        <Button type="submit" disabled={updateUsernameMutation.isPending || changePasswordMutation.isPending}>
                          {(updateUsernameMutation.isPending || changePasswordMutation.isPending) ? t("common.saving") : t("common.save")}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Account Information Card */}
                {user && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{t("settings.account.title")}</CardTitle>
                          <CardDescription>
                            {t("settings.account.subtitle")}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                          <span className="text-sm text-muted-foreground">{t("settings.account.created")}</span>
                          <span className="text-sm font-medium text-foreground">
                            {user.created_at
                              ? new Date(user.created_at).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {activeSection === "security" && !isGoogleUser && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.security.title')}</CardTitle>
                  <CardDescription>
                    {t('settings.security.subtitle')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{t('settings.security.availableInProfile')}</p>
                </CardContent>
              </Card>
            )}

            {/* Appearance Settings Section */}
            {activeSection === "appearance" && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.sections.appearance')}</CardTitle>
                  <CardDescription>
                    {t('settings.appearance.title')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Mode Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      variant={themeMode === "light" ? "default" : "outline"}
                      onClick={() => handleThemeChange("light")}
                      className="w-full justify-start"
                    >
                      <span className="mr-2">☀️</span> {t('common.lightMode', 'Light Mode')}
                    </Button>
                    <Button
                      variant={themeMode === "dark" ? "default" : "outline"}
                      onClick={() => handleThemeChange("dark")}
                      className="w-full justify-start"
                    >
                      <span className="mr-2">🌙</span> {t('common.darkMode', 'Dark Mode')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Billing Section */}
            {activeSection === "billing" && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.billing.title')}</CardTitle>
                  <CardDescription>
                    {t('settings.billing.subtitle')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingBilling ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : subscription ? (
                    <div className="space-y-6">
                      {/* Current Plan Card */}
                      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 border border-primary/20">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">{t('settings.billing.currentPlan')}</p>
                            <h3 className="text-2xl font-bold text-foreground">
                              {subscription.plan_details?.display_name || 'Free'}
                            </h3>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-primary">
                              ${subscription.plan_details?.price || 0}
                            </p>
                            <p className="text-sm text-muted-foreground">/month</p>
                          </div>
                        </div>

                        {/* Plan Features Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-primary/20">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Documents</p>
                              <p className="text-sm font-semibold">
                                {subscription.plan_details?.max_documents === null
                                  ? 'Unlimited'
                                  : subscription.plan_details?.max_documents || 0}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Messages/Day</p>
                              <p className="text-sm font-semibold">
                                {subscription.plan_details?.max_messages_per_day === null
                                  ? 'Unlimited'
                                  : subscription.plan_details?.max_messages_per_day || 0}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Egyptian Laws</p>
                              <p className="text-sm font-semibold">
                                {subscription.plan_details?.max_egyptian_laws === null
                                  ? 'All'
                                  : subscription.plan_details?.max_egyptian_laws === 0
                                    ? 'None'
                                    : subscription.plan_details?.max_egyptian_laws}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Status & Renewal */}
                        {subscription.end_date && (
                          <div className="mt-6 pt-6 border-t border-primary/20">
                            <p className="text-sm text-muted-foreground">
                              {t('settings.billing.renewsOn')}: <span className="font-medium text-foreground">
                                {new Date(subscription.end_date).toLocaleDateString()}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={() => navigate('/pricing')}
                          className="flex-1"
                        >
                          {subscription.plan_details?.name === 'premium' ? 'View All Plans' : 'Upgrade Plan'}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>

                      {/* Upgrade Suggestion */}
                      {subscription.plan_details?.name !== 'premium' && (
                        <div className="bg-muted/50 rounded-lg p-4 border border-border">
                          <h4 className="font-semibold text-foreground mb-2">
                            {t('settings.billing.upgradeTitle')}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            {t('settings.billing.upgradeDescription')}
                          </p>
                          <Button variant="outline" size="sm" onClick={() => navigate('/pricing')}>
                            {t('settings.billing.viewPlans')}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Default Free Plan Card */}
                      <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg p-6 border border-border">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Current Plan</p>
                            <h3 className="text-2xl font-bold text-foreground">Free</h3>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-foreground">$0</p>
                            <p className="text-sm text-muted-foreground">/month</p>
                          </div>
                        </div>

                        {/* Plan Features Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Documents</p>
                              <p className="text-sm font-semibold text-foreground">3</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Messages/Day</p>
                              <p className="text-sm font-semibold text-foreground">20</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Egyptian Laws</p>
                              <p className="text-sm font-semibold text-foreground">None</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={() => navigate('/pricing')}
                          className="flex-1"
                        >
                          Upgrade Plan
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>

                      {/* Upgrade Suggestion */}
                      <div className="bg-muted/50 rounded-lg p-4 border border-border">
                        <h4 className="font-semibold text-foreground mb-2">
                          Unlock Premium Features
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Upgrade to Standard or Premium to get more documents, messages, and access to Egyptian laws.
                        </p>
                        <Button variant="outline" size="sm" onClick={() => navigate('/pricing')}>
                          View Plans
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Generic Placeholder for other sections */}
            {activeSection !== "profile" && activeSection !== "security" && activeSection !== "appearance" && activeSection !== "billing" && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {t(`settings.${activeSection}.title`)}
                  </CardTitle>
                  <CardDescription>
                    {t(`settings.${activeSection}.subtitle`)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                      {(() => {
                        const Section = settingsSections.find((s) => s.id === activeSection);
                        if (Section) {
                          return <Section.icon className="h-8 w-8" />;
                        }
                        return null;
                      })()}
                    </div>
                    <p>{t('settings.settingsWillAppear', { section: activeSection })}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
