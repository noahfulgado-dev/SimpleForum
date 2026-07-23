import { useState, useEffect } from 'react'
import { Post } from './post'
import PostButton from './post_button'
import { forumAPI, type Topic } from '@/services/api'
import { useAuth } from '@/context/AuthContext'

const PAGE_SIZE = 10;

export function FeedContent() {
    const { user } = useAuth();
    const [topics, setTopics] = useState<Topic[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchTopics = async (page: number) => {
        setLoading(true);
        setError('');

        try {
            const response = await forumAPI.getTopics({ page });

            setTopics(response.data.results);
            setTotalPages(Math.ceil(response.data.count / PAGE_SIZE));
        } catch {
            setError('Failed to load topics. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTopics(currentPage);
    }, [currentPage, refreshKey]);

    const handlePostCreated = () => {
        setCurrentPage(1);
        setRefreshKey((k) => k + 1);
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
                        className={`w-8 h-8 rounded-[5px] text-sm font-medium transition-all duration-200 cursor-pointer ${
                            page === currentPage
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
            <div className="[grid-area:main] rounded-[10px] p-5 flex flex-col gap-5 pl-10 pr-10">
                <h1 className="text-[clamp(0.5rem,5vw,2.5rem)] font-semibold leading-none text-[#2d2a32] font-geist">
                    What's up, {user?.username}! 👋
                </h1>
                <div className="flex flex-col gap-5">
                    <PostButton onPostCreated={handlePostCreated} />
                    {loading && (
                        <div className="text-center text-gray-500 py-8">Loading topics...</div>
                    )}
                    {error && (
                        <div className="text-center text-red-500 py-8">{error}</div>
                    )}
                    {!loading && !error && topics.length === 0 && (
                        <div className="text-center text-gray-500 py-8">No topics yet. Be the first to post!</div>
                    )}
                    {!loading && !error && topics.map((topic) => (
                        <Post key={topic.id} topic={topic} />
                    ))}
                    {renderPagination()}
                </div>
            </div>
        </>
    )
}

export default FeedContent