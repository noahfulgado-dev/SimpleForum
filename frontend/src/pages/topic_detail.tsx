import { useRef, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { forumAPI, type Topic, type Reply } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/navbar';
import SidebarLeft from '@/components/ui/sidebar_left';
import SidebarRight from '@/components/ui/sidebar_right';
import defaultAvatar from './../assets/image/default_avatar.jpg';
import { Like, Liked } from '@/components/ui/like';
import { Bookmark, Bookmarked } from '@/components/ui/bookmark';
import { Share } from '@/components/ui/share';
import ReplyIcon from '@/components/ui/reply';
import PostMenu from '@/components/ui/post_menu';
import ShareModal from '@/components/ui/share_modal';
import { SharedQuoteCard, parseSharedDescription } from '@/components/ui/shared_quote_card';
import { TopicDetailSkeleton } from '@/components/ui/skeleton';
import { timeAgo } from '@/lib/time';

export function TopicDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const topicId = Number(id);
    const [replyContent, setReplyContent] = useState('');
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Reply | null>(null);
    const [expandedChildren, setExpandedChildren] = useState<Record<number, boolean>>({});
    const [isPostMenuOpen, setIsPostMenuOpen] = useState(false);
    const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');
    const [replyMenuOpen, setReplyMenuOpen] = useState<Record<number, boolean>>({});
    const [replyConfirmDelete, setReplyConfirmDelete] = useState<Record<number, boolean>>({});
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
        mutationFn: (data: { content: string; parent?: number | null }) =>
            forumAPI.createReply(topicId, data),
        onSuccess: (res) => {
            queryClient.setQueryData(['topic', topicId], (prev: Topic) => {
                if (!prev) return prev;
                const parentId = res.data.parent;
                if (parentId) {
                    const addChild = (items: Reply[]): Reply[] =>
                        items.map(r => {
                            if (r.id === parentId) {
                                return { ...r, children: [...(r.children || []), res.data] };
                            }
                            if (r.children?.length) {
                                return { ...r, children: addChild(r.children) };
                            }
                            return r;
                        });
                    return { ...prev, replies: addChild(prev.replies || []) };
                }
                return { ...prev, replies: [...(prev.replies || []), res.data] };
            });
            setReplyContent('');
            setReplyingTo(null);
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

    const replyDeleteMutation = useMutation({
        mutationFn: (id: number) => forumAPI.deleteReply(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['topic', topicId] });
        },
        onError: () => {
            alert('Failed to delete reply.');
        },
    });

    const replyEditMutation = useMutation({
        mutationFn: ({ id, content }: { id: number; content: string }) =>
            forumAPI.updateReply(id, { content }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['topic', topicId] });
            setEditingReplyId(null);
            setEditContent('');
        },
        onError: () => {
            alert('Failed to edit reply.');
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
        replyMutation.mutate({ content: replyContent.trim(), parent: replyingTo?.id });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmitReply();
        }
    };

    const renderReply = (reply: Reply, depth: number = 0): React.ReactNode => {
        const likeState = replyLikes[reply.id];
        const isLiked = likeState?.isLiked ?? reply.user_has_liked;
        const likeCount = likeState?.likeCount ?? reply.like_count;
        const isBookmarked = replyBookmarks[reply.id] ?? reply.user_has_bookmarked;
        const shareState = replyShares[reply.id];
        const shareCount = shareState?.shareCount ?? reply.shared_count;
        const children = reply.children ?? [];
        const isExpanded = expandedChildren[reply.id] ?? false;
        const showMoreCount = children.length - 3;
        const isOwnReply = reply.user.id === user?.id;
        const isEditing = editingReplyId === reply.id;
        const isMenuOpen = replyMenuOpen[reply.id] ?? false;
        const isConfirmDelete = replyConfirmDelete[reply.id] ?? false;

        return (
            <div key={reply.id} className="relative pl-10">
                <div className="absolute left-[22px] top-0 w-[18px] h-[34px] border-l-2 border-b-2 dark:border-white/20 border-border/60 rounded-bl-[4px] pointer-events-none"></div>
                <div className="flex-1 flex flex-row gap-3 p-4 border border-border rounded-[10px] bg-card">
                    <div
                        className="relative group w-8 h-8 flex items-center justify-center shrink-0 mt-0.5 cursor-pointer"
                        onClick={() => navigate(`/profile/${reply.user.id}`)}
                    >
                        <img src={reply.user.avatar || defaultAvatar} alt="Avatar" className="w-8 h-8 border border-border rounded-full" />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span
                                    className="text-[0.8rem] font-medium text-foreground cursor-pointer hover:underline"
                                    onClick={() => navigate(`/profile/${reply.user.id}`)}
                                >
                                    {reply.user.username}
                                </span>
                                <span className="text-[0.55rem] text-muted-foreground">•</span>
                                <span className="text-[0.7rem] text-muted-foreground">{timeAgo(reply.created)}</span>
                            </div>
                            <div className="relative">
                                <button
                                    className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer"
                                    onClick={() => setReplyMenuOpen(prev => ({ ...prev, [reply.id]: !isMenuOpen }))}
                                >
                                    <PostMenu />
                                </button>
                                {isMenuOpen && (
                                    <div className="absolute top-7 right-0 w-48 bg-card border border-border rounded-[10px] p-2 flex flex-col gap-2 z-50 shadow-lg">
                                        {isOwnReply ? (
                                            <>
                                                <button
                                                    className="w-full text-left p-1 text-[0.7rem] rounded-[5px] hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer"
                                                    onClick={() => {
                                                        setEditingReplyId(reply.id);
                                                        setEditContent(reply.content);
                                                        setReplyMenuOpen(prev => ({ ...prev, [reply.id]: false }));
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                                <div className="border-t border-border" />
                                                {isConfirmDelete ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[0.7rem] text-muted-foreground p-1">Delete this reply?</span>
                                                        <div className="flex gap-1">
                                                            <button
                                                                className="flex-1 p-1 text-[0.7rem] rounded-[5px] bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all duration-300 disabled:opacity-50 cursor-pointer"
                                                                onClick={() => replyDeleteMutation.mutate(reply.id)}
                                                                disabled={replyDeleteMutation.isPending}
                                                            >
                                                                {replyDeleteMutation.isPending ? 'Deleting...' : 'Yes'}
                                                            </button>
                                                            <button
                                                                className="flex-1 p-1 text-[0.7rem] rounded-[5px] hover:bg-muted transition-all duration-300 disabled:opacity-50 cursor-pointer"
                                                                onClick={() => setReplyConfirmDelete(prev => ({ ...prev, [reply.id]: false }))}
                                                                disabled={replyDeleteMutation.isPending}
                                                            >
                                                                No
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        className="w-full text-left p-1 text-[0.7rem] rounded-[5px] hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer"
                                                        onClick={() => setReplyConfirmDelete(prev => ({ ...prev, [reply.id]: true }))}
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <button className="w-full text-left p-1 text-[0.7rem] rounded-[5px] hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer" onClick={() => alert('Report submitted.')}>Report</button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        {isEditing ? (
                            <div className="flex flex-col gap-2 mt-1">
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full resize-none focus:outline-none focus:ring-0 focus:border-transparent font-light text-[0.9rem] bg-transparent text-foreground border border-border rounded-[5px] p-2"
                                    rows={2}
                                />
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => { setEditingReplyId(null); setEditContent(''); }}
                                        className="px-3 py-1 text-[0.75rem] rounded-[5px] hover:bg-muted transition-all duration-200 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => replyEditMutation.mutate({ id: reply.id, content: editContent })}
                                        disabled={replyEditMutation.isPending || !editContent.trim()}
                                        className="px-3 py-1 text-[0.75rem] rounded-[5px] bg-foreground text-background hover:opacity-90 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        {replyEditMutation.isPending ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-[0.9rem] font-extralight tertiary-text text-foreground break-words">{reply.content}</div>
                        )}
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
                            <button
                                onClick={() => {
                                    setReplyingTo(reply);
                                    textareaRef.current?.focus();
                                }}
                                className="ml-2 text-[0.7rem] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            >
                                Reply
                            </button>
                        </div>
                    </div>
                </div>
                {children.length > 0 && (
                    <div className="ml-8 flex flex-col gap-3 mt-3">
                        {(isExpanded ? children : children.slice(0, 3)).map((child) =>
                            renderReply(child, depth + 1)
                        )}
                        {!isExpanded && showMoreCount > 0 && (
                            <button
                                onClick={() => setExpandedChildren(prev => ({ ...prev, [reply.id]: true }))}
                                className="text-[0.75rem] text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-left pl-10"
                            >
                                Show {showMoreCount} more {showMoreCount === 1 ? 'reply' : 'replies'}
                            </button>
                        )}
                        {isExpanded && showMoreCount > 0 && (
                            <button
                                onClick={() => setExpandedChildren(prev => ({ ...prev, [reply.id]: false }))}
                                className="text-[0.75rem] text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-left pl-10"
                            >
                                Show less
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
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

    return (
        <>
        <div className="h-screen flex flex-col bg-background bg-[linear-gradient(to_right,var(--muted)_1px,transparent_1px),linear-gradient(to_bottom,var(--muted)_1px,transparent_1px)] bg-size-[40px_40px]">
            <div className="p-5 pb-0 shrink-0 relative z-50">
                <Navbar />
            </div>
            <SidebarLeft />
            <SidebarRight />
            <div className="flex-1 overflow-y-auto px-0 md:px-5 pb-0 md:pb-5">
                <div className="flex gap-5 justify-center min-h-full">
                    <div className="hidden xl:block w-[300px] shrink-0" />
                    <div className="flex-1 max-w-[900px] min-w-0">
                        <div className="rounded-[10px] p-0 md:p-5 flex flex-col gap-5 pl-0 pr-0 md:pl-10 md:pr-10">

                            <button onClick={() => navigate(-1)} className="w-max text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                                ← Back
                            </button>

                            {isLoading && <TopicDetailSkeleton />}

                            {topic && (
                                <div className="border border-border rounded-[10px] p-7 flex flex-row gap-5 bg-card">
                                    <div className="w-full flex flex-col gap-2">
                                        <div className="flex flex-row gap-2">
                                            <div
                                                className="relative group w-10 h-10 flex items-center justify-center shrink-0 cursor-pointer"
                                                onClick={() => navigate(`/profile/${topic.user.id}`)}
                                            >
                                                <img src={topic.user.avatar || defaultAvatar} alt="Avatar" className="w-10 h-10 rounded-full" />
                                            </div>
                                            <div className="flex flex-row items-center gap-1.5">
                                                <span
                                                    className="text-sm font-medium text-foreground font-geist cursor-pointer hover:underline"
                                                    onClick={() => navigate(`/profile/${topic.user.id}`)}
                                                >
                                                    {topic.user.username}
                                                </span>
                                                <span className="text-xs text-muted-foreground">•</span>
                                                <span className="text-sm font-light text-muted-foreground font-geist">
                                                    {timeAgo(topic.created)}
                                                </span>
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

                                        {topic.image && (
                                            <div className="relative w-full overflow-hidden rounded-[5px]">
                                                <img
                                                    src={topic.image}
                                                    alt=""
                                                    className="absolute inset-0 w-full h-full scale-110 blur-xl opacity-50 object-cover"
                                                    aria-hidden="true"
                                                />
                                                <img
                                                    src={topic.image}
                                                    alt="Post image"
                                                    className="relative w-full object-cover"
                                                />
                                            </div>
                                        )}

                                        <div className="flex flex-row gap-4 mt-2">
                                            <button onClick={handleLike} className="w-max h-7 rounded-[5px] flex items-center justify-center hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer">
                                                {isLiked ? <Liked fillColor="#ef4444" /> : <Like />}
                                                <span className={`text-sm ${isLiked ? 'text-red-500' : 'text-muted-foreground'} m-1`}>{likeCount}</span>
                                            </button>
                                            <button className="w-max h-7 rounded-[5px] flex items-center justify-center hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer">
                                                <ReplyIcon />
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
                                            <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer" onClick={() => setIsPostMenuOpen(!isPostMenuOpen)}>
                                                <PostMenu />
                                            </button>
                                            {isPostMenuOpen && (
                                                <div className="absolute top-7 right-0 w-48 bg-card border border-border rounded-[10px] p-2 flex flex-col gap-2 z-50 shadow-lg">
                                                    <button className="w-full text-left p-1 text-[0.7rem] rounded-[5px] hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer" onClick={() => alert('Report submitted.')}>Report</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-border" />

                            {topic && replies.length === 0 && (
                                <div className="text-center text-muted-foreground py-8">No replies yet. Be the first to share your thoughts!</div>
                            )}

                            {topic && replies.map((reply) =>
                                renderReply(reply, 0)
                            )}

                            {topic && (
                                <div className="border-t border-border pt-4 flex flex-col gap-2">
                                    {replyingTo && (
                                        <div className="flex items-center gap-1 text-[0.75rem] text-muted-foreground px-1">
                                            <span>Replying to <span className="font-medium text-foreground">@{replyingTo.user.username}</span></span>
                                            <button
                                                onClick={() => setReplyingTo(null)}
                                                className="ml-auto text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex flex-row gap-3 items-start">
                                        <div className="relative group w-8 h-8 flex items-center justify-center shrink-0">
                                            <img key={user?.avatar} src={user?.avatar || defaultAvatar} alt="Your Avatar" className="w-8 h-8 border border-border rounded-full" />
                                        </div>
                                        <textarea
                                            ref={textareaRef}
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder={replyingTo ? `Reply to @${replyingTo.user.username}...` : "Write a reply..."}
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
                    <div className="hidden xl:block w-[300px] shrink-0" />
                </div>
            </div>
        </div>
        </>
    )
}

export default TopicDetail