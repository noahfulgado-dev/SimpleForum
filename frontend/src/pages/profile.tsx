import { useState, useEffect } from 'react'
import { Navbar } from '@/components/ui/navbar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { usersAPI, type User } from '@/services/api';
import defaultAvatar from './../assets/image/default_avatar.jpg';

export function Profile() {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const [bioDraft, setBioDraft] = useState('');
  const [editingBio, setEditingBio] = useState(false);

  useEffect(() => {
    usersAPI.getProfile()
      .then((res) => {
        setProfile(res.data);
        setUsernameDraft(res.data.username);
        setBioDraft(res.data.bio ?? '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSaveUsername = async () => {
    if (!usernameDraft.trim() || usernameDraft === profile?.username) {
      setEditingUsername(false);
      return;
    }
    setSaving(true);
    try {
      const res = await usersAPI.updateProfile({ username: usernameDraft.trim() });
      setProfile(res.data);
      setUsernameDraft(res.data.username);
    } catch {
      setUsernameDraft(profile!.username);
    } finally {
      setSaving(false);
      setEditingUsername(false);
    }
  };

  const handleCancelUsername = () => {
    setUsernameDraft(profile?.username ?? '');
    setEditingUsername(false);
  };

  const handleSaveBio = async () => {
    setSaving(true);
    try {
      const res = await usersAPI.updateProfile({ bio: bioDraft });
      setProfile(res.data);
    } catch {
      setBioDraft(profile?.bio ?? '');
    } finally {
      setSaving(false);
      setEditingBio(false);
    }
  };

  if (loading) {
    return (
      <div className="absolute inset-0 -z-10 h-fit w-full bg-[#fafdf6] bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-size-[40px_40px]">
        <div className="p-5 main-container w-full min-h-screen">
          <Navbar />
          <div className="flex justify-center items-center mt-20">
            <p className="text-gray-500">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="absolute inset-0 -z-10 h-fit w-full bg-[#fafdf6] bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-size-[40px_40px]">
        <div className="p-5 main-container w-full min-h-screen">
          <Navbar />
          <div className="flex justify-center items-center mt-20">
            <p className="text-gray-500">Could not load profile.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 -z-10 h-fit w-full bg-[#fafdf6] bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-size-[40px_40px]">
      <div className="p-5 main-container w-full min-h-screen">
        <Navbar />

        <div className="max-w-2xl mx-auto mt-8 space-y-6">
          <Card className="bg-[#fafdf6]">
            <CardHeader>
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 shrink-0">
                  <img
                    src={profile.avatar || defaultAvatar}
                    alt="Avatar"
                    className="w-24 h-24 border border-gray-300 rounded-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  {editingUsername ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={usernameDraft}
                        onChange={(e) => setUsernameDraft(e.target.value)}
                        className="max-w-xs"
                        disabled={saving}
                      />
                      <Button size="sm" onClick={handleSaveUsername} disabled={saving}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelUsername} disabled={saving}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-2xl">{profile.username}</CardTitle>
                      <button
                        onClick={() => setEditingUsername(true)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit username"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                          <path d="m15 5 4 4"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                <span>{profile.email || authUser?.email || 'No email'}</span>
              </div>

              <div>
                {editingBio ? (
                  <div className="flex items-start gap-2">
                    <Input
                      value={bioDraft}
                      onChange={(e) => setBioDraft(e.target.value)}
                      placeholder="Write something about yourself..."
                      className="flex-1"
                      disabled={saving}
                    />
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" onClick={handleSaveBio} disabled={saving}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditingBio(false); setBioDraft(profile.bio ?? ''); }} disabled={saving}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 group">
                    <p className="text-sm text-gray-700 flex-1">
                      {profile.bio || <span className="italic text-gray-400">No bio yet</span>}
                    </p>
                    <button
                      onClick={() => setEditingBio(true)}
                      className="text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100 shrink-0 mt-0.5"
                      title="Edit bio"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                        <path d="m15 5 4 4"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#fafdf6]">
            <CardHeader>
              <CardTitle>Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <span className="text-2xl font-bold text-gray-900">{profile.follower_count ?? 0}</span>
                  <span className="text-sm text-gray-500">Followers</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <span className="text-2xl font-bold text-gray-900">{profile.following_count ?? 0}</span>
                  <span className="text-sm text-gray-500">Following</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <span className="text-2xl font-bold text-gray-900">{profile.topic_count ?? 0}</span>
                  <span className="text-sm text-gray-500">Topics</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Profile
