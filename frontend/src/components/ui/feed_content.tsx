import { useEffect, useRef } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Post } from './post'
import PostButton from './post_button'
import { forumAPI } from '@/services/api'
import { useAuth } from '@/context/AuthContext'

interface FeedContentProps {
    search?: string;
}

export function FeedContent({ search = '' }: FeedContentProps) {
    const { user, loading: authLoading } = useAuth();
    const queryClient = useQueryClient();
    const sentinelRef = useRef<HTMLDivElement>(null);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: topicsLoading,
        error,
    } = useInfiniteQuery({
        queryKey: ['topics', search],
        queryFn: ({ pageParam = 1 }) =>
            forumAPI.getTopics({ page: pageParam, search: search || undefined }).then(r => r.data),
        getNextPageParam: (lastPage) => {
            if (!lastPage.next) return undefined;
            return Number(new URL(lastPage.next).searchParams.get('page'));
        },
        initialPageParam: 1,
    });

    const topics = data?.pages.flatMap(p => p.results) ?? [];

    useEffect(() => {
        queryClient.resetQueries({ queryKey: ['topics', search] });
    }, [search]);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { rootMargin: '300px' },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const deleteMutation = useMutation({
        mutationFn: (id: number) => forumAPI.deleteTopic(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['topics'] }),
    });

    const handlePostCreated = () => {
        queryClient.resetQueries({ queryKey: ['topics', search] });
    };

    const handleDeleteTopic = (id: number) => {
        deleteMutation.mutate(id);
    };

    return (
        <>
            <div className="rounded-[10px] p-5 flex flex-col gap-5 pl-10 pr-10 items-center">
                <div className="flex flex-col gap-5 items-center w-fit">
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
                            <div className="text-center text-gray-500 py-8">{search ? `No results for "${search}".` : 'No topics yet. Be the first to post!'}</div>
                        )}
                        {!authLoading && !topicsLoading && !error && topics.map((topic) => (
                            <Post key={topic.id} topic={topic} onDelete={handleDeleteTopic} />
                        ))}
                        {isFetchingNextPage && (
                            <div className="text-center text-gray-400 py-4">Loading more...</div>
                        )}
                        {!hasNextPage && !topicsLoading && topics.length > 0 && (
                            <div className="text-center text-gray-400 py-4 text-sm">You've reached the end</div>
                        )}
                        <div ref={sentinelRef} className="h-px" />
                    </div>
                </div>

            </div>
        </>
    )
}

export default FeedContent