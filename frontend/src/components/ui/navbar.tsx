import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import bellIcon from './../../assets/svg/bell.svg';
import defaultAvatar from './../../assets/image/default_avatar.jpg';
import { useAuth } from '@/context/AuthContext';

export function Navbar() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const q = searchQuery.trim();
        navigate(q ? `/feed?search=${encodeURIComponent(q)}` : '/feed');
    };

    return (
        <>
            <nav className="[grid-area:navbar] border border-gray-300 rounded-[10px] p-2 pl-5 pr-5 flex items-center justify-between bg-[#fafdf6] w-full">
                <div className="w-[33.3%] flex items-center justify-start">
                    <Link to="/feed">
                        <div className="text-[1.2rem] text-[#2d2a32] font-medium font-cousine rounded-[10px]">
                            SimpleForum
                        </div>
                    </Link>
                </div>
                <div className="search-holder w-[33.3%] flex items-center justify-center">
                    <form onSubmit={handleSearch} className="border w-full border-gray-300 rounded-[10px] p-2 flex items-center justify-between gap-2">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-[#fafdf6] focus:outline-none w-full"
                        />
                    </form>
                </div>
                <div className="flex items-center justify-end gap-4 w-[33.3%]">
                    <div className="w-7 h-7 rounded-[5px] flex items-center justify-center hover:bg-[#e5e5e5] transition-all duration-300 ease-in-out cursor-pointer">
                        <img src={bellIcon} alt="Bell" className="w-7 h-7" />
                    </div>
                    <div className="relative group w-8 h-8 flex items-center justify-center transition-all duration-300 ease-in-out cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                        <img src={user?.avatar || defaultAvatar} alt="Avatar" className="w-8 h-8 border border-gray-800 rounded-full" />
                        <div className="absolute rounded-full inset-0 bg-gray-900/0 transition-colors duration-300 group-hover:bg-[#e5e5e5]/30"></div>
                    </div>
                    {isOpen && (
                        <div className="absolute top-20 right-5 w-48 bg-[#fafdf6] border border-gray-300 rounded-[10px] p-2 flex flex-col gap-2 z-50">
                            <Link to="/profile"><button className="w-full text-left p-2 rounded-[5px] hover:bg-[#e5e5e5] transition-all duration-300 ease-in-out cursor-pointer">Profile</button></Link>
                        </div>
                    )}
                </div>
            </nav>
        </>
    )
}

export default Navbar