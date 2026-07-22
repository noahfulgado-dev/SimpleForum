import { useEffect, useRef, useState } from 'react'
import defaultAvatar from './../../assets/image/default_avatar.jpg';
import { Button } from './button';
import { forumAPI } from '@/services/api';

interface CreatePostProps {
    onClose: () => void;
    onPostCreated: () => void;
}

export function CreatePost({ onClose, onPostCreated }: CreatePostProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        if (!textareaRef.current) return;
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }, [description]);

    const handleSubmit = async () => {
        if (!title.trim() || !description.trim()) return;

        setSubmitting(true);
        setError('');

        try {
            await forumAPI.createTopic({ title: title.trim(), description: description.trim() });
            onPostCreated();
            onClose();
        } catch {
            setError('Failed to create post. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div
                className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            >
                <div className="w-[40rem] border border-gray-300 rounded-[10px] p-5 flex flex-row gap-5 bg-[#fafdf6]">
                    <div className="relative group w-10 h-10 flex items-center justify-center transition-all duration-300 ease-in-out cursor-pointer shrink-0">
                        <img src={defaultAvatar} alt="Default Avatar" className="w-10 h-10 border border-gray-800 rounded-full" />
                        <div className="absolute rounded-full inset-0 bg-gray-900/0 transition-colors duration-300 group-hover:bg-[#e5e5e5]/30"></div>
                    </div>
                    <div className="flex flex-col bg-[#fafdf6] w-full">
                        <div className="flex justify-end">
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-[#2d2a32] transition-colors duration-200 text-xl leading-none cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="font-semibold text-2xl">
                            <input
                                type="text"
                                placeholder="Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full focus:outline-none focus:ring-0 focus:border-transparent"
                            />
                        </div>
                        <div className="font-light">
                            <textarea
                                ref={textareaRef}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What's on your mind?"
                                className="w-full h-fit resize-none focus:outline-none focus:ring-0 focus:border-transparent"
                            />
                        </div>
                        {error && (
                            <p className="text-red-500 text-sm mt-1">{error}</p>
                        )}
                        <div className="border-t border-gray-300 mt-2 pt-2 flex justify-end">
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting || !title.trim() || !description.trim()}
                                className="rounded-[5px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Posting...' : 'Post'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default CreatePost