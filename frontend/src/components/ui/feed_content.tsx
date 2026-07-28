import { useEffect, useRef } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Post } from './post'
import PostButton from './post_button'
import { forumAPI } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { TopicCardSkeleton } from './skeleton'

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
        staleTime: 30000,
    });

    const topics = data?.pages.flatMap(p => p.results) ?? [];
    const prevSearchRef = useRef(search);

    useEffect(() => {
        if (prevSearchRef.current !== search) {
            prevSearchRef.current = search;
            queryClient.resetQueries({ queryKey: ['topics', search] });
        }
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
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['topics', search] }),
    });

    const handlePostCreated = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteTopic = (id: number) => {
        deleteMutation.mutate(id);
    };

    return (
        <>
            <div className="rounded-none md:rounded-[10px] p-0 md:p-5 flex flex-col gap-5 pl-0 pr-0 md:pl-10 md:pr-10 items-center">
                <div className="flex flex-col gap-5 w-full">
                    <div className="w-full flex justify-between items-center max-w-[700px] mx-auto">
                        <h1 className="text-[clamp(0.5rem,5vw,2.5rem)] font-semibold leading-none text-foreground font-geist text-left">
                            What's up, {user?.username}! 👋
                        </h1>
                        <PostButton onPostCreated={handlePostCreated} />
                    </div>

                    <div className="flex flex-col gap-0 md:gap-5 w-full">

                        {authLoading && (
                            <div className="text-center text-gray-500 py-8">Loading...</div>
                        )}
                        {!authLoading && topicsLoading && (
                            <div className="flex flex-col gap-0 md:gap-5">
                                <TopicCardSkeleton />
                                <TopicCardSkeleton />
                                <TopicCardSkeleton />
                            </div>
                        )}
                        {!authLoading && error && (
                            <div className="text-center text-destructive py-8">Failed to load topics. Please try again.</div>
                        )}
                        {!authLoading && !topicsLoading && !error && topics.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">{search ? `No results for "${search}".` : 'No topics yet. Be the first to post!'}</div>
                        )}
                        {!authLoading && !topicsLoading && !error && topics.map((topic) => (
                            <Post key={topic.id} topic={topic} onDelete={handleDeleteTopic} />
                        ))}
                        {isFetchingNextPage && (
                            <TopicCardSkeleton />
                        )}
                        {!hasNextPage && !topicsLoading && topics.length > 0 && (
                            <div className="text-center text-muted-foreground py-4 text-sm">You've reached the end</div>
                        )}
                        <div ref={sentinelRef} className="h-px" />
                    </div>
                </div>

            </div>
        </>
    )
}

export default FeedContent