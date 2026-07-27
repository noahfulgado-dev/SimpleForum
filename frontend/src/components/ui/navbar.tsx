import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { Huni } from './huni';
import { Button } from './button';
import BellIcon from './bell_icon';
import defaultAvatar from './../../assets/image/default_avatar.jpg';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { notificationsAPI } from '@/services/api';

export function Navbar() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [hasUnread, setHasUnread] = useState(false);

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

    return (
        <>
            <nav className="[grid-area:navbar] border border-border rounded-[10px] p-2 pl-5 pr-5 flex items-center justify-between bg-background w-full">
                <div className="w-[33.3%] flex items-center justify-start">
                    <Link to="/feed">
                        <div className="text-[1.2rem] text-foreground font-medium font-cousine rounded-[10px] flex items-center gap-2">
                            <Huni className="h-8 w-auto hover:-rotate-4 transition-all duration-150 ease-in-out" />
                            <span>huni</span>
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
                    <Button variant="ghost" size="icon">
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
                        </div>
                    )}
                </div>
            </nav>
        </>
    )
}

export default Navbar