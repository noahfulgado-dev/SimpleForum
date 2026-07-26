import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Navbar } from '@/components/ui/navbar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { usersAPI } from '@/services/api';
import defaultAvatar from './../assets/image/default_avatar.jpg';

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
          <div className="flex justify-center items-center mt-20">
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="absolute inset-0 -z-10 h-fit w-full bg-background bg-[linear-gradient(to_right,var(--muted)_1px,transparent_1px),linear-gradient(to_bottom,var(--muted)_1px,transparent_1px)] bg-size-[40px_40px]">
        <div className="p-5 main-container w-full min-h-screen">
          <Navbar />
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

        <div className="w-fit mx-auto mt-8 space-y-6">
          <Card className="bg-card">
            <CardHeader>
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 shrink-0 group">
                  <img
                    src={avatarPreview || profile.avatar || defaultAvatar}
                    alt="Avatar"
                    className="w-24 h-24 border border-border rounded-full object-cover"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                  <button
                    onClick={handleAvatarClick}
                    disabled={uploading}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    {uploading ? (
                      <svg className="w-6 h-6 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    )}
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  {editingUsername ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={usernameDraft}
                        onChange={(e) => setUsernameDraft(e.target.value)}
                        className="max-w-xs"
                        disabled={saving}
                      />
                      <Button size="sm" onClick={handleSaveUsername} disabled={saving}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelUsername} disabled={saving}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-2xl">{profile.username}</CardTitle>
                      <button
                        onClick={() => setEditingUsername(true)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit username"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                          <path d="m15 5 4 4"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
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
                      <Button size="sm" onClick={handleSaveBio} disabled={saving}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditingBio(false); setBioDraft(profile.bio ?? ''); }} disabled={saving}>
                        Cancel
                      </Button>
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
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                        <path d="m15 5 4 4"/>
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
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center p-3 rounded-lg bg-muted border border-border">
                  <span className="text-2xl font-bold text-foreground">{profile.follower_count ?? 0}</span>
                  <span className="text-sm text-muted-foreground">Followers</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-muted border border-border">
                  <span className="text-2xl font-bold text-foreground">{profile.following_count ?? 0}</span>
                  <span className="text-sm text-muted-foreground">Following</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-muted border border-border">
                  <span className="text-2xl font-bold text-foreground">{profile.topic_count ?? 0}</span>
                  <span className="text-sm text-muted-foreground">Topics</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Profile
