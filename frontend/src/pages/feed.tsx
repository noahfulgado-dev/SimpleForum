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
        <>
            <div className="absolute inset-0 -z-10 h-fit w-full bg-[#fafdf6] bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-size-[40px_40px]">
                <div className="p-5 main-container w-full min-h-screen">
                    <Navbar />
                    <SidebarLeft />
                    <FeedContent search={search} />
                    <SidebarRight />
                </div>
            </div>
        </>
    )
}

export default Feed