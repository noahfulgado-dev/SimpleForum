import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import defaultAvatar from './../../assets/image/default_avatar.jpg';
import { Button } from './button';
import { forumAPI, type Topic } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { ModalShell, ModalHeader } from './modal';

interface CreatePostProps {
    onClose: () => void;
    onPostCreated: () => void;
}

export function CreatePost({ onClose, onPostCreated }: CreatePostProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        if (!textareaRef.current) return;
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }, [description]);

    const uploadImageMutation = useMutation({
        mutationFn: ({ topicId, file }: { topicId: number; file: File }) =>
            forumAPI.uploadTopicImage(topicId, file),
    });

    const topicMutation = useMutation({
        mutationFn: () => forumAPI.createTopic({ title: title.trim(), description: description.trim() }),
        onSuccess: async (response) => {
            const newTopic: Topic = response.data;
            if (selectedImage) {
                await uploadImageMutation.mutateAsync({ topicId: newTopic.id, file: selectedImage });
                const updated = await forumAPI.getTopic(newTopic.id);
                Object.assign(newTopic, updated.data);
            }
            queryClient.setQueryData(['topics', ''], (old: { pages: { results: Topic[]; count: number; next: string | null }[]; pageParams: number[] } | undefined) => {
                if (!old) return { pages: [{ results: [newTopic], count: 1, next: null }], pageParams: [1] };
                return {
                    ...old,
                    pages: old.pages.map((page, i) =>
                        i === 0 ? { ...page, results: [newTopic, ...page.results], count: page.count + 1 } : page
                    ),
                };
            });
            onPostCreated();
            onClose();
        },
        onError: () => setError('Failed to create post. Please try again.'),
    });

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = () => {
        if (!title.trim() || !description.trim()) return;
        setError('');
        topicMutation.mutate();
    };

    return (
        <ModalShell onClose={onClose} label="Create post">
            <div className="flex flex-col gap-4 p-6">
                <ModalHeader eyebrow="new post · Nº 01" onClose={onClose} />

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

                {imagePreview && (
                    <div className="relative mt-2 w-full max-h-48 overflow-hidden rounded-xl">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                        <button
                            onClick={removeImage}
                            className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center text-xs cursor-pointer hover:bg-black/70"
                        >
                            ✕
                        </button>
                    </div>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                />
                {error && (
                    <p className="text-destructive text-sm">{error}</p>
                )}
                <div className="border-t border-border pt-4 flex justify-between items-center">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer text-muted-foreground hover:text-foreground"
                        title="Attach Image"
                    >
                        <svg className="w-5 h-5" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                    </button>
                    <Button
                        onClick={handleSubmit}
                        disabled={topicMutation.isPending || !title.trim() || !description.trim()}
                        className="rounded-full px-5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {topicMutation.isPending ? 'Posting...' : 'Post'}
                    </Button>
                </div>
            </div>
        </ModalShell>
    )
}

export default CreatePost
