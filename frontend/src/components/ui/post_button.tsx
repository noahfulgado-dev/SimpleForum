import { useState } from 'react'
import { Button } from './button'
import { CreatePost } from './post_modal';

interface PostButtonProps {
    onPostCreated: () => void;
}

export function PostButton({ onPostCreated }: PostButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    return (
        <>
            <Button type="submit" onClick={openModal} className="w-fit cursor-pointer dark:bg-primary hover:brightness-75 transition-all duration-300 ease-in-out">
                Create Post
            </Button>

            {isModalOpen && (
                <CreatePost onClose={closeModal} onPostCreated={onPostCreated} />
            )}
        </>
    )
}

export default PostButton