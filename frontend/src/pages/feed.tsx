import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { FeedContent } from '@/components/ui/feed_content';
import { Navbar } from '@/components/ui/navbar';
import SidebarLeft from '@/components/ui/sidebar_left';
import SidebarRight from '@/components/ui/sidebar_right';
import { NowPlayingCard } from '@/components/ui/now_playing';
import { PullIndicator } from '@/components/ui/pull_indicator';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

export function Feed() {
    document.title = "Feed | HuniSpace";
    const [searchParams] = useSearchParams();
    const search = searchParams.get('search') || '';
    const queryClient = useQueryClient();
    const { containerRef, pull, refreshing } = usePullToRefresh(() =>
        queryClient.invalidateQueries({ queryKey: ['topics'] })
    );

    return (
        <div className="h-screen flex flex-col bg-background bg-grid">
            <div className="xl:block p-0 xl:p-5 xl:pb-0 shrink-0 relative z-50">
                <Navbar />
            </div>
            <SidebarLeft />
            <SidebarRight />
            <div ref={containerRef} id="feed-scroll" className="relative flex-1 overflow-y-auto px-3 md:px-5 pb-24 xl:pb-5">
                <PullIndicator pull={pull} refreshing={refreshing} />

                <div className="flex gap-5 justify-center min-h-full">
                    <div className="hidden xl:block w-[300px] shrink-0" />
                    <div className="flex-1 max-w-[900px] min-w-0">
                        <div className="xl:hidden mt-4">
                            <NowPlayingCard />
                        </div>
                        <div className="mb-6 mt-6 flex items-center justify-center gap-3 md:mt-8">
                            <span className="h-2.5 w-2.5 rounded-[2px] bg-primary" aria-hidden="true" />
                            <span className="font-cousine text-[0.7rem] uppercase tracking-[0.3em] text-foreground">
                                the feed
                            </span>
                            <span className="h-px w-16 bg-border" aria-hidden="true" />
                            <span className="font-cousine text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground">
                                Nº 001 · est. 2026
                            </span>
                        </div>
                        <FeedContent search={search} />
                    </div>
                    <div className="hidden xl:block w-[300px] shrink-0" />
                </div>
            </div>
        </div>
    )
}

export default Feed