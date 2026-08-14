import { useEffect, useRef } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Feather, SearchX } from 'lucide-react'
import { Post } from './post'
import { forumAPI } from '@/services/api'
import { TopicCardSkeleton } from './skeleton'

interface FeedContentProps {
    search?: string;
}

export function FeedContent({ search = '' }: FeedContentProps) {
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
    }, [search, queryClient]);

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

    const handleDeleteTopic = (id: number) => {
        deleteMutation.mutate(id);
    };

    return (
        <>
            <div className="rounded-none md:rounded-[10px] p-0 md:p-5 flex flex-col gap-5 pl-0 pr-0 md:pl-10 md:pr-10 items-center">
                <div className="flex flex-col gap-5 w-full">
                    <div className="flex flex-col gap-0 md:gap-5 w-full">

                        {topicsLoading && (
                            <div className="flex flex-col gap-0 md:gap-5">
                                <TopicCardSkeleton />
                                <TopicCardSkeleton />
                                <TopicCardSkeleton />
                            </div>
                        )}
                        {error && (
                            <div className="text-center text-destructive py-8">Failed to load topics. Please try again.</div>
                        )}
                        {!topicsLoading && !error && topics.length === 0 && (
                            <div className="flex flex-col items-center gap-3 text-center py-14">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 border border-dashed border-border">
                                    {search ? (
                                        <SearchX className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                                    ) : (
                                        <Feather className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                                    )}
                                </div>
                                {search ? (
                                    <div>
                                        <p className="text-sm font-medium text-foreground">No results</p>
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            Nothing found for "{search}". Try another keyword.
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-sm font-medium text-foreground">No topics yet</p>
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            Be the first to share a cozy thought.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                        {!topicsLoading && !error && topics.map((topic) => (
                            <Post key={topic.id} topic={topic} onDelete={handleDeleteTopic} />
                        ))}
                        {isFetchingNextPage && (
                            <TopicCardSkeleton />
                        )}
                        {!hasNextPage && !topicsLoading && topics.length > 0 && (
                            <div className="flex items-center gap-3 py-6">
                                <div className="h-px flex-1 bg-border" />
                                <span className="text-xs text-muted-foreground">You've reached the end</span>
                                <div className="h-px flex-1 bg-border" />
                            </div>
                        )}
                        <div ref={sentinelRef} className="h-px" />
                    </div>
                </div>

            </div>
        </>
    )
}

export default FeedContent