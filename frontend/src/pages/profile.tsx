import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Navbar } from '@/components/ui/navbar';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
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
  const [firstNameDraft, setFirstNameDraft] = useState('');
  const [lastNameDraft, setLastNameDraft] = useState('');
  const [editingFirstName, setEditingFirstName] = useState(false);
  const [editingLastName, setEditingLastName] = useState(false);
  const [bioDraft, setBioDraft] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'replies'>('posts');

  useEffect(() => {
    if (profile) {
      setUsernameDraft(profile.username);
      setFirstNameDraft(profile.first_name ?? '');
      setLastNameDraft(profile.last_name ?? '');
      setBioDraft(profile.bio ?? '');
    }
  }, [profile]);

  const profileMutation = useMutation({
    mutationFn: (data: { username?: string; first_name?: string; last_name?: string; bio?: string }) => usersAPI.updateProfile(data).then(r => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data);
      setUsernameDraft(data.username);
      setFirstNameDraft(data.first_name ?? '');
      setLastNameDraft(data.last_name ?? '');
      setBioDraft(data.bio ?? '');
    },
    onError: () => {
      setUsernameDraft(profile?.username ?? '');
      setFirstNameDraft(profile?.first_name ?? '');
      setLastNameDraft(profile?.last_name ?? '');
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

  const handleSaveFirstName = () => {
    profileMutation.mutate({ first_name: firstNameDraft.trim() });
    setEditingFirstName(false);
  };

  const handleCancelFirstName = () => {
    setFirstNameDraft(profile?.first_name ?? '');
    setEditingFirstName(false);
  };

  const handleSaveLastName = () => {
    profileMutation.mutate({ last_name: lastNameDraft.trim() });
    setEditingLastName(false);
  };

  const handleCancelLastName = () => {
    setLastNameDraft(profile?.last_name ?? '');
    setEditingLastName(false);
  };

  const handleSaveBio = () => {
    profileMutation.mutate({ bio: bioDraft });
    setEditingBio(false);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-background bg-[linear-gradient(to_right,var(--muted)_1px,transparent_1px),linear-gradient(to_bottom,var(--muted)_1px,transparent_1px)] bg-size-[40px_40px]">
        <div className="p-5 pb-0 shrink-0 relative z-50">
          <Navbar />
        </div>
        <SidebarLeft />
        <div className="flex-1 overflow-y-auto px-3 md:px-5 pb-5">
          <div className="flex gap-5 justify-center min-h-full">
            <div className="hidden xl:block w-[300px] shrink-0" />
            <div className="flex-1 max-w-[900px] min-w-0 mt-8">
              <ProfileSkeleton />
            </div>
            <div className="hidden xl:block w-[300px] shrink-0" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-screen flex flex-col bg-background bg-[linear-gradient(to_right,var(--muted)_1px,transparent_1px),linear-gradient(to_bottom,var(--muted)_1px,transparent_1px)] bg-size-[40px_40px]">
        <div className="p-5 pb-0 shrink-0 relative z-50">
          <Navbar />
        </div>
        <SidebarLeft />
        <div className="flex-1 overflow-y-auto px-3 md:px-5 pb-5">
          <div className="flex gap-5 justify-center min-h-full">
            <div className="hidden xl:block w-[300px] shrink-0" />
            <div className="flex-1 max-w-[900px] min-w-0 mt-8 flex justify-center items-center">
              <p className="text-muted-foreground">Could not load profile.</p>
            </div>
            <div className="hidden xl:block w-[300px] shrink-0" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background bg-[linear-gradient(to_right,var(--muted)_1px,transparent_1px),linear-gradient(to_bottom,var(--muted)_1px,transparent_1px)] bg-size-[40px_40px]">
      <div className="p-5 pb-0 shrink-0 relative z-50">
        <Navbar />
      </div>
      <SidebarLeft />
      <div className="flex-1 overflow-y-auto px-3 md:px-5 pb-5">
        <div className="flex gap-5 justify-center min-h-full">
          <div className="hidden xl:block w-[300px] shrink-0" />
          <div className="flex-1 max-w-[900px] min-w-0 mt-8 space-y-6">
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
                <div className="text-sm font-medium text-muted-foreground mb-1">First Name</div>
                {editingFirstName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={firstNameDraft}
                      onChange={(e) => setFirstNameDraft(e.target.value)}
                      placeholder="First name"
                      className="flex-1 max-w-xs"
                      disabled={saving}
                    />
                    <Button size="sm" onClick={handleSaveFirstName} disabled={saving}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={handleCancelFirstName} disabled={saving}>Cancel</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <p className="text-sm text-foreground">
                      {profile.first_name || <span className="italic text-muted-foreground">Not set</span>}
                    </p>
                    <button
                      onClick={() => setEditingFirstName(true)}
                      className="text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                      title="Edit first name"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Last Name</div>
                {editingLastName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={lastNameDraft}
                      onChange={(e) => setLastNameDraft(e.target.value)}
                      placeholder="Last name"
                      className="flex-1 max-w-xs"
                      disabled={saving}
                    />
                    <Button size="sm" onClick={handleSaveLastName} disabled={saving}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={handleCancelLastName} disabled={saving}>Cancel</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <p className="text-sm text-foreground">
                      {profile.last_name || <span className="italic text-muted-foreground">Not set</span>}
                    </p>
                    <button
                      onClick={() => setEditingLastName(true)}
                      className="text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                      title="Edit last name"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    </button>
                  </div>
                )}
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

              <div className="border-t border-border pt-3 mt-3">
                <ProfileStats profile={profile} />
              </div>
            </CardContent>
          </Card>

          <div className="bg-card border border-border rounded-[10px] overflow-hidden">
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex-1 px-4 py-2.5 text-sm font-medium text-center transition-colors cursor-pointer ${activeTab === 'posts' ? 'text-foreground border-b-2 border-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Posts {profile.topic_count != null && `(${profile.topic_count})`}
              </button>
              <button
                onClick={() => setActiveTab('replies')}
                className={`flex-1 px-4 py-2.5 text-sm font-medium text-center transition-colors cursor-pointer ${activeTab === 'replies' ? 'text-foreground border-b-2 border-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Replies {profile.reply_count != null && `(${profile.reply_count})`}
              </button>
            </div>
            <div className="p-4">
              {activeTab === 'posts' && (
                <>
                  {profile.topics && profile.topics.length > 0 ? (
                    <div className="space-y-3">
                      {profile.topics.map(topic => (
                        <div
                          key={topic.id}
                          onClick={() => window.location.href = `/topic/${topic.id}`}
                          className="p-3 border border-border rounded-[8px] hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <div className="font-medium text-foreground text-sm">{topic.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{topic.description}</div>
                          <div className="flex items-center gap-2 mt-1.5 text-[0.65rem] text-muted-foreground">
                            <span>{topic.like_count ?? 0} likes</span>
                            <span>•</span>
                            <span>{topic.reply_count ?? 0} replies</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">No posts yet.</p>
                  )}
                </>
              )}
              {activeTab === 'replies' && (
                <>
                  {profile.replies && profile.replies.length > 0 ? (
                    <div className="space-y-3">
                      {profile.replies.map(reply => (
                        <div
                          key={reply.id}
                          onClick={() => window.location.href = `/topic/${reply.topic}`}
                          className="p-3 border border-border rounded-[8px] hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <div className="text-xs text-muted-foreground">on a topic</div>
                          <div className="text-sm text-foreground mt-0.5 line-clamp-2">{reply.content}</div>
                          <div className="text-[0.65rem] text-muted-foreground mt-1">{reply.like_count ?? 0} likes</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">No replies yet.</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
          <div className="hidden xl:block w-[300px] shrink-0" />
        </div>
      </div>
    </div>
  );
}

export default Profile
