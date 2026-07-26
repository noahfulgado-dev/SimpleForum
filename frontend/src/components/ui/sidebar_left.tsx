import { useNavigate, useLocation } from 'react-router-dom';

export function SidebarLeft() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Home', path: '/feed', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { label: 'Bookmarks', path: '/bookmarks', icon: 'M5 5V19L12 15.5L19 19V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5Z' },
    { label: 'Profile', path: '/profile', icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
  ];

  return (
    <div className="fixed top-[88px] left-5 w-[300px] rounded-[15px] border border-border p-5 flex flex-col gap-5 bg-card z-40 h-[calc(100vh-108px)]">
      <h1 className="text-foreground text-xl font-semibold">SimpleForum</h1>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-foreground/10 text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d={item.icon} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {item.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default SidebarLeft
