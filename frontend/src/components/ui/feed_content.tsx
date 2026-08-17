import { useEffect, useRef, useState } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Feather, SearchX } from 'lucide-react'
import { Post } from './post'
import { forumAPI, type Topic } from '@/services/api'
import { TopicCardSkeleton } from './skeleton'

interface FeedContentProps {
    search?: string;
}

export function FeedContent({ search = '' }: FeedContentProps) {
    const queryClient = useQueryClient();
    const sentinelRef = useRef<HTMLDivElement>(null);
    const cyclePendingRef = useRef(false);
    const [cycle, setCycle] = useState(0);
    const [extraTopics, setExtraTopics] = useState<{ topic: Topic; key: string }[]>([]);
    const [newPostsAvailable, setNewPostsAvailable] = useState(false);

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

    const newestQuery = useQuery({
        queryKey: ['topics-newest', search],
        queryFn: () =>
            forumAPI.getTopics({ page: 1, search: search || undefined }).then(r => r.data),
        refetchInterval: 60000,
        enabled: !search,
    });

    const topics = data?.pages.flatMap(p => p.results) ?? [];
    const prevSearchRef = useRef(search);

    useEffect(() => {
        if (prevSearchRef.current !== search) {
            prevSearchRef.current = search;
            setExtraTopics([]);
            setCycle(0);
            setNewPostsAvailable(false);
            queryClient.resetQueries({ queryKey: ['topics', search] });
        }
    }, [search, queryClient]);

    useEffect(() => {
        if (search || newPostsAvailable) return;
        const newestId = newestQuery.data?.results?.[0]?.id;
        const headId = data?.pages?.[0]?.results?.[0]?.id;
        if (newestId && headId && newestId !== headId) {
            setNewPostsAvailable(true);
        }
    }, [newestQuery.data, data, search, newPostsAvailable]);

    const handleNewPosts = () => {
        setNewPostsAvailable(false);
        setExtraTopics([]);
        setCycle(0);
        queryClient.resetQueries({ queryKey: ['topics', search] });
        document.getElementById('feed-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const shuffle = () => {
        const pool = topics;
        if (pool.length === 0) return;
        cyclePendingRef.current = true;
        const next = cycle + 1;
        const shuffled = [...pool];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const lastExtra = extraTopics[extraTopics.length - 1];
        const prevLastId = lastExtra ? lastExtra.topic.id : topics[topics.length - 1]?.id;
        if (shuffled.length > 1 && shuffled[0].id === prevLastId) {
            [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
        }
        setExtraTopics(prev => [...prev, ...shuffled.map(t => ({ topic: t, key: `${t.id}-c${next}` }))]);
        setCycle(next);
    };

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) {
                    cyclePendingRef.current = false;
                    return;
                }
                if (cyclePendingRef.current) return;
                if (isFetchingNextPage) return;
                if (hasNextPage) {
                    fetchNextPage();
                } else if (!search) {
                    shuffle();
                }
            },
            { rootMargin: '300px' },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, search, cycle, extraTopics, topics]);

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
                        {!topicsLoading && !error && extraTopics.map(({ topic, key }) => (
                            <Post key={key} topic={topic} onDelete={handleDeleteTopic} />
                        ))}
                        {isFetchingNextPage && (
                            <TopicCardSkeleton />
                        )}
                        {search && !hasNextPage && !topicsLoading && topics.length > 0 && (
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
            {newPostsAvailable && (
                <button
                    onClick={handleNewPosts}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 rounded-full bg-foreground text-background px-5 py-2.5 text-sm shadow-lg shadow-black/10 hover:opacity-90 transition-all duration-200 cursor-pointer"
                >
                    New posts — tap to refresh
                </button>
            )}
        </>
    )
}

export default FeedContent