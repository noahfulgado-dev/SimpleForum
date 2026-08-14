import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { House, Bookmark, User, Plus, Settings, Search, Moon, Sun, LogOut } from 'lucide-react';
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
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
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
            <nav className="hidden xl:flex [grid-area:navbar] border border-border rounded-2xl p-2 pl-5 pr-5 items-center justify-between bg-background w-full relative">
                <div className="w-[33.3%] flex items-center justify-start gap-2">
                    <Link to={user ? '/feed' : '/'}>
                        <div className="text-[1.2rem] text-foreground font-medium font-cousine rounded-[10px] flex items-center gap-2">
                            <Huni className="h-8 w-auto hover:-rotate-4 transition-all duration-150 ease-in-out" />
                            <span className="hidden sm:inline">huni</span>
                        </div>
                    </Link>
                </div>
                <div className="search-holder w-[33.3%] flex items-center justify-center">
                    <form onSubmit={handleSearch} className="w-full flex items-center gap-2 rounded-[10px] border border-border bg-muted/40 px-3 py-2 transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
                        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent focus:outline-none w-full text-foreground text-sm placeholder:text-muted-foreground"
                        />
                    </form>
                </div>
                <div className="flex items-center justify-end gap-1 w-[33.3%]">
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="hidden sm:inline-flex items-center gap-1.5 cursor-pointer"
                        size="sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Post</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-muted">
                        <BellIcon hasUnread={hasUnread} />
                    </Button>
                    <div className="relative group w-8 h-8 flex items-center justify-center transition-all duration-300 ease-in-out cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                        <img src={user?.avatar || defaultAvatar} alt="Avatar" className="w-8 h-8 border border-border rounded-full object-cover" />
                        <div className="absolute rounded-full inset-0 bg-gray-900/0 transition-colors duration-300 group-hover:bg-muted/30"></div>
                    </div>
                    {isOpen && (
                        <div className="absolute top-20 right-5 w-48 bg-card border border-border rounded-xl p-2 flex flex-col gap-2 z-50 shadow-xl shadow-black/10">
                            <Link to="/profile"><button className="w-full text-left px-2 py-2 rounded-lg text-foreground flex items-center gap-2 hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer"><User className="w-4 h-4" strokeWidth={1.75} />Profile</button></Link>
                            <div className="border-t border-border" />
                            <button
                                onClick={toggleTheme}
                                className="w-full flex items-center justify-between px-2 py-2 rounded-lg text-foreground hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer"
                            >
                                <span className="flex items-center gap-2">
                                    {theme === 'dark' ? <Moon className="w-4 h-4" strokeWidth={1.75} /> : <Sun className="w-4 h-4" strokeWidth={1.75} />}
                                    Dark mode
                                </span>
                                <div className={`w-9 h-5 rounded-full transition-colors duration-300 ${theme === 'dark' ? 'bg-primary' : 'bg-muted-foreground/30'} relative`}>
                                    <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform duration-300 ${theme === 'dark' ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                                </div>
                            </button>
                            <div className="border-t border-border" />
                            <button
                                onClick={() => { logout(); navigate('/'); }}
                                className="w-full text-left px-2 py-2 rounded-lg text-destructive flex items-center gap-2 hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer"
                            >
                                <LogOut className="w-4 h-4" strokeWidth={1.75} />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            <div className="xl:hidden relative z-40 shrink-0 border-b border-border bg-background/90 backdrop-blur-md">
                <div className="flex h-14 items-center justify-between gap-3 px-4">
                    {mobileSearchOpen ? (
                        <form onSubmit={handleSearch} className="flex w-full items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
                            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent focus:outline-none w-full text-foreground text-sm placeholder:text-muted-foreground"
                            />
                            <button
                                type="button"
                                onClick={() => setMobileSearchOpen(false)}
                                className="text-muted-foreground text-xs cursor-pointer shrink-0"
                            >
                                Cancel
                            </button>
                        </form>
                    ) : (
                        <>
                            <Link to={user ? '/feed' : '/'} className="shrink-0">
                                <div className="flex items-center gap-2 text-[1.1rem] text-foreground font-medium font-cousine">
                                    <Huni className="h-7 w-auto" />
                                    <span>huni</span>
                                </div>
                            </Link>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="hover:bg-muted" onClick={() => setMobileSearchOpen(true)}>
                                    <Search className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="hover:bg-muted">
                                    <BellIcon hasUnread={hasUnread} />
                                </Button>
                                <div
                                    className="relative w-8 h-8 flex items-center justify-center cursor-pointer"
                                    onClick={() => setIsOpen(!isOpen)}
                                >
                                    <img src={user?.avatar || defaultAvatar} alt="Avatar" className="w-8 h-8 border border-border rounded-full object-cover" />
                                </div>
                            </div>
                        </>
                    )}
                </div>
                {isOpen && (
                    <div className="absolute right-4 top-14 w-48 bg-card border border-border rounded-xl p-2 flex flex-col gap-2 z-50 shadow-xl shadow-black/10">
                        <Link to="/profile"><button onClick={() => setIsOpen(false)} className="w-full text-left px-2 py-2 rounded-lg text-foreground flex items-center gap-2 hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer"><User className="w-4 h-4" strokeWidth={1.75} />Profile</button></Link>
                        <div className="border-t border-border" />
                        <button
                            onClick={toggleTheme}
                            className="w-full flex items-center justify-between px-2 py-2 rounded-lg text-foreground hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer"
                        >
                            <span className="flex items-center gap-2">
                                {theme === 'dark' ? <Moon className="w-4 h-4" strokeWidth={1.75} /> : <Sun className="w-4 h-4" strokeWidth={1.75} />}
                                Dark mode
                            </span>
                            <div className={`w-9 h-5 rounded-full transition-colors duration-300 ${theme === 'dark' ? 'bg-primary' : 'bg-muted-foreground/30'} relative`}>
                                <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform duration-300 ${theme === 'dark' ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                            </div>
                        </button>
                        <div className="border-t border-border" />
                        <button
                            onClick={() => { setIsOpen(false); logout(); navigate('/'); }}
                            className="w-full text-left px-2 py-2 rounded-lg text-destructive flex items-center gap-2 hover:bg-muted transition-all duration-300 ease-in-out cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" strokeWidth={1.75} />
                            Logout
                        </button>
                    </div>
                )}
            </div>

            <div className="xl:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card/90 backdrop-blur-md border border-border/50 rounded-full px-6 py-3 flex items-center gap-6 shadow-xl shadow-black/10">
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
                    onClick={() => navigate('/settings')}
                    className="flex flex-col items-center gap-0.5 transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                >
                    <Settings className="w-5 h-5" />
                    <span className="text-[0.6rem] font-medium">Settings</span>
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