import { Navbar } from '@/components/ui/navbar';
import SidebarLeft from '@/components/ui/sidebar_left';
import React from 'react'

export function Feed() {
    document.title = "Feed | SimpleForum";

    return (
        <> 
            <div className="p-5">
                <Navbar />
                <SidebarLeft />
                <div className="absolute inset-0 -z-10 h-full w-full bg-[#fafdf6] bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-size-[40px_40px] flex items-center justify-center">
                    <div className="w-dvw h-1/2 flex items-center justify-center flex-col gap-5">
                        <h1 className="text-[clamp(0.5rem,5vw,3rem)] font-semibold leading-none text-[#2d2a32] font-geist">
                            SimpleForum
                        </h1>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Feed