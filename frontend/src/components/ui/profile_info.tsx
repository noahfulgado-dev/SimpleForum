import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ProfileInfoProps {
  username: string
  editingUsername: boolean
  usernameDraft: string
  saving: boolean
  onUsernameDraftChange: (v: string) => void
  onStartEditUsername: () => void
  onSaveUsername: () => void
  onCancelUsername: () => void
}

export function ProfileInfo({
  username, editingUsername, usernameDraft, saving,
  onUsernameDraftChange, onStartEditUsername, onSaveUsername, onCancelUsername,
}: ProfileInfoProps) {
  return editingUsername ? (
    <div className="flex items-center gap-2">
      <Input
        value={usernameDraft}
        onChange={(e) => onUsernameDraftChange(e.target.value)}
        className="max-w-xs"
        disabled={saving}
      />
      <Button size="sm" onClick={onSaveUsername} disabled={saving}>Save</Button>
      <Button size="sm" variant="ghost" onClick={onCancelUsername} disabled={saving}>Cancel</Button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <h2 className="text-2xl font-semibold text-foreground">{username}</h2>
      <button
        onClick={onStartEditUsername}
        className="text-muted-foreground hover:text-foreground transition-colors"
        title="Edit username"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </svg>
      </button>
    </div>
  )
}