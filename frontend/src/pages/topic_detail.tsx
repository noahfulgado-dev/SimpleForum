import { useRef, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { forumAPI, type Topic } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/navbar';
import SidebarLeft from '@/components/ui/sidebar_left';
import SidebarRight from '@/components/ui/sidebar_right';
import defaultAvatar from './../assets/image/default_avatar.jpg';
import { Like, Liked } from '@/components/ui/like';
import { Bookmark, Bookmarked } from '@/components/ui/bookmark';
import { Share } from '@/components/ui/share';
import Reply from '@/components/ui/reply';
import PostMenu from '@/components/ui/post_menu';
import ShareModal from '@/components/ui/share_modal';
import { SharedQuoteCard, parseSharedDescription } from '@/components/ui/shared_quote_card';
import { TopicDetailSkeleton } from '@/components/ui/skeleton';

export function TopicDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const topicId = Number(id);
    const [replyContent, setReplyContent] = useState('');
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const { data: topic, isLoading, error } = useQuery({
        queryKey: ['topic', topicId],
        queryFn: () => forumAPI.getTopic(topicId).then(r => r.data),
        enabled: !!topicId,
    });

    const replies = topic?.replies ?? [];

    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [shareCount, setShareCount] = useState(0);

    useEffect(() => {
        if (topic) {
            setIsLiked(topic.user_has_liked);
            setLikeCount(topic.like_count);
            setIsBookmarked(topic.user_has_bookmarked);
            setShareCount(topic.shared_count ?? 0);
        }
    }, [topic]);

    const [replyLikes, setReplyLikes] = useState<Record<number, { isLiked: boolean; likeCount: number }>>({});
    const [replyBookmarks, setReplyBookmarks] = useState<Record<number, boolean>>({});
    const [replyShares, setReplyShares] = useState<Record<number, { isShared: boolean; shareCount: number }>>({});

    const likeMutation = useMutation({
        mutationFn: () => forumAPI.likeTopic(topicId),
        onError: () => {
            if (topic) {
                setIsLiked(topic.user_has_liked);
                setLikeCount(topic.like_count);
            }
        },
    });

    const bookmarkMutation = useMutation({
        mutationFn: () => forumAPI.bookmarkTopic(topicId),
        onError: () => {
            if (topic) setIsBookmarked(topic.user_has_bookmarked);
        },
    });

    const replyMutation = useMutation({
        mutationFn: (content: string) => forumAPI.createReply(topicId, { content }),
        onSuccess: (res) => {
            queryClient.setQueryData(['topic', topicId], (prev: Topic) => prev ? {
                ...prev,
                replies: [...(prev.replies || []), res.data],
            } : prev);
            setReplyContent('');
        },
        onError: () => alert('Failed to post reply.'),
    });

    const replyLikeMutation = useMutation({
        mutationFn: (replyId: number) => forumAPI.likeReply(replyId),
        onError: (_err, replyId) => {
            const prev = replyLikes[replyId];
            if (prev) {
                setReplyLikes(prevState => ({
                    ...prevState,
                    [replyId]: { isLiked: !prev.isLiked, likeCount: prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1 },
                }));
            }
        },
    });

    const replyBookmarkMutation = useMutation({
        mutationFn: (replyId: number) => forumAPI.bookmarkReply(replyId),
        onError: (_err, replyId) => {
            setReplyBookmarks(prev => ({ ...prev, [replyId]: !prev[replyId] }));
        },
    });

    const replyShareMutation = useMutation({
        mutationFn: (replyId: number) => forumAPI.shareReply(replyId),
        onError: (_err, replyId) => {
            const prev = replyShares[replyId];
            if (prev) {
                setReplyShares(prevState => ({
                    ...prevState,
                    [replyId]: { isShared: !prev.isShared, shareCount: prev.isShared ? prev.shareCount - 1 : prev.shareCount + 1 },
                }));
            }
        },
    });

    const handleLike = () => {
        const newIsLiked = !isLiked;
        const newCount = isLiked ? likeCount - 1 : likeCount + 1;
        setIsLiked(newIsLiked);
        setLikeCount(newCount);
        likeMutation.mutate();
    };

    const handleBookmark = () => {
        const newIsBookmarked = !isBookmarked;
        setIsBookmarked(newIsBookmarked);
        bookmarkMutation.mutate();
    };

    const handleReplyLike = (reply: { id: number; user_has_liked: boolean; like_count: number }) => {
        const current = replyLikes[reply.id] ?? { isLiked: reply.user_has_liked, likeCount: reply.like_count };
        const newIsLiked = !current.isLiked;
        const newCount = current.isLiked ? current.likeCount - 1 : current.likeCount + 1;
        setReplyLikes(prev => ({ ...prev, [reply.id]: { isLiked: newIsLiked, likeCount: newCount } }));
        replyLikeMutation.mutate(reply.id);
    };

    const handleReplyBookmark = (reply: { id: number; user_has_bookmarked: boolean }) => {
        const current = replyBookmarks[reply.id] ?? reply.user_has_bookmarked;
        setReplyBookmarks(prev => ({ ...prev, [reply.id]: !current }));
        replyBookmarkMutation.mutate(reply.id);
    };

    const handleReplyShare = (reply: { id: number; user_has_shared: boolean; shared_count: number }) => {
        const current = replyShares[reply.id] ?? { isShared: reply.user_has_shared, shareCount: reply.shared_count };
        const newIsShared = !current.isShared;
        const newCount = current.isShared ? current.shareCount - 1 : current.shareCount + 1;
        setReplyShares(prev => ({ ...prev, [reply.id]: { isShared: newIsShared, shareCount: newCount } }));
        replyShareMutation.mutate(reply.id);
    };

    const handleSubmitReply = () => {
        if (!replyContent.trim() || replyMutation.isPending) return;
        replyMutation.mutate(replyContent.trim());
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmitReply();
        }
    };

    if (error) {
        return (
            <div className="h-screen flex flex-col bg-background">
                <div className="p-5 pb-0 shrink-0 relative z-50"><Navbar /></div>
                <SidebarLeft />
                <SidebarRight />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-destructive">Failed to load post.</p>
                        <button onClick={() => navigate('/feed')} className="text-sm text-muted-foreground hover:text-foreground mt-2 cursor-pointer">Back to feed</button>
                    </div>
                </div>
            </div>
        );
    }

    const formattedDate = topic ? new Date(topic.created).toLocaleString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
    }) : '';

    return (
        <div className="h-screen flex flex-col bg-background bg-[linear-gradient(to_right,var(--muted)_1px,transparent_1px),linear-gradient(to_bottom,var(--muted)_1px,transparent_1px)] bg-size-[40px_40px]">
            <div className="p-5 pb-0 shrink-0 relative z-50">
                <Navbar />
            </div>
            <SidebarLeft />
            <SidebarRight />
            <div className="flex-1 overflow-y-auto px-5 pb-5">
                <div className="flex gap-5 justify-center min-h-full">
                    <div className="w-[300px] shrink-0" />
                    <div className="flex-1 max-w-[900px] min-w-0">
                        <div className="rounded-[10px] p-5 flex flex-col gap-5 pl-10 pr-10">

                            <button onClick={() => navigate(-1)} className="w-max text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                                ← Back
                            </button>

                            {isLoading && <TopicDetailSkeleton />}

                            {topic && (
                                <div className="border border-border rounded-[10px] p-7 flex flex-row gap-5 bg-card">
                                    <div className="w-full flex flex-col gap-2">
                                        <div className="flex flex-row gap-2">
                                            <div className="relative group w-10 h-10 flex items-center justify-center shrink-0">
                                                <img src={topic.user.avatar || defaultAvatar} alt="Avatar" className="w-10 h-10 rounded-full" />
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="text-[clamp(0.5rem,5vw,1.2rem)] font-medium leading-none text-foreground font-geist">
                                                    {topic.user.username}
                                                </div>
                                                <div className="text-[clamp(0.5rem,5vw,1rem)] font-light leading-none text-foreground font-geist">
                                                    {formattedDate}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="font-extralight tertiary-font">
                                            <div className="font-semibold text-[1.2rem]">{topic.title}</div>
                                            {(() => {
                                                const parsed = parseSharedDescription(topic.description);
                                                if (parsed) {
                                                    return (
                                                        <>
                                                            {parsed.text && <div>{parsed.text}</div>}
                                                            <SharedQuoteCard sharedFrom={parsed.sharedFrom} />
                                                        </>
                                                    );
                                                }
                                                return topic.description;
                                            })()}
                                        </div>

                                        <div className="flex flex-row gap-4 mt-2">
                                            <button onClick={handleLike} className="w-max h-7 rounded-[5px] flex items-center justify-center hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer">
                                                {isLiked ? <Liked fillColor="#ef4444" /> : <Like />}
                                                <span className={`text-sm ${isLiked ? 'text-red-500' : 'text-muted-foreground'} m-1`}>{likeCount}</span>
                                            </button>
                                            <button className="w-max h-7 rounded-[5px] flex items-center justify-center hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer">
                                                <Reply />
                                                <span className="text-sm m-1 text-muted-foreground">{replies.length}</span>
                                            </button>
                                            <button onClick={() => setIsShareModalOpen(true)} className="w-max h-7 rounded-[5px] flex items-center justify-center hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer">
                                                <Share />
                                                <span className="text-sm m-1 text-muted-foreground">{shareCount}</span>
                                            </button>
                                        </div>

                                        {isShareModalOpen && (
                                            <ShareModal topic={topic} onClose={() => setIsShareModalOpen(false)} />
                                        )}
                                    </div>

                                    <div className="flex flex-row gap-3 items-start">
                                        <button onClick={handleBookmark} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer">
                                            {isBookmarked ? <Bookmarked fillColor="#eab308" /> : <Bookmark />}
                                        </button>
                                        <div className="relative">
                                            <PostMenu />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-border" />

                            {topic && replies.length === 0 && (
                                <div className="text-center text-muted-foreground py-8">No replies yet. Be the first to share your thoughts!</div>
                            )}

                            {topic && replies.map((reply) => {
                                const replyDate = new Date(reply.created).toLocaleDateString('en-US', {
                                    year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
                                });
                                const likeState = replyLikes[reply.id];
                                const isLiked = likeState?.isLiked ?? reply.user_has_liked;
                                const likeCount = likeState?.likeCount ?? reply.like_count;
                                const isBookmarked = replyBookmarks[reply.id] ?? reply.user_has_bookmarked;
                                const shareState = replyShares[reply.id];
                                const shareCount = shareState?.shareCount ?? reply.shared_count;
                                return (
                                    <div key={reply.id} className="flex flex-row gap-3 p-4 border border-border rounded-[10px] bg-card">
                                        <div className="relative group w-8 h-8 flex items-center justify-center shrink-0 mt-0.5">
                                            <img src={reply.user.avatar || defaultAvatar} alt="Avatar" className="w-8 h-8 border border-border rounded-full" />
                                        </div>
                                        <div className="flex flex-col gap-0.5 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[0.8rem] font-medium text-foreground">{reply.user.username}</span>
                                                <span className="text-[0.7rem] text-muted-foreground">{replyDate}</span>
                                            </div>
                                            <div className="text-[0.9rem] font-extralight tertiary-text text-foreground break-words">{reply.content}</div>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <button onClick={() => handleReplyLike(reply)} className="w-max h-6 rounded-[5px] flex items-center justify-center hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer">
                                                    {isLiked ? <Liked fillColor="#ef4444" /> : <Like />}
                                                </button>
                                                <span className={`text-[0.7rem] ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}>{likeCount}</span>
                                                <button onClick={() => handleReplyBookmark(reply)} className="w-max h-6 rounded-[5px] flex items-center justify-center hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer">
                                                    {isBookmarked ? <Bookmarked fillColor="#eab308" /> : <Bookmark />}
                                                </button>
                                                <button onClick={() => handleReplyShare(reply)} className="w-max h-6 rounded-[5px] flex items-center justify-center hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer">
                                                    <Share />
                                                </button>
                                                <span className="text-[0.7rem] text-muted-foreground">{shareCount}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {topic && (
                                <div className="border-t border-border pt-4 flex flex-col gap-2">
                                    <div className="flex flex-row gap-3 items-start">
                                        <div className="relative group w-8 h-8 flex items-center justify-center shrink-0">
                                            <img src={user?.avatar || defaultAvatar} alt="Your Avatar" className="w-8 h-8 border border-border rounded-full" />
                                        </div>
                                        <textarea
                                            ref={textareaRef}
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Write a reply..."
                                            className="w-full resize-none focus:outline-none focus:ring-0 focus:border-transparent font-light text-[0.9rem] bg-transparent text-foreground"
                                            rows={1}
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleSubmitReply}
                                            disabled={replyMutation.isPending || !replyContent.trim()}
                                            className="px-4 py-1.5 text-[0.85rem] rounded-[5px] bg-foreground text-background hover:opacity-90 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            {replyMutation.isPending ? 'Replying...' : 'Reply'}
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                    <div className="w-[300px] shrink-0" />
                </div>
            </div>
        </div>
    )
}

export default TopicDetail
