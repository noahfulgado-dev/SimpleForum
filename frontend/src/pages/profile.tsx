import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Navbar } from '@/components/ui/navbar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { usersAPI } from '@/services/api';
import defaultAvatar from './../assets/image/default_avatar.jpg';
import { ProfileSkeleton } from '@/components/ui/skeleton';
import SidebarLeft from '@/components/ui/sidebar_left';
import { ProfileAvatar } from '@/components/ui/profile_avatar';
import { ProfileInfo } from '@/components/ui/profile_info';
import { ProfileStats } from '@/components/ui/profile_stats';

export function Profile() {
  document.title = "Profile | SimpleForum";

  const { user: authUser, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => usersAPI.getProfile().then(r => r.data),
  });

  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState('');
  const [bioDraft, setBioDraft] = useState('');
  const [editingBio, setEditingBio] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsernameDraft(profile.username);
      setBioDraft(profile.bio ?? '');
    }
  }, [profile]);

  const profileMutation = useMutation({
    mutationFn: (data: { username?: string; bio?: string }) => usersAPI.updateProfile(data).then(r => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data);
      setUsernameDraft(data.username);
      setBioDraft(data.bio ?? '');
    },
    onError: () => {
      setUsernameDraft(profile?.username ?? '');
      setBioDraft(profile?.bio ?? '');
    },
  });

  const saving = profileMutation.isPending;

  const avatarMutation = useMutation({
    mutationFn: (file: File) => usersAPI.uploadAvatar(file).then(r => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], (old: any) => old ? { ...old, avatar: data.avatar } : old);
      setAvatarPreview(null);
      refreshUser?.();
    },
  });

  const uploading = avatarMutation.isPending;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB.');
      return;
    }
    setAvatarPreview(URL.createObjectURL(file));
    avatarMutation.mutate(file);
  };

  const handleSaveUsername = () => {
    if (!usernameDraft.trim() || usernameDraft === profile?.username) {
      setEditingUsername(false);
      return;
    }
    profileMutation.mutate({ username: usernameDraft.trim() });
    setEditingUsername(false);
  };

  const handleCancelUsername = () => {
    setUsernameDraft(profile?.username ?? '');
    setEditingUsername(false);
  };

  const handleSaveBio = () => {
    profileMutation.mutate({ bio: bioDraft });
    setEditingBio(false);
  };

  if (isLoading) {
    return (
      <div className="absolute inset-0 -z-10 h-fit w-full bg-background bg-[linear-gradient(to_right,var(--muted)_1px,transparent_1px),linear-gradient(to_bottom,var(--muted)_1px,transparent_1px)] bg-size-[40px_40px]">
        <div className="p-5 main-container w-full min-h-screen">
          <Navbar />
          <SidebarLeft />
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="absolute inset-0 -z-10 h-fit w-full bg-background bg-[linear-gradient(to_right,var(--muted)_1px,transparent_1px),linear-gradient(to_bottom,var(--muted)_1px,transparent_1px)] bg-size-[40px_40px]">
        <div className="p-5 main-container w-full min-h-screen">
          <Navbar />
          <SidebarLeft />
          <div className="flex justify-center items-center mt-20">
            <p className="text-muted-foreground">Could not load profile.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 -z-10 h-fit w-full bg-background bg-[linear-gradient(to_right,var(--muted)_1px,transparent_1px),linear-gradient(to_bottom,var(--muted)_1px,transparent_1px)] bg-size-[40px_40px]">
      <div className="p-5 main-container w-full min-h-screen">
        <Navbar />
        <SidebarLeft />
        <div className="[grid-area:main] mt-8 space-y-6 w-full max-w-[900px]">
          <Card className="bg-card">
            <CardHeader>
              <div className="flex items-center gap-6">
                <ProfileAvatar
                  src={avatarPreview || profile.avatar || defaultAvatar}
                  uploading={uploading}
                  fileInputRef={fileInputRef}
                  onClick={handleAvatarClick}
                  onChange={handleFileChange}
                />
                <ProfileInfo
                  username={profile.username}
                  editingUsername={editingUsername}
                  usernameDraft={usernameDraft}
                  saving={saving}
                  onUsernameDraftChange={setUsernameDraft}
                  onStartEditUsername={() => setEditingUsername(true)}
                  onSaveUsername={handleSaveUsername}
                  onCancelUsername={handleCancelUsername}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <span>{profile.email || authUser?.email || 'No email'}</span>
              </div>
              <div>
                {editingBio ? (
                  <div className="flex items-start gap-2">
                    <Input
                      value={bioDraft}
                      onChange={(e) => setBioDraft(e.target.value)}
                      placeholder="Write something about yourself..."
                      className="flex-1"
                      disabled={saving}
                    />
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" onClick={handleSaveBio} disabled={saving}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditingBio(false); setBioDraft(profile.bio ?? ''); }} disabled={saving}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 group">
                    <p className="text-sm text-foreground flex-1">
                      {profile.bio || <span className="italic text-muted-foreground">No bio yet</span>}
                    </p>
                    <button
                      onClick={() => setEditingBio(true)}
                      className="text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 shrink-0 mt-0.5"
                      title="Edit bio"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileStats profile={profile} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Profile
