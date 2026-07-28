import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import defaultAvatar from './../../assets/image/default_avatar.jpg';
import { Like, Liked } from './like';
import { Bookmark, Bookmarked } from './bookmark';
import { Share } from './share';
import Reply from './reply';
import type { Topic } from '@/services/api';
import PostMenu from './post_menu';
import { forumAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import Replies from './replies';
import ShareModal from './share_modal';
import EditPostModal from './edit_post_modal';
import { parseSharedDescription, SharedQuoteCard } from './shared_quote_card';
import { timeAgo } from '@/lib/time';

interface PostProps {
    topic: Topic;
    onDelete?: (id: number) => void;
}

export function Post({ topic, onDelete }: PostProps) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const isOwnPost = topic.user.id === user?.id;
    const [isLiked, setIsLiked] = useState(topic.user_has_liked);
    const [likeCount, setLikeCount] = useState(topic.like_count);

    const handleLike = () => {
        const newIsLiked = !isLiked;
        const newCount = isLiked ? likeCount - 1 : likeCount + 1;
        setIsLiked(newIsLiked);
        setLikeCount(newCount);
        forumAPI.likeTopic(topic.id).catch(() => {
            setIsLiked(isLiked);
            setLikeCount(likeCount);
        });
    };

    const handleBookmark = () => {
        const newIsBookmarked = !isBookmarked;
        setIsBookmarked(newIsBookmarked);
        forumAPI.bookmarkTopic(topic.id).catch(() => {
            setIsBookmarked(isBookmarked);
        });
    };

    const isEdited = topic.updated && new Date(topic.updated).getTime() !== new Date(topic.created).getTime();

    const [isBookmarked, setIsBookmarked] = useState(topic.user_has_bookmarked);
    const [shareCount, setShareCount] = useState(topic.shared_count ?? 0);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [isRepliesOpen, setIsRepliesOpen] = useState<boolean>(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);


    const deletePost = async (id: number) => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }
        setIsDeleting(true);
        try {
            await forumAPI.deleteTopic(id);
            onDelete?.(id);
        } catch {
            alert('Failed to delete post.');
            setConfirmDelete(false);
        } finally {
            setIsDeleting(false);
            setIsOpen(false);
        }
    }

    return (
        <>
            <div className="rounded-[10px] p-7 flex flex-row gap-5 bg-[linear-gradient(135deg,var(--accent)/0.2_0%,transparent_60%)] bg-card border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:bg-muted transition-all duration-300 ease-in-out max-w-2xl self-center w-full">
                <div className="w-[100%] flex flex-col gap-2">
                    <div className="flex flex-row gap-2 items-center">
                        <div
                            className="relative group w-10 h-10 flex items-center justify-center transition-all duration-300 ease-in-out cursor-pointer shrink-0"
                            onClick={(e) => { e.stopPropagation(); navigate(`/profile/${topic.user.id}`); }}
                        >
                            <img src={topic.user.avatar || defaultAvatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                            <div className="absolute rounded-full inset-0 bg-gray-900/0 transition-colors duration-300 group-hover:bg-muted/30"></div>
                        </div>
                        <div className="flex flex-row items-center gap-1.5">
                            <span
                                className="text-sm font-medium text-foreground font-geist cursor-pointer hover:underline"
                                onClick={(e) => { e.stopPropagation(); navigate(`/profile/${topic.user.id}`); }}
                            >
                                {topic.user.username}
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-sm font-light text-muted-foreground font-geist">
                                {timeAgo(topic.created)}
                                {isEdited && <span className="ml-1 italic">(Edited)</span>}
                            </span>
                        </div>
                    </div>

                    <div className="font-extralight tertiary-font cursor-pointer" onClick={() => navigate(`/topic/${topic.id}`)}>
                        <div className="font-semibold text-[1.2rem]">
                            {topic.title}
                        </div>
                        {(() => {
                            const parsed = parseSharedDescription(topic.description);
                            if (parsed) {
                                return (
                                    <>
                                        {parsed.text && <div className="line-clamp-3">{parsed.text}</div>}
                                        <SharedQuoteCard sharedFrom={parsed.sharedFrom} />
                                    </>
                                );
                            }
                            return <div className="line-clamp-3">{topic.description}</div>;
                        })()}
                    </div>
                    {topic.image && (
                        <div className="w-full overflow-hidden rounded-[5px] mt-2">
                            <img
                                src={topic.image}
                                alt="Post image"
                                className="w-full max-h-96 object-cover rounded-[5px]"
                            />
                        </div>
                    )}
                    <div className="flex flex-row gap-4 mt-2">
                        <button onClick={(e) => { e.stopPropagation(); handleLike(); }} className="w-max h-7 rounded-[5px] flex items-center justify-center hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer">
                            {isLiked ? (
                                <Liked fillColor="#ef4444" />
                            ) : (
                                <Like />
                            )}
                            <span className={`text-sm ${isLiked ? 'text-red-500' : 'text-muted-foreground'} m-1`}>
                                {likeCount}
                            </span>
                        </button>
                        <button className="w-max h-7 rounded-[5px] flex items-center justify-center hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer" onClick={(e) => { e.stopPropagation(); setIsRepliesOpen(true); document.body.style.overflow = 'hidden'; }}>
                            <Reply />
                            <span className={`text-sm m-1 text-muted-foreground`}>
                                {topic.reply_count ?? topic.replies?.length ?? 0}
                            </span>
                        </button>
                        {isRepliesOpen && (
                            <Replies topic={topic} onClose={() => { setIsRepliesOpen(false); document.body.style.overflow = 'visible'; }} />
                        )}
                        <button onClick={(e) => { e.stopPropagation(); setIsShareModalOpen(true); }} className="w-max h-7 rounded-[5px] flex items-center justify-center hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer">
                            <Share />
                            <span className={`text-sm m-1 text-muted-foreground`}>
                                {shareCount}
                            </span>
                        </button>
                    </div>
                    {isShareModalOpen && (
                        <ShareModal topic={topic} onClose={() => setIsShareModalOpen(false)} onShare={() => setShareCount(c => c + 1)} />
                    )}
                    {isEditModalOpen && (
                        <EditPostModal topic={topic} onClose={() => setIsEditModalOpen(false)} />
                    )}
                </div>

                <div className="flex flex-row gap-3 items-start pt-1">
                    <button onClick={(e) => { e.stopPropagation(); handleBookmark(); }} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer">
                        {isBookmarked ? (
                            <Bookmarked fillColor="#eab308" />
                        ) : (
                            <Bookmark />
                        )}
                    </button>
                    <div className="relative">
                        <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer" onClick={() => { setIsOpen(!isOpen); setConfirmDelete(false); }}>
                            <PostMenu />
                        </button>
                        {isOpen && (
                            <div className="absolute top-7 right-0 w-48 bg-card border border-border rounded-[10px] p-2 flex flex-col gap-2 z-50 shadow-lg">
                                {isOwnPost ? (
                                    <>
                                        <button className="w-full text-left p-1 text-[0.7rem] rounded-[5px] hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer" onClick={() => { setIsEditModalOpen(true); setIsOpen(false); }}>Edit Post</button>
                                        <div className="border-t border-border" />
                                        {confirmDelete ? (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[0.7rem] text-muted-foreground p-1">Delete this post?</span>
                                                <div className="flex gap-1">
                                                    <button
                                                        className="flex-1 p-1 text-[0.7rem] rounded-[5px] bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all duration-300 disabled:opacity-50 cursor-pointer"
                                                        onClick={() => deletePost(topic.id)}
                                                        disabled={isDeleting}
                                                    >
                                                        {isDeleting ? 'Deleting...' : 'Yes'}
                                                    </button>
                                                    <button
                                                        className="flex-1 p-1 text-[0.7rem] rounded-[5px] hover:bg-muted transition-all duration-300 disabled:opacity-50 cursor-pointer"
                                                        onClick={() => setConfirmDelete(false)}
                                                        disabled={isDeleting}
                                                    >
                                                        No
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button className="w-full text-left p-1 text-[0.7rem] rounded-[5px] hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer" onClick={() => deletePost(topic.id)}>Delete Post</button>
                                        )}
                                    </>
                                ) : (
                                    <button className="w-full text-left p-1 text-[0.7rem] rounded-[5px] hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer" onClick={() => alert('Report submitted.')}>Report</button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>


        </>
    )
}

export default Post