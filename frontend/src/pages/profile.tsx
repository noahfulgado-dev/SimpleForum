import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Navbar } from '@/components/ui/navbar';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usersAPI } from '@/services/api';
import defaultAvatar from './../assets/image/default_avatar.jpg';
import { ProfileSkeleton } from '@/components/ui/skeleton';
import SidebarLeft from '@/components/ui/sidebar_left';
import { ProfileAvatar } from '@/components/ui/profile_avatar';
import { ProfileInfo } from '@/components/ui/profile_info';
import { ProfileStats } from '@/components/ui/profile_stats';
import { Music2 } from 'lucide-react';
import { PullIndicator } from '@/components/ui/pull_indicator';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

export function Profile() {
  document.title = "Profile | HuniSpace";

  const queryClient = useQueryClient();
  const { containerRef, pull, refreshing } = usePullToRefresh(() =>
    queryClient.invalidateQueries({ queryKey: ['profile'] })
  );
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => usersAPI.getProfile().then(r => r.data),
  });

  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState('');
  const [bioDraft, setBioDraft] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'replies'>('posts');

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(['profile'], (old: any) => old ? { ...old, avatar: data.avatar } : old);
      setAvatarPreview(null);
    },
  });

  const bannerMutation = useMutation({
    mutationFn: (file: File) => usersAPI.uploadBanner(file).then(r => r.data),
    onSuccess: (data) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(['profile'], (old: any) => old ? { ...old, banner: data.banner } : old);
      setBannerPreview(null);
    },
  });

  const uploading = avatarMutation.isPending;
  const bannerUploading = bannerMutation.isPending;

  const handleAvatarClick = () => {
    avatarFileRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB.');
      return;
    }
    setAvatarPreview(URL.createObjectURL(file));
    avatarMutation.mutate(file);
  };

  const handleBannerClick = () => {
    bannerFileRef.current?.click();
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB.');
      return;
    }
    setBannerPreview(URL.createObjectURL(file));
    bannerMutation.mutate(file);
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
      <div className="h-screen flex flex-col bg-background bg-grid">
        <div className="p-0 xl:p-5 xl:pb-0 shrink-0 relative z-50">
          <Navbar />
        </div>
        <SidebarLeft />
        <div ref={containerRef} className="relative flex-1 overflow-y-auto px-3 md:px-5 pb-24 xl:pb-5">
          <PullIndicator pull={pull} refreshing={refreshing} />
          <div className="flex gap-5 justify-center min-h-full">
            <div className="hidden xl:block w-[300px] shrink-0" />
            <div className="flex-1 max-w-[900px] min-w-0 mt-0 md:mt-8">
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
      <div className="h-screen flex flex-col bg-background bg-grid">
        <div className="p-0 xl:p-5 xl:pb-0 shrink-0 relative z-50">
          <Navbar />
        </div>
        <SidebarLeft />
        <div ref={containerRef} className="relative flex-1 overflow-y-auto px-3 md:px-5 pb-24 xl:pb-5">
          <PullIndicator pull={pull} refreshing={refreshing} />
          <div className="flex gap-5 justify-center min-h-full">
            <div className="hidden xl:block w-[300px] shrink-0" />
            <div className="flex-1 max-w-[900px] min-w-0 mt-0 md:mt-8 flex justify-center items-center">
              <p className="text-muted-foreground">Could not load profile.</p>
            </div>
            <div className="hidden xl:block w-[300px] shrink-0" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background bg-grid">
      <div className="p-0 xl:p-5 xl:pb-0 shrink-0 relative z-50">
        <Navbar />
      </div>
      <SidebarLeft />
      <div ref={containerRef} className="relative flex-1 overflow-y-auto px-3 md:px-5 pb-24 xl:pb-5">
        <PullIndicator pull={pull} refreshing={refreshing} />
        <div className="flex gap-5 justify-center min-h-full">
          <div className="hidden xl:block w-[300px] shrink-0" />
          <div className="flex-1 max-w-[900px] min-w-0 mt-0 md:mt-8 space-y-6">
            <Card className="bg-card overflow-hidden pt-0 rounded-2xl border border-border shadow-sm">
              <div className="relative h-40 bg-muted overflow-hidden">
                {(bannerPreview || profile.banner) ? (
                  <img
                    src={bannerPreview || profile.banner}
                    alt="Banner"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[linear-gradient(135deg,#9ec1a3_0%,#c9e0cd_55%,#f0d9b5_100%)]" />
                )}
                <input
                  ref={bannerFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBannerChange}
                  disabled={bannerUploading}
                />
                <button
                  onClick={handleBannerClick}
                  disabled={bannerUploading}
                  className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-colors cursor-pointer group"
                >
                  {bannerUploading ? (
                    <svg className="w-8 h-8 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  )}
                </button>
              </div>
              <CardHeader>
                <div className="flex items-center gap-4 sm:gap-6 -mt-9 relative z-10">
                  <ProfileAvatar
                    src={avatarPreview || profile.avatar || defaultAvatar}
                    uploading={uploading}
                    fileInputRef={avatarFileRef}
                    onClick={handleAvatarClick}
                    onChange={handleAvatarChange}
                  />
                  <div className="flex flex-col items-start gap-1.5">
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
                    <span className="text-xs text-muted-foreground">@{profile.username}</span>
                    <p className="flex items-center gap-1.5 font-cousine text-[0.6rem] uppercase tracking-[0.2em] text-primary">
                      <Music2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                      now listening — slow mornings
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">


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

                <div className="border-t border-border pt-3 mt-3 space-y-3">
                  <ProfileStats profile={profile} />
                  <div className="flex flex-wrap gap-1.5">
                    {['lo-fi', 'jazz', 'cozy pop'].map((genre) => (
                      <span
                        key={genre}
                        className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-cousine text-[0.55rem] uppercase tracking-[0.18em] text-primary"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="flex border-b border-border">
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium text-center transition-colors cursor-pointer ${activeTab === 'posts' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Posts {profile.topic_count != null && `(${profile.topic_count})`}
                </button>
                <button
                  onClick={() => setActiveTab('replies')}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium text-center transition-colors cursor-pointer ${activeTab === 'replies' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
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
                            className="p-3 border border-border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                          >
                            <div className="font-medium text-foreground text-sm">{topic.title}</div>
                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{topic.description}</div>
                            {topic.image && (
                              <img src={topic.image} alt="" className="w-full h-24 object-cover rounded-lg mt-1" />
                            )}
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
                            className="p-3 border border-border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                          >
                            <div className="text-xs text-muted-foreground truncate">on {reply.topic_title || 'a topic'}</div>
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
