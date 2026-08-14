import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import defaultAvatar from './../../assets/image/default_avatar.jpg';
import { Button } from './button';
import { forumAPI, type Topic } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { ModalShell, ModalHeader } from './modal';

interface EditPostModalProps {
    topic: Topic;
    onClose: () => void;
}

export function EditPostModal({ topic, onClose }: EditPostModalProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [title, setTitle] = useState(topic.title);
    const [description, setDescription] = useState(topic.description);
    const [error, setError] = useState('');

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        if (!textareaRef.current) return;
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }, [description]);

    const topicMutation = useMutation({
        mutationFn: () => forumAPI.updateTopic(topic.id, { title: title.trim(), description: description.trim() }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['topics'] });
            queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
            onClose();
        },
        onError: () => setError('Failed to update post. Please try again.'),
    });

    const handleSubmit = () => {
        if (!title.trim() || !description.trim()) return;
        setError('');
        topicMutation.mutate();
    };

    return (
        <ModalShell onClose={onClose} label="Edit post">
            <div className="flex flex-col gap-4 p-6">
                <ModalHeader eyebrow="edit post · Nº 02" onClose={onClose} />

                <div className="flex flex-row gap-3 items-start">
                    <img src={user?.avatar || defaultAvatar} alt="Avatar" className="w-10 h-10 shrink-0 border border-border rounded-full" />
                    <div className="flex flex-col w-full gap-1">
                        <div className="font-semibold text-2xl text-foreground">
                            <input
                                type="text"
                                placeholder="Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full focus:outline-none focus:ring-0 focus:border-transparent bg-transparent text-foreground placeholder:text-muted-foreground"
                            />
                        </div>
                        <div className="font-light text-foreground">
                            <textarea
                                ref={textareaRef}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What's on your mind?"
                                className="w-full h-fit resize-none focus:outline-none focus:ring-0 focus:border-transparent bg-transparent text-foreground placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>
                </div>

                {error && (
                    <p className="text-destructive text-sm">{error}</p>
                )}
                <div className="border-t border-border pt-4 flex justify-end">
                    <Button
                        onClick={handleSubmit}
                        disabled={topicMutation.isPending || !title.trim() || !description.trim()}
                        className="rounded-full px-5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {topicMutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </div>
        </ModalShell>
    )
}

export default EditPostModal
