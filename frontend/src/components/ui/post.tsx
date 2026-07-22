import { useState } from 'react'
import defaultAvatar from './../../assets/image/default_avatar.jpg';
import { Like, Liked } from './like';
import Reply from './reply';
import type { Topic } from '@/services/api';

interface PostProps {
    topic: Topic;
}

export function Post({ topic }: PostProps) {
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

    return (
        <>
            <div className="[grid-area:main] border border-gray-300 rounded-[10px] p-5 flex flex-row gap-5 pl-10 pr-10 bg-[#fafdf6]">
                <div className="relative group w-10 h-10 flex items-center justify-center transition-all duration-300 ease-in-out cursor-pointer shrink-0">
                    <img src={defaultAvatar} alt="Default Avatar" className="w-10 h-10 border border-gray-800 rounded-full" />
                    <div className="absolute rounded-full inset-0 bg-gray-900/0 transition-colors duration-300 group-hover:bg-[#e5e5e5]/30"></div>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex flex-row justify-between items-center">
                        <div className="text-[clamp(0.5rem,5vw,1.2rem)] font-medium leading-none text-[#2d2a32] font-geist">
                            {topic.user.username}
                        </div>

                    </div>
                    <div className="font-semibold text-2xl">
                        {topic.title}
                    </div>
                    <div className="font-light line-clamp-3">
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
                <div className="text-[clamp(0.5rem,5vw,1rem)] font-light leading-none text-[#2d2a32] font-geist">
                    {formattedDate}
                </div>
            </div>
        </>
    )
}

export default Post