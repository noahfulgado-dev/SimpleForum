import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell } from '@fortawesome/free-regular-svg-icons'
import bellIcon from './../../assets/svg/bell.svg';
import defaultAvatar from './../../assets/image/default_avatar.jpg';

export function Navbar() {
  return (
    <>
        <nav className="border border-gray-300 rounded-[10px] p-2 pl-5 pr-5 flex items-center justify-between bg-[#fafdf6]">
            <div className="text-[1.2rem] text-[#2d2a32] font-medium font-cousine w-[33.3%] flex items-center justify-start rounded-[10px]">
                SimpleForum
            </div>
            <div className="search-holder w-[33.3%] flex items-center justify-center">
                <div className="border w-full border-gray-300 rounded-[10px] p-2 flex items-center justify-between gap-2">
                    <input type="text" placeholder="Search..." className="bg-[#fafdf6] focus:outline-none w-full"/>
                </div>
            </div>
            <div className="flex items-center justify-end gap-4 w-[33.3%]">
                <div className="w-7 h-7 rounded-[5px] flex items-center justify-center hover:bg-[#e5e5e5] transition-all duration-300 ease-in-out cursor-pointer">
                    <img src={bellIcon} alt="Bell" className="w-7 h-7"/>
                </div>
                <div className="relative group w-8 h-8 flex items-center justify-center transition-all duration-300 ease-in-out cursor-pointer">
                    <img src={defaultAvatar} alt="Default Avatar" className="w-8 h-8 border border-gray-800 rounded-full"/>
                    <div className="absolute rounded-full inset-0 bg-gray-900/0 transition-colors duration-300 group-hover:bg-[#e5e5e5]/30"></div>
                </div>
            </div>
        </nav>
    </>
  )
}

export default Navbar