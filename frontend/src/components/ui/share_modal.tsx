import { useRef, useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import defaultAvatar from './../../assets/image/default_avatar.jpg';
import { Button } from './button';
import { forumAPI, type Topic } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { parseSharedDescription } from './shared_quote_card';

interface ShareModalProps {
    topic: Topic;
    onClose: () => void;
    onShare?: () => void;
}

export function ShareModal({ topic, onClose, onShare }: ShareModalProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [content, setContent] = useState('');
    const [error, setError] = useState('');

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        if (!textareaRef.current) return;
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }, [content]);

    const shareMutation = useMutation({
        mutationFn: async () => {
            const lines = content.trim().split('\n');
            const title = lines[0]?.trim() || `Shared @${topic.user.username}'s post`;
            const restContent = lines.slice(1).join('\n').trim();

            const parsed = parseSharedDescription(topic.description);
            let attribution: string;
            if (parsed) {
                const markerStart = topic.description.indexOf('\n\n---\nOriginally shared from @');
                attribution = topic.description.slice(markerStart);
            } else {
                attribution = `\n\n---\nOriginally shared from @${topic.user.username}: "${topic.title}"`;
            }

            const description = restContent ? restContent + attribution : attribution;
            await forumAPI.createTopic({ title, description });
            await forumAPI.shareTopic(topic.id).catch(() => {});
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['topics'] });
            onShare?.();
            onClose();
        },
        onError: () => setError('Failed to share. Please try again.'),
    });

    const handleSubmit = () => {
        setError('');
        shareMutation.mutate();
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="w-[40rem] border border-border rounded-[10px] p-5 flex flex-col gap-4 bg-card">
                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-xl leading-none cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex flex-row gap-3 items-start">
                    <div className="relative group w-10 h-10 flex items-center justify-center shrink-0">
                        <img src={user?.avatar || defaultAvatar} alt="Avatar" className="w-10 h-10 border border-border rounded-full" />
                    </div>
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Add your thoughts..."
                        className="w-full h-fit resize-none focus:outline-none focus:ring-0 focus:border-transparent bg-transparent text-foreground placeholder:text-muted-foreground font-light"
                    />
                </div>

                <div className="border border-border rounded-[10px] p-4 bg-muted/30 flex flex-row gap-3">
                    <div className="relative group w-8 h-8 flex items-center justify-center shrink-0">
                        <img src={topic.user.avatar || defaultAvatar} alt="Avatar" className="w-8 h-8 border border-border rounded-full" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[0.8rem] font-medium text-foreground">
                            @{topic.user.username}
                        </span>
                        <span className="text-[0.85rem] font-semibold text-foreground line-clamp-1">
                            {topic.title}
                        </span>
                        {topic.description && (
                            <span className="text-[0.8rem] font-extralight text-foreground line-clamp-2">
                                {topic.description}
                            </span>
                        )}
                    </div>
                </div>

                {error && (
                    <p className="text-destructive text-sm">{error}</p>
                )}

                <div className="border-t border-border pt-3 flex justify-end">
                    <Button
                        onClick={handleSubmit}
                        disabled={shareMutation.isPending}
                        className="rounded-[5px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {shareMutation.isPending ? 'Sharing...' : 'Share'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default ShareModal
