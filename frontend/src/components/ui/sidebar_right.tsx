import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '@/services/api';
import defaultAvatar from './../../assets/image/default_avatar.jpg';
import { timeAgo } from '@/lib/time';
import { UserPlus } from 'lucide-react';

export function SidebarRight() {
  const navigate = useNavigate();

  const { data: followingData } = useQuery({
    queryKey: ['following'],
    queryFn: () => usersAPI.getFollowing().then(r => r.data),
  });

  const following = followingData?.results ?? [];

  return (
    <div className="hidden xl:flex fixed top-[88px] right-5 w-[300px] flex-col rounded-[15px] border border-border bg-card shadow-sm p-5 gap-5 z-40 h-[calc(100vh-108px)] overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Following</h3>
        <span className="text-[0.65rem] text-muted-foreground font-medium tabular-nums">{following.length}</span>
      </div>
      {following.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-[10px] bg-muted/40 border border-dashed border-border py-8 px-4 text-center">
          <UserPlus className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
          <p className="text-xs text-muted-foreground leading-relaxed">
            You aren't following anyone yet.
          </p>
        </div>
      )}
      <div className="flex flex-col gap-1">
        {following.map(user => (
          <div
            key={user.id}
            onClick={() => navigate(`/profile/${user.id}`)}
            className="flex items-center gap-3 cursor-pointer hover:bg-muted/60 rounded-[10px] p-2 -mx-2 transition-colors"
          >
            <div className="relative shrink-0">
              <img
                src={user.avatar || defaultAvatar}
                alt={user.username}
                className="w-8 h-8 rounded-full border border-border object-cover"
              />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${
                  user.is_online ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-foreground truncate">
                @{user.username}
              </span>
              <span className="text-[0.65rem] text-muted-foreground">
                {user.is_online ? 'Online now' : timeAgo(user.last_seen ?? '')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SidebarRight;