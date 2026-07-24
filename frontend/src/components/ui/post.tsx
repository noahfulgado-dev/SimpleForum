import { useState } from 'react'
import defaultAvatar from './../../assets/image/default_avatar.jpg';
import { Like, Liked } from './like';
import Reply from './reply';
import type { Topic } from '@/services/api';
import PostMenu from './post_menu';
import { forumAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface PostProps {
    topic: Topic;
    onDelete?: (id: number) => void;
}

export function Post({ topic, onDelete }: PostProps) {
    const { user } = useAuth();
    const isOwnPost = topic.user.id === user?.id;
    const [isLiked, setIsLiked] = useState(topic.user_has_liked);
    const [likeCount, setLikeCount] = useState(topic.like_count);

    const handleLike = () => {
        setIsLiked(!isLiked);
        setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    };

    const formattedDate = new Date(topic.created).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const [isOpen, setIsOpen] = useState<boolean>(false);
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
            <div className="[grid-area:main] border border-gray-300 rounded-[10px] p-7 flex flex-row gap-5 bg-[#fafdf6]">
                <div className="w-[100%] flex flex-col gap-2">
                    <div className="flex flex-row gap-2">
                        <div className="relative group w-10 h-10 flex items-center justify-center transition-all duration-300 ease-in-out cursor-pointer shrink-0">
                            <img src={defaultAvatar} alt="Default Avatar" className="w-10 h-10 border border-gray-800 rounded-full" />
                            <div className="absolute rounded-full inset-0 bg-gray-900/0 transition-colors duration-300 group-hover:bg-[#e5e5e5]/30"></div>
                        </div>
                        <div className="flex flex-col">
                            <div className="flex flex-col justify-between">
                                <div className="text-[clamp(0.5rem,5vw,1.2rem)] font-medium leading-none text-[#2d2a32] font-geist">
                                    {topic.user.username}
                                </div>
                                <div className="text-[clamp(0.5rem,5vw,1rem)] font-light leading-none text-[#2d2a32] font-geist">
                                    {formattedDate}
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="font-extralight tertiary-font line-clamp-3">
                        <div className="font-semibold text-[1.2rem]">
                            {topic.title}
                        </div>
                        {topic.description}
                    </div>
                    <div className="flex flex-row gap-4 mt-2">
                        <button onClick={handleLike} className="w-max h-7 rounded-[5px] flex items-center justify-center hover:bg-[#e5e5e5] transition-all duration-300 ease-in-out cursor-pointer">
                            {isLiked ? (
                                <Liked fillColor="#ef4444" />
                            ) : (
                                <Like fillColor="#1C274C" />
                            )}
                            <span className={`text-sm ${isLiked ? 'text-red-500' : 'text-gray-500'} m-1`}>
                                {likeCount}
                            </span>
                        </button>
                        <button className="w-max h-7 rounded-[5px] flex items-center justify-center hover:bg-[#e5e5e5] transition-all duration-300 ease-in-out cursor-pointer">
                            <Reply />
                            <span className={`text-sm m-1 text-gray-500`}>
                                {topic.replies.length}
                            </span>
                        </button>
                    </div>
                </div>

                <div className="flex flex-row gap-3">

                    <div className="relative">
                        <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#e5e5e5] transition-all duration-300 ease-in-out cursor-pointer" onClick={() => { setIsOpen(!isOpen); setConfirmDelete(false); }}>
                            <PostMenu />
                        </button>
                        {isOpen && (
                            <div className="absolute top-7 right-0 w-48 bg-[#fafdf6] border border-gray-300 rounded-[10px] p-2 flex flex-col gap-2 z-50">
                                {isOwnPost ? (
                                    confirmDelete ? (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[0.7rem] text-gray-600 p-1">Delete this post?</span>
                                            <div className="flex gap-1">
                                                <button
                                                    className="flex-1 p-1 text-[0.7rem] rounded-[5px] bg-red-500 text-white hover:bg-red-600 transition-all duration-300 disabled:opacity-50 cursor-pointer"
                                                    onClick={() => deletePost(topic.id)}
                                                    disabled={isDeleting}
                                                >
                                                    {isDeleting ? 'Deleting...' : 'Yes'}
                                                </button>
                                                <button
                                                    className="flex-1 p-1 text-[0.7rem] rounded-[5px] hover:bg-[#e5e5e5] transition-all duration-300 disabled:opacity-50 cursor-pointer"
                                                    onClick={() => setConfirmDelete(false)}
                                                    disabled={isDeleting}
                                                >
                                                    No
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button className="w-full text-left p-1 text-[0.7rem] rounded-[5px] hover:bg-[#e5e5e5] transition-all duration-300 ease-in-out cursor-pointer" onClick={() => deletePost(topic.id)}>Delete Post</button>
                                    )
                                ) : (
                                    <span className="text-[0.7rem] text-gray-400 p-1">No actions available</span>
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