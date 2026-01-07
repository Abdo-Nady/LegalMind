import { motion } from "framer-motion";
import { User, Bell, Shield, CreditCard, Palette, HelpCircle, Eye, EyeOff, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useUploadAvatar, useDeleteAvatar, useUpdateUsername, useChangePassword } from "@/hooks/useAuth";

const settingsSections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "help", label: "Help & Support", icon: HelpCircle },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState("profile");
  const { user, isGuest, loading, refreshUser } = useAuth();
  const [isGoogleUser, setIsGoogleUser] = useState(false);

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

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Please upload a valid image file (JPG, PNG, GIF, or WEBP)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      await uploadAvatarMutation.mutateAsync(file);
      toast({
        title: "Success",
        description: "Avatar updated successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || error.message || "Failed to upload avatar",
        variant: "destructive",
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm("Are you sure you want to delete your avatar?")) {
      return;
    }

    try {
      await deleteAvatarMutation.mutateAsync();
      toast({
        title: "Success",
        description: "Avatar deleted successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || error.message || "Failed to delete avatar",
        variant: "destructive",
      });
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      toast({
        title: "Error",
        description: "Username cannot be empty",
        variant: "destructive",
      });
      return;
    }

    const hasUsernameChanged = username !== user?.username;
    const hasPasswordChange = oldPassword && newPassword1 && newPassword2;

    if (!hasUsernameChanged && !hasPasswordChange) {
      toast({
        title: "Info",
        description: "No changes to save",
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
            title: "Error",
            description: "New passwords don't match",
            variant: "destructive",
          });
          return;
        }

        if (newPassword1.length < 8) {
          toast({
            title: "Error",
            description: "Password must be at least 8 characters long",
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
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      // Parse Django validation errors
      const errorData = error.response?.data;
      let errorMessage = "Failed to update profile";

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
        title: "Error",
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
            <p className="text-muted-foreground">Loading...</p>
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
    // Load theme preference from localStorage or default
    const saved = localStorage.getItem("mode_type");
    // If saved theme is custom, default to light instead
    if (saved === "custom" || saved === "custom-editing") {
      return "light";
    }
    return saved || "light";
  });

  // handlers: Theme Selection
  const handleThemeChange = (mode) => {
    // Update local state
    setThemeMode(mode);

    // Persist to localStorage
    localStorage.setItem("mode_type", mode);

    // Dispatch custom event to notify DashboardLayout
    window.dispatchEvent(new Event("themeChange"));
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
          <h1 className="font-serif text-3xl text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and configurations
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
                      {section.label}
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
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your personal details and profile picture
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
                          {uploadAvatarMutation.isPending ? "Uploading..." : "Change Avatar"}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG, GIF or WEBP. Max 5MB.
                        </p>
                      </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSaveProfile}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            Username
                          </label>
                          <Input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            User ID
                          </label>
                          <Input value={user.id || ""} disabled />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            Email Address
                          </label>
                          <Input type="email" value={user.email || ""} disabled />
                        </div>
                      </div>

                      {/* Change Password Section - Only show if not Google user */}
                      {!isGoogleUser && (
                        <div className="mt-6 pt-6 border-t border-border">
                          <h3 className="text-lg font-medium text-foreground mb-4">Change Password</h3>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-foreground mb-2 block">
                                Current Password
                              </label>
                              <div className="relative">
                                <Input
                                  type={showOldPassword ? "text" : "password"}
                                  value={oldPassword}
                                  onChange={(e) => setOldPassword(e.target.value)}
                                  placeholder="Enter current password"
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
                                New Password
                              </label>
                              <div className="relative">
                                <Input
                                  type={showNewPassword1 ? "text" : "password"}
                                  value={newPassword1}
                                  onChange={(e) => setNewPassword1(e.target.value)}
                                  placeholder="Enter new password"
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
                                Confirm New Password
                              </label>
                              <div className="relative">
                                <Input
                                  type={showNewPassword2 ? "text" : "password"}
                                  value={newPassword2}
                                  onChange={(e) => setNewPassword2(e.target.value)}
                                  placeholder="Confirm new password"
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
                          {(updateUsernameMutation.isPending || changePasswordMutation.isPending) ? "Saving..." : "Save Changes"}
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
                          <CardTitle>Account Information</CardTitle>
                          <CardDescription>
                            Your account details
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                          <span className="text-sm text-muted-foreground">Account Created</span>
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
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your account security settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Security settings are available in Profile section.</p>
                </CardContent>
              </Card>
            )}

            {/* Appearance Settings Section */}
            {activeSection === "appearance" && (
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>
                    Customize the look and feel of the application
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
                      <span className="mr-2">☀️</span> Light Mode
                    </Button>
                    <Button
                      variant={themeMode === "dark" ? "default" : "outline"}
                      onClick={() => handleThemeChange("dark")}
                      className="w-full justify-start"
                    >
                      <span className="mr-2">🌙</span> Dark Mode
                    </Button>
                  </div>

                  {/* Export Section */}
                  <div className="pt-4 border-t border-border">
                    <Button variant="secondary" onClick={handleExport} className="w-full sm:w-auto">
                      Export Settings JSON
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generic Placeholder for other sections */}
            {activeSection !== "profile" && activeSection !== "security" && activeSection !== "appearance" && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {settingsSections.find((s) => s.id === activeSection)?.label}
                  </CardTitle>
                  <CardDescription>
                    Configure your {activeSection} settings
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
                    <p>Settings for {activeSection} will appear here</p>
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
