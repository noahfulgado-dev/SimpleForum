import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import defaultAvatar from './../../assets/image/default_avatar.jpg';
import { forumAPI, type Topic } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import Reply from './reply';
import { Like, Liked } from './like';
import PostMenu from './post_menu';

interface RepliesProps {
    topic: Topic;
    onClose: () => void;
}

export function Replies({ topic, onClose }: RepliesProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const isOwnPost = topic.user.id === user?.id;
    const [replyContent, setReplyContent] = useState('');
    const [postIsLiked, setPostIsLiked] = useState(topic.user_has_liked);
    const [postLikeCount, setPostLikeCount] = useState(topic.like_count);
    const [isPostMenuOpen, setIsPostMenuOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const postDate = new Date(topic.created).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });

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
        mutationFn: (content: string) => forumAPI.createReply(topic.id, { content }),
        onSuccess: (res) => {
            queryClient.setQueryData(['topic', topic.id], (prev: Topic) => prev ? {
                ...prev,
                replies: [...(prev.replies || []), res.data],
            } : prev);
            setReplyContent('');
        },
        onError: () => alert('Failed to post reply.'),
    });

    const [replyLikes, setReplyLikes] = useState<Record<number, { isLiked: boolean; likeCount: number }>>({});

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

    const handlePostLike = () => {
        const newIsLiked = !postIsLiked;
        const newCount = postIsLiked ? postLikeCount - 1 : postLikeCount + 1;
        setPostIsLiked(newIsLiked);
        setPostLikeCount(newCount);
        likeMutation.mutate();
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

    const handleSubmit = () => {
        if (!replyContent.trim() || replyMutation.isPending) return;
        replyMutation.mutate(replyContent.trim());
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <>
            <div
                className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            >
                <div className="w-[40rem] max-h-[80vh] border border-border rounded-[10px] flex flex-col bg-card">
                    <div className="flex justify-end p-3 pb-0">
                        <button
                            onClick={onClose}
                            className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-xl leading-none cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="overflow-y-auto px-5 pb-3 flex flex-col gap-3">
                        <div className="flex flex-row gap-3 items-start">
                            <div className="relative group w-10 h-10 flex items-center justify-center shrink-0">
                                <img src={topic.user.avatar || defaultAvatar} alt="Avatar" className="w-10 h-10 border border-border rounded-full" />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[clamp(0.5rem,5vw,1.2rem)] font-medium leading-none text-foreground font-geist">
                                            {topic.user.username}
                                        </span>
                                        <span className="text-[clamp(0.5rem,5vw,1rem)] font-light leading-none text-foreground font-geist mt-0.5">
                                            {postDate}
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
                                            <div className="absolute top-7 right-0 w-48 bg-card border border-border rounded-[10px] p-2 flex flex-col gap-2 z-50 shadow-lg">
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
                                                    <span className="text-[0.7rem] text-muted-foreground p-1">No actions available</span>
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
                                {topic.description}
                            </div>
                        </div>

                        <div className="flex flex-row gap-4">
                            <button onClick={handlePostLike} className="w-max h-7 rounded-[5px] flex items-center justify-center hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer">
                                {postIsLiked ? (
                                    <Liked fillColor="#ef4444" />
                                ) : (
                                    <Like fillColor="#1C274C" />
                                )}
                                <span className={`text-sm ${postIsLiked ? 'text-red-500' : 'text-muted-foreground'} m-1`}>
                                    {postLikeCount}
                                </span>
                            </button>
                            <button className="w-max h-7 rounded-[5px] flex items-center justify-center hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer">
                                <Reply />
                                <span className="text-sm m-1 text-muted-foreground">
                                    {replyCount}
                                </span>
                            </button>
                        </div>

                        <div className="border-t border-border"></div>

                        {isLoading && (
                            <div className="flex justify-center py-8">
                                <span className="text-muted-foreground">Loading...</span>
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

                        {!isLoading && !error && replies.map((reply) => {
                            const replyDate = new Date(reply.created).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                            });
                            const likeState = replyLikes[reply.id];
                            const isLiked = likeState?.isLiked ?? reply.user_has_liked;
                            const likeCount = likeState?.likeCount ?? reply.like_count;
                            return (
                                <div key={reply.id} className="flex flex-row gap-3 px-1">
                                    <div className="relative group w-8 h-8 flex items-center justify-center shrink-0 mt-0.5">
                                        <img src={reply.user.avatar || defaultAvatar} alt="Avatar" className="w-8 h-8 border border-border rounded-full" />
                                    </div>
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[0.8rem] font-medium text-foreground">
                                                {reply.user.username}
                                            </span>
                                            <span className="text-[0.7rem] text-muted-foreground">
                                                {replyDate}
                                            </span>
                                        </div>
                                        <div className="text-[0.9rem] font-extralight tertiary-text text-foreground break-words">
                                            {reply.content}
                                        </div>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <button
                                                onClick={() => handleReplyLike(reply)}
                                                className="w-max h-6 rounded-[5px] flex items-center justify-center hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer"
                                            >
                                                {isLiked ? (
                                                    <Liked fillColor="#ef4444" />
                                                ) : (
                                                    <Like fillColor="#1C274C" />
                                                )}
                                            </button>
                                            <span className={`text-[0.7rem] ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}>
                                                {likeCount}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="border-t border-border p-4 flex flex-col gap-2">
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
