import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarLeft } from "@/components/ui/sidebar_left"
import { Navbar } from "@/components/ui/navbar"
import { useTheme } from "@/context/ThemeContext"
import { useAuth } from "@/context/AuthContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersAPI, spotifyAPI } from '@/services/api'
import { getSpotifyConnectUrl } from '@/services/axios'
import { Radio } from "lucide-react"

export function Settings() {
  document.title = "Settings | HuniSpace"
  const { theme, toggleTheme } = useTheme()
  const { user: authUser } = useAuth()
  const queryClient = useQueryClient()

  // Fetch profile data
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => usersAPI.getProfile().then(r => r.data),
  })

  // Edit states
  const [editingFirstName, setEditingFirstName] = useState(false)
  const [editingLastName, setEditingLastName] = useState(false)
  const [firstNameDraft, setFirstNameDraft] = useState('')
  const [lastNameDraft, setLastNameDraft] = useState('')

  // Initialize drafts when profile loads
  useEffect(() => {
    if (profile) {
      setFirstNameDraft(profile.first_name ?? '')
      setLastNameDraft(profile.last_name ?? '')
    }
  }, [profile])

  const profileMutation = useMutation({
    mutationFn: (data: { first_name?: string; last_name?: string }) =>
      usersAPI.updateProfile(data).then(r => r.data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['profile'], data)
      if (variables.first_name !== undefined) {
        setFirstNameDraft(data.first_name ?? '')
        setEditingFirstName(false)
        toast.success('First name updated')
      }
      if (variables.last_name !== undefined) {
        setLastNameDraft(data.last_name ?? '')
        setEditingLastName(false)
        toast.success('Last name updated')
      }
    },
    onError: (_err, variables) => {
      if (variables.first_name !== undefined) {
        setFirstNameDraft(profile?.first_name ?? '')
        toast.error('Failed to update first name')
      }
      if (variables.last_name !== undefined) {
        setLastNameDraft(profile?.last_name ?? '')
        toast.error('Failed to update last name')
      }
    },
  })

  const { data: spotifyStatus } = useQuery({
    queryKey: ['spotify', 'status'],
    queryFn: () => spotifyAPI.getStatus().then(r => r.data),
  })

  const disconnectMutation = useMutation({
    mutationFn: () => spotifyAPI.disconnect().then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spotify', 'status'] })
      queryClient.invalidateQueries({ queryKey: ['spotify', 'now-playing'] })
      toast.success('Spotify unlinked')
    },
    onError: () => toast.error('Failed to unlink Spotify'),
  })

  const handleConnectSpotify = () => {
    window.location.href = getSpotifyConnectUrl()
  }

  const handleDisconnect = () => {
    if (!window.confirm('Unlink your Spotify account? The Now Playing card will disconnect.')) return
    disconnectMutation.mutate()
  }

  const saving = profileMutation.isPending

  const handleSaveFirstName = () => {
    if (!firstNameDraft.trim() || firstNameDraft === profile?.first_name) {
      setEditingFirstName(false)
      return
    }
    profileMutation.mutate({ first_name: firstNameDraft.trim() })
  }

  const handleSaveLastName = () => {
    if (!lastNameDraft.trim() || lastNameDraft === profile?.last_name) {
      setEditingLastName(false)
      return
    }
    profileMutation.mutate({ last_name: lastNameDraft.trim() })
  }

  // Handle cancel first name
  const handleCancelFirstName = () => {
    setFirstNameDraft(profile?.first_name ?? '')
    setEditingFirstName(false)
  }

  // Handle cancel last name
  const handleCancelLastName = () => {
    setLastNameDraft(profile?.last_name ?? '')
    setEditingLastName(false)
  }

  // Start editing first name
  const startEditFirstName = () => {
    setFirstNameDraft(profile?.first_name ?? '')
    setEditingFirstName(true)
  }

  // Start editing last name
  const startEditLastName = () => {
    setLastNameDraft(profile?.last_name ?? '')
    setEditingLastName(true)
  }

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-background bg-grid">
        <div className="p-5 pb-0 shrink-0 relative z-50">
          <Navbar />
        </div>
        <SidebarLeft />
        <div className="flex-1 overflow-y-auto px-3 md:px-5 pb-24 xl:pb-5">
          <div className="flex gap-5 justify-center min-h-full">
            <div className="hidden xl:block w-[300px] shrink-0" />
            <div className="flex-1 max-w-[900px] min-w-0 mt-0 md:mt-8">
              <Card className="bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-3xl text-foreground primary-font">Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-muted-foreground">Loading settings...</div>
                </CardContent>
              </Card>
            </div>
            <div className="hidden xl:block w-[300px] shrink-0" />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="h-screen flex flex-col bg-background bg-grid">
        <div className="p-5 pb-0 shrink-0 relative z-50">
          <Navbar />
        </div>
        <SidebarLeft />
        <div className="flex-1 overflow-y-auto px-3 md:px-5 pb-24 xl:pb-5">
          <div className="flex gap-5 justify-center min-h-full">
            <div className="hidden xl:block w-[300px] shrink-0" />
            <div className="flex-1 max-w-[900px] min-w-0 mt-0 md:mt-8 flex justify-center items-center">
              <p className="text-muted-foreground">Could not load settings.</p>
            </div>
            <div className="hidden xl:block w-[300px] shrink-0" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background bg-grid">
      <div className="p-5 pb-0 shrink-0 relative z-50">
        <Navbar />
      </div>
      <SidebarLeft />
      <div className="flex-1 overflow-y-auto px-3 md:px-5 pb-24 xl:pb-5">
        <div className="flex gap-5 justify-center min-h-full">
          <div className="hidden xl:block w-[300px] shrink-0" />
          <div className="flex-1 max-w-[900px] min-w-0 mt-0 md:mt-8">
            <Card className="bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-3xl text-foreground primary-font">Settings</CardTitle>
              </CardHeader>
              <CardContent className="px-6">
                <div className="divide-y divide-border [&>*]:py-5">
                {/* Theme toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Theme</p>
                    <p className="text-xs text-muted-foreground">Switch between light and dark mode</p>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${theme === 'dark' ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-0'}`}
                    />
                  </button>
                </div>

                {/* Email */}
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Email</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    <span>{profile.email || authUser?.email || 'No email'}</span>
                  </div>
                </div>

                {/* First Name */}
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">First Name</div>
                  {editingFirstName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={firstNameDraft}
                        onChange={(e) => setFirstNameDraft(e.target.value)}
                        placeholder="First name"
                        className="flex-1 max-w-xs"
                        disabled={saving}
                      />
                      <Button size="sm" onClick={handleSaveFirstName} disabled={saving}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelFirstName} disabled={saving}>Cancel</Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <p className="text-sm text-foreground">
                        {profile.first_name || <span className="italic text-muted-foreground">Not set</span>}
                      </p>
                      <button
                        onClick={startEditFirstName}
                        className="text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit first name"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          <path d="m15 5 4 4" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Last Name</div>
                  {editingLastName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={lastNameDraft}
                        onChange={(e) => setLastNameDraft(e.target.value)}
                        placeholder="Last name"
                        className="flex-1 max-w-xs"
                        disabled={saving}
                      />
                      <Button size="sm" onClick={handleSaveLastName} disabled={saving}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelLastName} disabled={saving}>Cancel</Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <p className="text-sm text-foreground">
                        {profile.last_name || <span className="italic text-muted-foreground">Not set</span>}
                      </p>
                      <button
                        onClick={startEditLastName}
                        className="text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit last name"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          <path d="m15 5 4 4" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Spotify */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1db954,#121212)]">
                      <Radio className="h-4 w-4 text-white/90" strokeWidth={2} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">Spotify</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {spotifyStatus?.connected
                          ? spotifyStatus.premium === true
                            ? 'Connected · Premium'
                            : 'Connected'
                          : 'Connect to show your Now Playing'}
                      </p>
                    </div>
                  </div>
                  {spotifyStatus?.connected ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDisconnect}
                      disabled={disconnectMutation.isPending}
                    >
                      {disconnectMutation.isPending ? 'Unlinking…' : 'Unlink'}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleConnectSpotify}
                      className="bg-[#1db954] hover:bg-[#1db954]/90 text-white"
                    >
                      <Radio className="h-3.5 w-3.5" strokeWidth={2} />
                      Connect
                    </Button>
                  )}
                </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="hidden xl:block w-[300px] shrink-0" />
        </div>
      </div>
    </div>
  )
}

export default Settings