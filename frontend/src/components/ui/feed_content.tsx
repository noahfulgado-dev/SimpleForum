import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Post } from './post'
import PostButton from './post_button'
import { forumAPI } from '@/services/api'
import { useAuth } from '@/context/AuthContext'

const PAGE_SIZE = 10;

export function FeedContent() {
    const { user, loading: authLoading } = useAuth();
    const queryClient = useQueryClient();
    const [currentPage, setCurrentPage] = useState(1);

    const { data, isLoading: topicsLoading, error } = useQuery({
        queryKey: ['topics', currentPage],
        queryFn: () => forumAPI.getTopics({ page: currentPage }).then(r => r.data),
        placeholderData: (prev) => prev,
    });

    const topics = (data?.results ?? []).sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    const totalPages = Math.ceil((data?.count ?? 0) / PAGE_SIZE);

    const deleteMutation = useMutation({
        mutationFn: (id: number) => forumAPI.deleteTopic(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['topics'] }),
    });

    const handlePostCreated = () => {
        setCurrentPage(1);
        queryClient.invalidateQueries({ queryKey: ['topics'] });
    };

    const handleDeleteTopic = (id: number) => {
        deleteMutation.mutate(id);
    };

    const renderPagination = () => {
        if (totalPages <= 1) return null;

        const pages: number[] = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }

        return (
            <div className="flex items-center justify-center gap-2 mt-6">
                <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-[5px] text-sm font-medium border border-gray-300 bg-[#fafdf6] text-[#2d2a32] hover:bg-[#e5e5e5] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                    Previous
                </button>

                {pages.map((page) => (
                    <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-[5px] text-sm font-medium transition-all duration-200 cursor-pointer ${page === currentPage
                            ? 'bg-[#2d2a32] text-[#fafdf6]'
                            : 'border border-gray-300 bg-[#fafdf6] text-[#2d2a32] hover:bg-[#e5e5e5]'
                            }`}
                    >
                        {page}
                    </button>
                ))}

                <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-[5px] text-sm font-medium border border-gray-300 bg-[#fafdf6] text-[#2d2a32] hover:bg-[#e5e5e5] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                    Next
                </button>
            </div>
        );
    };

    return (
        <>
            <div className="[grid-area:main] rounded-[10px] p-5 flex flex-col gap-5 pl-10 pr-10 items-center">
                <div className="flex flex-col gap-5 items-center w-fit h-fit">
                    <div className="w-full flex justify-between items-center ">
                        <h1 className="text-[clamp(0.5rem,5vw,2.5rem)] font-semibold leading-none text-[#2d2a32] font-geist text-left">
                            What's up, {user?.username}! 👋
                        </h1>
                        <PostButton onPostCreated={handlePostCreated} />
                    </div>

                    <div className="flex flex-col gap-5 w-full">
                        
                        {authLoading && (
                            <div className="text-center text-gray-500 py-8">Loading...</div>
                        )}
                        {!authLoading && topicsLoading && (
                            <div className="text-center text-gray-500 py-8">Loading topics...</div>
                        )}
                        {!authLoading && error && (
                            <div className="text-center text-red-500 py-8">Failed to load topics. Please try again.</div>
                        )}
                        {!authLoading && !topicsLoading && !error && topics.length === 0 && (
                            <div className="text-center text-gray-500 py-8">No topics yet. Be the first to post!</div>
                        )}
                        {!authLoading && !topicsLoading && !error && topics.map((topic) => (
                            <Post key={topic.id} topic={topic} onDelete={handleDeleteTopic} />
                        ))}
                        {renderPagination()}
                    </div>
                </div>

            </div>
        </>
    )
}

export default FeedContent