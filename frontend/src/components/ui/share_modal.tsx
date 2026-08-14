import { useRef, useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import defaultAvatar from './../../assets/image/default_avatar.jpg';
import { Button } from './button';
import { forumAPI, type Topic } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { ModalShell, ModalHeader } from './modal';

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
            const attribution = `\n\n---\nOriginally shared from @${topic.user.username}: "${topic.title}"`;
            const description = content.trim() ? content.trim() + attribution : attribution;
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
        <ModalShell onClose={onClose} label="Share post">
            <div className="flex flex-col gap-4 p-6">
                <ModalHeader eyebrow="share · Nº 03" onClose={onClose} />

                <div className="flex flex-row gap-3 items-start">
                    <img src={user?.avatar || defaultAvatar} alt="Avatar" className="w-10 h-10 shrink-0 border border-border rounded-full" />
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Add your thoughts..."
                        className="w-full h-fit resize-none focus:outline-none focus:ring-0 focus:border-transparent bg-transparent text-foreground placeholder:text-muted-foreground font-light"
                    />
                </div>

                <div className="border border-border rounded-2xl p-4 bg-primary/[0.06] flex flex-row gap-3">
                    <img src={topic.user.avatar || defaultAvatar} alt="Avatar" className="w-8 h-8 shrink-0 border border-border rounded-full" />
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

                <div className="border-t border-border pt-4 flex justify-end">
                    <Button
                        onClick={handleSubmit}
                        disabled={shareMutation.isPending}
                        className="rounded-full px-5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {shareMutation.isPending ? 'Sharing...' : 'Share'}
                    </Button>
                </div>
            </div>
        </ModalShell>
    )
}

export default ShareModal
