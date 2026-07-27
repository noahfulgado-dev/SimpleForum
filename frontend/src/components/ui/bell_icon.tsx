import { Bell, BellDot } from 'lucide-react'

interface BellIconProps {
    hasUnread?: boolean
}

export default function BellIcon({ hasUnread = false }: BellIconProps) {
    const Icon = hasUnread ? BellDot : Bell
    return (
        <Icon className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
    )
}
