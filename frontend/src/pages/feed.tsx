import { FeedContent } from '@/components/ui/feed_content';
import { Navbar } from '@/components/ui/navbar';
import SidebarLeft from '@/components/ui/sidebar_left';
import SidebarRight from '@/components/ui/sidebar_right';
import React from 'react'

export function Feed() {
    document.title = "Feed | SimpleForum";

    return (
        <> 
            <div className="absolute inset-0 -z-10 h-full w-full bg-[#fafdf6] bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-size-[40px_40px]">
            <div className="p-5 main-container w-full h-full">
                <Navbar />
                <SidebarLeft />
                <FeedContent />
                <SidebarRight />
                </div>
            </div>
        </>
    )
}

export default Feed