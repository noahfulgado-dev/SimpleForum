import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { House, Bookmark, User, Plus, MessageCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Huni } from './huni';
import { Button } from './button';
import BellIcon from './bell_icon';
import defaultAvatar from './../../assets/image/default_avatar.jpg';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { notificationsAPI } from '@/services/api';
import { CreatePost } from './post_modal';

export function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [hasUnread, setHasUnread] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const navItems = [
        { label: 'Home', path: '/feed', icon: House },
        { label: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
        { label: 'Profile', path: '/profile', icon: User },
    ];

    useEffect(() => {
        if (!user) return;
        notificationsAPI.getUnreadCount()
            .then(res => setHasUnread(res.data.count > 0))
            .catch(() => {});
    }, [user]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const q = searchQuery.trim();
        navigate(q ? `/feed?search=${encodeURIComponent(q)}` : '/feed');
    };

    const handlePostCreated = () => {
        queryClient.invalidateQueries({ queryKey: ['topics'] });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setIsCreateModalOpen(false);
    };

    return (
        <>
            <nav className="hidden xl:flex [grid-area:navbar] border border-border rounded-[10px] p-2 pl-5 pr-5 items-center justify-between bg-background w-full relative">
                <div className="w-[33.3%] flex items-center justify-start gap-2">
                    <Link to="/feed">
                        <div className="text-[1.2rem] text-foreground font-medium font-cousine rounded-[10px] flex items-center gap-2">
                            <Huni className="h-8 w-auto hover:-rotate-4 transition-all duration-150 ease-in-out" />
                            <span className="hidden sm:inline">huni</span>
                        </div>
                    </Link>
                </div>
                <div className="search-holder w-[33.3%] flex items-center justify-center">
                    <form onSubmit={handleSearch} className="border w-full border-border rounded-[10px] p-2 flex items-center justify-between gap-2">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-background focus:outline-none w-full text-foreground"
                        />
                    </form>
                </div>
                <div className="flex items-center justify-end gap-1 w-[33.3%]">
                    <Button variant="ghost" size="icon" className="hover:bg-muted">
                        <BellIcon hasUnread={hasUnread} />
                    </Button>
                    <div className="relative group w-8 h-8 flex items-center justify-center transition-all duration-300 ease-in-out cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                        <img src={user?.avatar || defaultAvatar} alt="Avatar" className="w-8 h-8 border border-border rounded-full object-cover" />
                        <div className="absolute rounded-full inset-0 bg-gray-900/0 transition-colors duration-300 group-hover:bg-muted/30"></div>
                    </div>
                    {isOpen && (
                        <div className="absolute top-20 right-5 w-48 bg-card border border-border rounded-[10px] p-2 flex flex-col gap-2 z-50 shadow-lg">
                            <Link to="/profile"><button className="w-full text-left p-2 rounded-[5px] text-foreground hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer">Profile</button></Link>
                            <div className="border-t border-border" />
                            <button
                                onClick={toggleTheme}
                                className="w-full flex items-center justify-between p-2 rounded-[5px] text-foreground hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer"
                            >
                                <span>Dark mode</span>
                                <div className={`w-9 h-5 rounded-full transition-colors duration-300 ${theme === 'dark' ? 'bg-primary' : 'bg-muted-foreground/30'} relative`}>
                                    <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform duration-300 ${theme === 'dark' ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                                </div>
                            </button>
                            <div className="border-t border-border" />
                            <button
                                onClick={() => { logout(); navigate('/'); }}
                                className="w-full text-left p-2 rounded-[5px] text-destructive hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            <div className="xl:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card/90 backdrop-blur-md border border-border/50 rounded-full px-6 py-3 flex items-center gap-6 shadow-lg">
                {navItems.slice(0, 1).map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
                                isActive
                                    ? 'text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-[0.6rem] font-medium">{item.label}</span>
                        </button>
                    );
                })}
                <button
                    className="flex flex-col items-center gap-0.5 text-muted-foreground/50 cursor-not-allowed"
                >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-[0.6rem] font-medium">Messages</span>
                </button>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground hover:brightness-110 transition-all duration-200 cursor-pointer shadow-md"
                >
                    <Plus className="w-5 h-5" />
                </button>
                {navItems.slice(1).map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
                                isActive
                                    ? 'text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-[0.6rem] font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </div>

            {isCreateModalOpen && (
                <CreatePost
                    onClose={() => setIsCreateModalOpen(false)}
                    onPostCreated={handlePostCreated}
                />
            )}
        </>
    )
}

export default Navbar