import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Save, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import avatar1 from "@/assets/avatar1.jpg";

const genderOptions = ["Male", "Female", "Other"];

const ProfileEditPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
      setGender(profile.gender || "");
      setPhone(profile.phone || "");
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast("Image must be under 2MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({ user_id: user.id, avatar_url: newUrl }, { onConflict: "user_id" });
      if (updateError) throw updateError;

      setAvatarUrl(newUrl);
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast("Profile photo updated!");
    } catch (err: any) {
      toast(err.message || "Failed to upload photo");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      const trimmedName = displayName.trim();
      const trimmedBio = bio.trim();
      if (!trimmedName) throw new Error("Name is required");
      if (trimmedName.length > 50) throw new Error("Name must be under 50 characters");
      if (trimmedBio.length > 300) throw new Error("Bio must be under 300 characters");

      const trimmedPhone = phone.trim();
      if (trimmedPhone && !/^\d{10}$/.test(trimmedPhone)) throw new Error("Enter valid 10-digit phone number");

      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user!.id,
          display_name: trimmedName,
          bio: trimmedBio || null,
          gender: gender || null,
          phone: trimmedPhone || null,
        }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast("Profile updated successfully!");
      navigate("/profile");
    },
    onError: (err: Error) => {
      toast(err.message || "Failed to update profile");
    },
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="gradient-primary pt-12 pb-6 px-4 rounded-b-3xl">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/profile")} className="text-primary-foreground">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-extrabold text-primary-foreground">Edit Profile</h1>
        </div>
      </div>

      {/* Form */}
      <div className="px-4 mt-6 space-y-5">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <img
                  src={avatarUrl || avatar1}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-border"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md"
                >
                  {uploadingAvatar ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera size={14} className="text-primary-foreground" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <p className="text-xs text-muted-foreground">Tap to change photo</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-foreground font-semibold">
                Display Name
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground font-semibold">
                Phone Number
              </Label>
              <div className="flex gap-2">
                <span className="flex items-center px-3 rounded-md border border-input bg-muted text-sm text-muted-foreground">+91</span>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="Enter 10-digit number"
                  maxLength={10}
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-foreground font-semibold">
                Bio
              </Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell something about yourself..."
                maxLength={300}
                rows={4}
              />
              <p className="text-xs text-muted-foreground text-right">{bio.length}/300</p>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-semibold">Gender</Label>
              <div className="flex gap-2">
                {genderOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setGender(gender === opt ? "" : opt)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors border ${
                      gender === opt
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending || !displayName.trim()}
              className="w-full mt-4 rounded-xl h-12 font-bold"
            >
              {updateMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileEditPage;
