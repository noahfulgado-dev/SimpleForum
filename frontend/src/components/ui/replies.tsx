import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import defaultAvatar from './../../assets/image/default_avatar.jpg';
import { forumAPI, type Topic, type Reply } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { timeAgo } from '@/lib/time';
import ReplyIcon from './reply';
import { Like, Liked } from './like';
import { Bookmark, Bookmarked } from './bookmark';
import { Share } from './share';
import PostMenu from './post_menu';
import { TopicDetailSkeleton, ReplySkeleton } from './skeleton';
import { parseSharedDescription, SharedQuoteCard } from './shared_quote_card';

interface RepliesProps {
    topic: Topic;
    onClose: () => void;
}

export function Replies({ topic, onClose }: RepliesProps) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const isOwnPost = topic.user.id === user?.id;
    const [replyContent, setReplyContent] = useState('');
    const [postIsLiked, setPostIsLiked] = useState(topic.user_has_liked);
    const [postLikeCount, setPostLikeCount] = useState(topic.like_count);
    const [postIsBookmarked, setPostIsBookmarked] = useState(topic.user_has_bookmarked);
    const [postIsShared, setPostIsShared] = useState(topic.user_has_shared);
    const [postShareCount, setPostShareCount] = useState(topic.shared_count ?? 0);
    const [isPostMenuOpen, setIsPostMenuOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Reply | null>(null);
    const [expandedChildren, setExpandedChildren] = useState<Record<number, boolean>>({});
    const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');
    const [replyMenuOpen, setReplyMenuOpen] = useState<Record<number, boolean>>({});
    const [replyConfirmDelete, setReplyConfirmDelete] = useState<Record<number, boolean>>({});
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const { data: currentTopic, isLoading, error } = useQuery({
        queryKey: ['topic', topic.id],
        queryFn: () => forumAPI.getTopic(topic.id).then(r => r.data),
    });

    const replies = currentTopic?.replies ?? [];
    const replyCount = replies.length;

    const likeMutation = useMutation({
        mutationFn: () => forumAPI.likeTopic(topic.id),
        onError: () => {
            setPostIsLiked(topic.user_has_liked);
            setPostLikeCount(topic.like_count);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => forumAPI.deleteTopic(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['topics'] });
            onClose();
        },
        onError: () => {
            alert('Failed to delete post.');
            setConfirmDelete(false);
        },
    });

    const replyMutation = useMutation({
        mutationFn: (data: { content: string; parent?: number | null }) =>
            forumAPI.createReply(topic.id, data),
        onSuccess: (res) => {
            queryClient.setQueryData(['topic', topic.id], (prev: Topic) => {
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

    const [replyLikes, setReplyLikes] = useState<Record<number, { isLiked: boolean; likeCount: number }>>({});
    const [replyBookmarks, setReplyBookmarks] = useState<Record<number, boolean>>({});
    const [replyShares, setReplyShares] = useState<Record<number, { isShared: boolean; shareCount: number }>>({});

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

    const bookmarkMutation = useMutation({
        mutationFn: () => forumAPI.bookmarkTopic(topic.id),
        onError: () => {
            setPostIsBookmarked(topic.user_has_bookmarked);
        },
    });

    const shareMutation = useMutation({
        mutationFn: () => forumAPI.shareTopic(topic.id),
        onError: () => {
            setPostIsShared(topic.user_has_shared);
            setPostShareCount(topic.shared_count ?? 0);
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
            queryClient.invalidateQueries({ queryKey: ['topic', topic.id] });
        },
        onError: () => {
            alert('Failed to delete reply.');
        },
    });

    const replyEditMutation = useMutation({
        mutationFn: ({ id, content }: { id: number; content: string }) =>
            forumAPI.updateReply(id, { content }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['topic', topic.id] });
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

    const handlePostLike = () => {
        const newIsLiked = !postIsLiked;
        const newCount = postIsLiked ? postLikeCount - 1 : postLikeCount + 1;
        setPostIsLiked(newIsLiked);
        setPostLikeCount(newCount);
        likeMutation.mutate();
    };

    const handlePostBookmark = () => {
        const newIsBookmarked = !postIsBookmarked;
        setPostIsBookmarked(newIsBookmarked);
        bookmarkMutation.mutate();
    };

    const handlePostShare = () => {
        const newIsShared = !postIsShared;
        const newCount = postIsShared ? postShareCount - 1 : postShareCount + 1;
        setPostIsShared(newIsShared);
        setPostShareCount(newCount);
        shareMutation.mutate();
    };

    const deletePost = (id: number) => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }
        deleteMutation.mutate(id);
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

    const handleSubmit = () => {
        if (!replyContent.trim() || replyMutation.isPending) return;
        replyMutation.mutate({ content: replyContent.trim(), parent: replyingTo?.id });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
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
                <div className="flex-1 flex flex-row gap-3 p-4 border-0 md:border md:border-border rounded-none md:rounded-[10px] bg-card">
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
                                <span className="text-[0.7rem] text-muted-foreground">
                                    {timeAgo(reply.created)}
                                </span>
                            </div>
                            <div className="relative">
                                <button
                                    className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer"
                                    onClick={() => setReplyMenuOpen(prev => ({ ...prev, [reply.id]: !isMenuOpen }))}
                                >
                                    <PostMenu />
                                </button>
                                {isMenuOpen && (
                                    <div className="absolute top-7 right-0 w-48 bg-card border border-border rounded-xl p-2 flex flex-col gap-2 z-50 shadow-xl shadow-black/10">
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
                            <div className="text-[0.9rem] font-extralight tertiary-text text-foreground break-words">
                                {reply.content}
                            </div>
                        )}
                        <div className="flex items-center gap-1 mt-0.5">
                            <button
                                onClick={() => handleReplyLike(reply)}
                                className="w-max h-6 rounded-[5px] flex items-center justify-center hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer"
                            >
                                {isLiked ? (
                                    <Liked fillColor="#ef4444" />
                                ) : (
                                    <Like />
                                )}
                            </button>
                            <span className={`text-[0.7rem] ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}>
                                {likeCount}
                            </span>
                            <button
                                onClick={() => handleReplyBookmark(reply)}
                                className="w-max h-6 rounded-[5px] flex items-center justify-center hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer"
                            >
                                {isBookmarked ? (
                                    <Bookmarked fillColor="#eab308" />
                                ) : (
                                    <Bookmark />
                                )}
                            </button>
                            <button
                                onClick={() => handleReplyShare(reply)}
                                className="w-max h-6 rounded-[5px] flex items-center justify-center hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer"
                            >
                                <Share />
                            </button>
                            <span className="text-[0.7rem] text-muted-foreground">
                                {shareCount}
                            </span>
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

    return (
        <>
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            >
                <div className="w-[40rem] max-h-[80vh] border border-border rounded-2xl shadow-2xl shadow-black/20 flex flex-col bg-card">
                    <div className="flex justify-end p-3 pb-0">
                        <button
                            onClick={onClose}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200 text-lg leading-none cursor-pointer"
                            aria-label="Close"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="overflow-y-auto px-5 pb-3">
                        <div className="relative">
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-row gap-3 items-start">
                                    <div
                                        className="relative group w-10 h-10 flex items-center justify-center shrink-0 cursor-pointer"
                                        onClick={() => navigate(`/profile/${topic.user.id}`)}
                                    >
                                        <img src={topic.user.avatar || defaultAvatar} alt="Avatar" className="w-10 h-10 border border-border rounded-full" />
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span
                                                    className="text-sm font-medium leading-none text-foreground font-geist cursor-pointer hover:underline"
                                                    onClick={() => navigate(`/profile/${topic.user.id}`)}
                                                >
                                                    {topic.user.username}
                                                </span>
                                                <span className="text-xs font-light leading-none text-muted-foreground font-geist mt-0.5">
                                                    {timeAgo(topic.created)}
                                                </span>
                                            </div>
                                            <div className="relative">
                                                <button
                                                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer"
                                                    onClick={() => { setIsPostMenuOpen(!isPostMenuOpen); setConfirmDelete(false); }}
                                                >
                                                    <PostMenu />
                                                </button>
                                                {isPostMenuOpen && (
                                                    <div className="absolute top-7 right-0 w-48 bg-card border border-border rounded-xl p-2 flex flex-col gap-2 z-50 shadow-xl shadow-black/10">
                                                        {isOwnPost ? (
                                                            confirmDelete ? (
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[0.7rem] text-muted-foreground p-1">Delete this post?</span>
                                                                    <div className="flex gap-1">
                                                                        <button
                                                                            className="flex-1 p-1 text-[0.7rem] rounded-[5px] bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all duration-300 disabled:opacity-50 cursor-pointer"
                                                                            onClick={() => deletePost(topic.id)}
                                                                            disabled={deleteMutation.isPending}
                                                                            >
                                                                            {deleteMutation.isPending ? 'Deleting...' : 'Yes'}
                                                                        </button>
                                                                        <button
                                                                            className="flex-1 p-1 text-[0.7rem] rounded-[5px] hover:bg-muted transition-all duration-300 disabled:opacity-50 cursor-pointer"
                                                                            onClick={() => setConfirmDelete(false)}
                                                                            disabled={deleteMutation.isPending}
                                                                        >
                                                                            No
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <button className="w-full text-left p-1 text-[0.7rem] rounded-[5px] hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer" onClick={() => deletePost(topic.id)}>Delete Post</button>
                                                            )
                                                        ) : (
                                                            <button className="w-full text-left p-1 text-[0.7rem] rounded-[5px] hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer" onClick={() => alert('Report submitted.')}>Report</button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
        
                                <div>
                                    <div className="font-semibold text-[1.2rem] text-foreground">
                                        {topic.title}
                                    </div>
                                    <div className="font-extralight tertiary-font text-foreground mt-1">
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
                                            className="relative w-full max-h-[468px] object-cover"
                                        />
                                    </div>
                                )}
        
                                <div className="flex flex-row gap-4 items-center">
                                    <button onClick={handlePostLike} className="w-max h-7 rounded-[5px] flex items-center justify-center hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer">
                                        {postIsLiked ? (
                                            <Liked fillColor="#ef4444" />
                                        ) : (
                                            <Like />
                                        )}
                                        <span className={`text-sm ${postIsLiked ? 'text-red-500' : 'text-muted-foreground'} ml-1`}>
                                            {postLikeCount}
                                        </span>
                                    </button>
                                    <button className="w-max h-7 rounded-[5px] flex items-center justify-center hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer">
                                        <ReplyIcon />
                                        <span className="text-sm ml-1 text-muted-foreground">
                                            {replyCount}
                                        </span>
                                    </button>
                                    <button onClick={handlePostBookmark} className="w-max h-7 rounded-[5px] flex items-center justify-center hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer">
                                        {postIsBookmarked ? (
                                            <Bookmarked fillColor="#eab308" />
                                        ) : (
                                            <Bookmark />
                                        )}
                                    </button>
                                    <button onClick={handlePostShare} className="w-max h-7 rounded-[5px] flex items-center justify-center hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer">
                                        <Share />
                                        <span className="text-sm ml-1 text-muted-foreground">
                                            {postShareCount}
                                        </span>
                                    </button>
                                </div>
        
                                <div className="border-t border-border"></div>
        
                                {isLoading && (
                                    <div className="flex flex-col gap-4 py-4">
                                        <TopicDetailSkeleton />
                                        <div className="border-t border-border" />
                                        <ReplySkeleton />
                                        <ReplySkeleton />
                                        <ReplySkeleton />
                                    </div>
                                )}
        
                                {error && (
                                    <div className="flex justify-center py-8">
                                        <span className="text-red-500">Failed to load replies.</span>
                                    </div>
                                )}
        
                                {!isLoading && !error && replies.length === 0 && (
                                    <div className="flex justify-center py-8">
                                        <span className="text-muted-foreground">No replies yet. Be the first to share your thoughts!</span>
                                    </div>
                                )}
        
                                {!isLoading && !error && replies.map((reply) =>
                                    renderReply(reply, 0)
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-border p-4 flex flex-col gap-2">
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
                                onClick={handleSubmit}
                                disabled={replyMutation.isPending || !replyContent.trim()}
                                className="px-4 py-1.5 text-[0.85rem] rounded-[5px] bg-foreground text-background hover:opacity-90 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {replyMutation.isPending ? 'Replying...' : 'Reply'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Replies