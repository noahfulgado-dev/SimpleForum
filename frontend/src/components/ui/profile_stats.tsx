import type { User } from '@/services/api'

interface ProfileStatsProps {
  profile: User
}

export function ProfileStats({ profile }: ProfileStatsProps) {
  const stats = [
    { value: profile.follower_count ?? 0, label: 'Followers' },
    { value: profile.following_count ?? 0, label: 'Following' },
    { value: profile.topic_count ?? 0, label: 'Topics' },
    { value: profile.total_likes ?? 0, label: 'Hearts' },
  ]

  return (
    <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
      {stats.map(({ value, label }) => (
        <div key={label} className="rounded-xl bg-primary/10 py-3">
          <p className="primary-font text-lg font-semibold text-foreground tabular-nums">{value}</p>
          <p className="text-[0.7rem] text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  )
}
