import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Navbar } from '@/components/ui/navbar';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usersAPI } from '@/services/api';
import defaultAvatar from './../assets/image/default_avatar.jpg';
import { ProfileSkeleton } from '@/components/ui/skeleton';
import SidebarLeft from '@/components/ui/sidebar_left';
import { ProfileStats } from '@/components/ui/profile_stats';
import { useAuth } from '@/context/AuthContext';

export function UserProfile() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: authUser } = useAuth();
    const queryClient = useQueryClient();
    const userId = Number(id);
    const [activeTab, setActiveTab] = useState<'posts' | 'replies'>('posts');

    const { data: profile, isLoading } = useQuery({
        queryKey: ['user', userId],
        queryFn: () => usersAPI.getUser(userId).then(r => r.data),
        enabled: !!userId,
    });

    const isOwnProfile = authUser?.id === userId;

    const followMutation = useMutation({
        mutationFn: () => usersAPI.toggleFollow(userId),
        onSuccess: (res) => {
            const data = res.data;
            queryClient.setQueryData(['user', userId], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    is_following: data.status === 'followed',
                    follower_count: data.follower_count,
                };
            });
        },
    });

    const handleFollowToggle = () => {
        followMutation.mutate();
    };

    document.title = profile
        ? `${profile.username} | SimpleForum`
        : "Profile | SimpleForum";

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
                        {isLoading && <ProfileSkeleton />}

                        {!isLoading && !profile && (
                            <div className="flex justify-center items-center py-20">
                                <div className="text-center">
                                    <p className="text-muted-foreground text-lg">User not found.</p>
                                    <button onClick={() => navigate('/feed')} className="text-sm text-muted-foreground hover:text-foreground mt-2 cursor-pointer">Back to feed</button>
                                </div>
                            </div>
                        )}

                        {profile && (
                            <>
                                {isOwnProfile && (
                                    <div className="bg-card border border-border rounded-[10px] p-3 text-sm text-muted-foreground text-center">
                                        This is your profile.{' '}
                                        <button onClick={() => navigate('/profile')} className="text-foreground hover:underline cursor-pointer">
                                            Edit your profile
                                        </button>
                                    </div>
                                )}
                                <Card className="bg-card">
                                    <CardHeader>
                                        <div className="flex items-center gap-6">
                                            <div className="relative group w-24 h-24 flex items-center justify-center shrink-0">
                                                <img src={profile.avatar || defaultAvatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-border" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <h2 className="text-xl font-semibold text-foreground">{profile.username}</h2>
                                                    {!isOwnProfile && (
                                                        <Button
                                                            onClick={handleFollowToggle}
                                                            disabled={followMutation.isPending}
                                                            className={`rounded-[5px] text-xs px-3 py-1 h-auto cursor-pointer disabled:opacity-50 ${profile.is_following ? 'bg-muted text-foreground hover:bg-muted/80' : ''}`}
                                                            variant={profile.is_following ? 'outline' : 'default'}
                                                        >
                                                            {followMutation.isPending ? '...' : profile.is_following ? 'Following' : 'Follow'}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect width="20" height="16" x="2" y="4" rx="2" />
                                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                            </svg>
                                            <span>{profile.email || 'No email'}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-foreground">
                                                {profile.bio || <span className="italic text-muted-foreground">No bio yet</span>}
                                            </p>
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
                            </>
                        )}
                    </div>
                    <div className="hidden xl:block w-[300px] shrink-0" />
                </div>
            </div>
        </div>
    );
}

export default UserProfile;