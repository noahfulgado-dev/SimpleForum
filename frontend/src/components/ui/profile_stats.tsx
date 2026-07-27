import type { User } from '@/services/api'

interface ProfileStatsProps {
  profile: User
}

export function ProfileStats({ profile }: ProfileStatsProps) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
      <span>
        <strong className="text-foreground font-medium">{profile.follower_count ?? 0}</strong> Followers
      </span>
      <span className="text-xs text-muted-foreground">•</span>
      <span>
        <strong className="text-foreground font-medium">{profile.following_count ?? 0}</strong> Following
      </span>
      <span className="text-xs text-muted-foreground">•</span>
      <span>
        <strong className="text-foreground font-medium">{profile.topic_count ?? 0}</strong> Topics
      </span>
      <span className="text-xs text-muted-foreground">•</span>
      <span>
        <strong className="text-foreground font-medium">{profile.total_likes ?? 0}</strong> Hearts
      </span>
    </div>
  )
}
