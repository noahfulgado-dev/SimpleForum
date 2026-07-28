import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import defaultAvatar from './../../assets/image/default_avatar.jpg';
import { Button } from './button';
import { forumAPI, type Topic } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

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
        <>
            <div
                className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            >
                <div className="w-[40rem] border border-border rounded-[10px] p-5 flex flex-row gap-5 bg-card">
                    <div className="relative group w-10 h-10 flex items-center justify-center transition-all duration-300 ease-in-out cursor-pointer shrink-0">
                        <img src={user?.avatar || defaultAvatar} alt="Avatar" className="w-10 h-10 border border-border rounded-full" />
                        <div className="absolute rounded-full inset-0 bg-gray-900/0 transition-colors duration-300 group-hover:bg-muted/30"></div>
                    </div>
                    <div className="flex flex-col bg-transparent w-full">
                        <div className="flex justify-end">
                            <button
                                onClick={onClose}
                                className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-xl leading-none cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
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
                        {imagePreview && (
                            <div className="relative mt-2 w-full max-h-48 overflow-hidden rounded-[5px]">
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-[5px]" />
                                <button
                                    onClick={removeImage}
                                    className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center text-xs cursor-pointer hover:bg-black/70"
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
                            <p className="text-destructive text-sm mt-1">{error}</p>
                        )}
                        <div className="border-t border-border mt-2 pt-2 flex justify-between items-center">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-muted-foreground hover:text-foreground transition-colors text-sm cursor-pointer"
                            >
                                Attach Image
                            </button>
                            <Button
                                onClick={handleSubmit}
                                disabled={topicMutation.isPending || !title.trim() || !description.trim()}
                                className="rounded-[5px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary! hover:brightness-75"
                            >
                                {topicMutation.isPending ? 'Posting...' : 'Post'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default CreatePost