import { useSearchParams } from 'react-router-dom';
import { FeedContent } from '@/components/ui/feed_content';
import { Navbar } from '@/components/ui/navbar';
import SidebarLeft from '@/components/ui/sidebar_left';
import SidebarRight from '@/components/ui/sidebar_right';

export function Feed() {
    document.title = "Feed | SimpleForum";
    const [searchParams] = useSearchParams();
    const search = searchParams.get('search') || '';

    return (
        <div className="h-screen flex flex-col bg-[#fafdf6] bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-size-[40px_40px]">
            <div className="p-5 pb-0 shrink-0 relative z-50">
                <Navbar />
            </div>
            <SidebarLeft />
            <SidebarRight />
            <div className="flex-1 overflow-y-auto px-5 pb-5">
                <div className="flex gap-5 justify-center min-h-full">
                    <div className="w-[300px] shrink-0" />
                    <div className="flex-1 max-w-[900px] min-w-0">
                        <FeedContent search={search} />
                    </div>
                    <div className="w-[300px] shrink-0" />
                </div>
            </div>
        </div>
    )
}

export default Feed