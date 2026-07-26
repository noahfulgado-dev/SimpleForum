import type { User } from '@/services/api'

interface ProfileStatsProps {
  profile: User
}

export function ProfileStats({ profile }: ProfileStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-4 text-center">
      <div className="flex flex-col items-center p-3 rounded-lg bg-muted border border-border">
        <span className="text-2xl font-bold text-foreground">{profile.follower_count ?? 0}</span>
        <span className="text-sm text-muted-foreground">Followers</span>
      </div>
      <div className="flex flex-col items-center p-3 rounded-lg bg-muted border border-border">
        <span className="text-2xl font-bold text-foreground">{profile.following_count ?? 0}</span>
        <span className="text-sm text-muted-foreground">Following</span>
      </div>
      <div className="flex flex-col items-center p-3 rounded-lg bg-muted border border-border">
        <span className="text-2xl font-bold text-foreground">{profile.topic_count ?? 0}</span>
        <span className="text-sm text-muted-foreground">Topics</span>
      </div>
    </div>
  )
}