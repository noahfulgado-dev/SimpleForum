import defaultAvatar from './../../assets/image/default_avatar.jpg';

interface SharedFrom {
    username: string;
    title: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export function parseSharedDescription(description: string | undefined): { text: string; sharedFrom: SharedFrom } | null {
    if (!description) return null;
    const marker = '\n\n---\nOriginally shared from @';
    const idx = description.indexOf(marker);
    if (idx === -1) return null;
    const text = description.slice(0, idx);
    const rest = description.slice(idx + marker.length);
    const colonIdx = rest.indexOf(': "');
    if (colonIdx === -1) return null;
    const username = rest.slice(0, colonIdx);
    const title = rest.slice(colonIdx + 3, rest.length - 1);
    return { text, sharedFrom: { username, title } };
}

export function SharedQuoteCard({ sharedFrom }: { sharedFrom: SharedFrom }) {
    return (
        <div className="border border-border rounded-[10px] p-3 bg-muted/30 flex flex-row gap-2 mt-2">
            <div className="relative group w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">
                <img src={defaultAvatar} alt="Avatar" className="w-6 h-6 border border-border rounded-full" />
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-[0.7rem] font-medium text-foreground/70">Originally shared from</span>
                <span className="text-[0.75rem] font-medium text-foreground">@{sharedFrom.username}</span>
                <span className="text-[0.75rem] font-extralight text-foreground line-clamp-1">"{sharedFrom.title}"</span>
            </div>
        </div>
    )
}
