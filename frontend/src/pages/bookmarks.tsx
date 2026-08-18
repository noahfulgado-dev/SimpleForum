import { useQuery, useQueryClient } from '@tanstack/react-query';
import { forumAPI, type BookmarkEntry } from '@/services/api';
import { Navbar } from '@/components/ui/navbar';
import SidebarLeft from '@/components/ui/sidebar_left';
import SidebarRight from '@/components/ui/sidebar_right';
import { Post } from '@/components/ui/post';
import { TopicCardSkeleton } from '@/components/ui/skeleton';
import { PullIndicator } from '@/components/ui/pull_indicator';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

export function Bookmarks() {
    document.title = "Bookmarks | HuniSpace";

    const queryClient = useQueryClient();
    const { containerRef, pull, refreshing } = usePullToRefresh(() =>
        queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    );

    const { data, isLoading, error } = useQuery({
        queryKey: ['bookmarks'],
        queryFn: () => forumAPI.getBookmarks().then(r => r.data),
    });

    const bookmarks: BookmarkEntry[] = data?.results ?? [];

    return (
        <div className="h-dvh flex flex-col bg-background bg-grid">
            <div className="xl:block p-0 xl:p-5 xl:pb-0 shrink-0 relative z-50">
                <Navbar />
            </div>
            <SidebarLeft />
            <SidebarRight />
            <div ref={containerRef} className="relative flex-1 overflow-y-auto px-3 md:px-5 pb-24 xl:pb-5">
                <PullIndicator pull={pull} refreshing={refreshing} />
                <div className="flex gap-5 justify-center min-h-full">
                    <div className="hidden xl:block w-[300px] shrink-0" />
                    <div className="flex-1 max-w-[900px] min-w-0">
                        <div className="rounded-none md:rounded-[10px] p-0 md:p-5 flex flex-col gap-5 pl-0 pr-0 md:pl-10 md:pr-10 items-center">
                            <div className="flex flex-col gap-5 w-full">
                                <div className="max-w-[700px] mx-auto w-full">
                                    <h1 className="text-[clamp(0.5rem,5vw,2.5rem)] font-semibold leading-none text-foreground font-geist text-left">
                                        Bookmarks
                                    </h1>
                                </div>
                                <div className="flex flex-col gap-5 w-full">
                                    {isLoading && (
                                        <div className="flex flex-col gap-5">
                                            <TopicCardSkeleton />
                                            <TopicCardSkeleton />
                                            <TopicCardSkeleton />
                                        </div>
                                    )}
                                    {error && (
                                        <div className="text-center text-destructive py-8">Failed to load bookmarks.</div>
                                    )}
                                    {!isLoading && !error && bookmarks.length === 0 && (
                                        <div className="text-center text-muted-foreground py-8">No bookmarks yet.</div>
                                    )}
                                    {!isLoading && !error && bookmarks.map((bm) => (
                                        <Post key={bm.id} topic={bm.content} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="hidden xl:block w-[300px] shrink-0" />
                </div>
            </div>
        </div>
    )
}

export default Bookmarks
